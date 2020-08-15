const popupClickTarget = document.querySelector('#popup-click-target')
const poolPopup = document.querySelector('#pool-popup')
const snackbar = document.querySelector('#snackbar')
const pageSpinner = document.querySelector('#page-spinner')

const initialization = ([pools, contryPolygons, populatedPlaces]) => {
    pageSpinner.classList.remove('hidden')

    const poolColor = 'rgba(255, 255, 0, 0.8)'
    const cityColor = '#eeeeee'
    const clickPoolSelectionRadiusKm = 50

    const duplicatedRelays = {}
    pools = pools.filter(pool => {
        const key = [pool.meta.ticker, pool.geo.lat, pool.geo.long].join('_')
        if (!duplicatedRelays[key]) {
            duplicatedRelays[key] = 1
            return true
        }
        duplicatedRelays[key]++
        return false
    })

    const lPoolData = pools.map(pool => {
        return {
            text: '',
            lat: pool.geo.lat,
            long: pool.geo.long,
            size: 0.6,
            dotRadius: 0.3,
            color: poolColor,
            altitude: 0.006,
            type: 'pool'
        }
    })

    const lPopulatedPlacesData = populatedPlaces.features.map(populatedPlace => {
        return {
            text: populatedPlace.properties.name,
            lat: populatedPlace.properties.latitude,
            long: populatedPlace.properties.longitude,
            size: 0.4,
            dotRadius: 0.2,
            color: cityColor,
            altitude: 0.0055,
            type: 'populatedPlace'
        }
    })

    const lData = lPoolData.concat(lPopulatedPlacesData);

    let cameraAltitude = null;
    const globe = Globe({ waitForGlobeReady: true })(document.getElementById('globe'))
        .globeImageUrl('/img/earth-blue-marble.jpg')
        .backgroundImageUrl('/img/night-sky.png')
        .bumpImageUrl('/img/earth-topology.png')

        .labelsData(lData)
        .labelLat('lat')
        .labelLng('long')
        .labelText('text')
        .labelSize('size')
        .labelDotRadius('dotRadius')
        .labelColor('color')
        .labelResolution(2)
        .labelAltitude(0.0055)

        .onZoom(({ lat, lng, altitude }) => {
            if (cameraAltitude != Utils.round(altitude, 2)) {
                cameraAltitude = Utils.round(altitude, 2)

                poolPopup.MaterialMenu.hide()
            }
        })

        .polygonsData(contryPolygons.features)
        .polygonCapColor(() => 'rgba(200, 0, 0, 0.0)')
        .polygonSideColor(() => 'rgba(150, 150, 150, 0.4)')
        .polygonStrokeColor(() => '#aaaaaa')
        .polygonAltitude(0.005)
        // .polygonLabel(({ properties: d }) => `
        //     <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        //     GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
        //     Population: <i>${d.POP_EST}</i>
        //     `)

    const globeDOM = document.getElementById('globe')

    Tappable(globeDOM)
    globeDOM.addEventListener('tap', event => {
        const pos = globe.toGlobeCoords(event.detail.clientX, event.detail.clientY)
        if (pos === null) {
            return
        }
        pos.long = pos.lng
        delete pos.lng

        const poolsRadius = pools.filter(pool => Utils.haversineDistance(pool.geo, pos) < clickPoolSelectionRadiusKm)
        if (!poolsRadius.length) {
            var data = {
                message: 'No pools in radius. Create it please. :)',
                timeout: 2000
            }
            snackbar.MaterialSnackbar.showSnackbar(data)
            return
        }

        const poolsDOM = document.createElement('ul')
        poolsRadius.forEach(pool => {
                const poolDOM = document.createElement('li')
                poolDOM.classList = 'mdl-menu__item'
                poolDOM.dataset.id = pool.hash

                const boldDOM = document.createElement('b')
                boldDOM.textContent = pool.meta.name
                poolDOM.appendChild(boldDOM)

                const tickerDOM = document.createElement('span')
                tickerDOM.textContent = ` [${pool.meta.ticker}]`
                poolDOM.appendChild(tickerDOM)

                poolsDOM.appendChild(poolDOM)
            })
        poolPopup.innerHTML = ''
        poolPopup.appendChild(poolsDOM)

        const maxPageX = window.pageXOffset + window.innerWidth;
        const maxPageY = window.pageYOffset + window.innerHeight;
        const availableHeight = maxPageY - (globeDOM.offsetTop + event.detail.clientY);
        const availableWidth = maxPageX - (globeDOM.offsetLeft + event.detail.clientX);

        setTimeout(() => {
            const top = event.detail.clientY - (availableHeight / 0.7 < poolPopup.offsetHeight ? poolPopup.offsetHeight + 5 : -5)
            const left = event.detail.clientX - (availableWidth < poolPopup.offsetWidth ? poolPopup.offsetWidth + 5 : -5)

            if (availableHeight / 0.7 >= poolPopup.offsetHeight) {
                poolPopup.style.maxHeight = availableHeight - 100
            }

            popupClickTarget.style.top = top + 'px';
            popupClickTarget.style.left = left + 'px';
            popupClickTarget.click()
        }, 0)
    })

    globeDOM.addEventListener('dragging', event => {
        poolPopup.MaterialMenu.hide()
    })

    const controls = globe.controls()

    const events = ['mousedown', 'touchstart'];
    events.forEach(eventName => {
        globeDOM.addEventListener(eventName, () => {
            controls.autoRotate = false
        })
    })

    controls.autoRotate = true
    controls.enableKeys = true

    autocomplete({
        input: document.querySelector('#search-field input'),
        fetch: (text, update) => {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            const suggestions = pools.filter(pool => {
                if (typeof pool.meta !== 'object') return false
                if (pool.meta.name && pool.meta.name.toLowerCase().startsWith(text)) return true
                if (pool.meta.ticker && pool.meta.ticker.toLowerCase().startsWith(text)) return true
                if (pool.geo.country.toLowerCase().startsWith(text)) return true
                if (pool.geo.region.toLowerCase().startsWith(text)) return true
                if (pool.geo.city.toLowerCase().startsWith(text)) return true
                return false
            })
            update(suggestions);
        },
        onSelect: pool => {
            console.log(pool)
        },
        render: (pool, currentValue) => {
            const itemElement = document.createElement("div");
            const stringOption = `${pool.meta.name} [${pool.meta.ticker}]`
            const searchPos = stringOption.toLocaleLowerCase().indexOf(currentValue.toLocaleLowerCase())
            if (searchPos === -1) {
                itemElement.textContent = stringOption
                return itemElement
            }
            const searchPosEnd = searchPos + stringOption.length

            const firstPart = document.createElement('span')
            const boldPart = document.createElement('b')
            const lastPart = document.createElement('span')

            firstPart.textContent = stringOption.substr(0, searchPos)
            boldPart.textContent = stringOption.substr(searchPos, currentValue.length)
            lastPart.textContent = stringOption.substr(searchPos + currentValue.length)

            itemElement.appendChild(firstPart)
            itemElement.appendChild(boldPart)
            itemElement.appendChild(lastPart)

            return itemElement;
        },
        preventSubmit: true
    })
}

Promise.all([
    window.fetch('relays/augmentedPools.json').then(res => res.json()),
    window.fetch('geodata/countryPolygons.json').then(res => res.json()),
    window.fetch('geodata/populatedPlaces.json').then(res => res.json())
]).then(initialization)
