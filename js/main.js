const popupClickTarget = document.querySelector('#popup-click-target')
const poolPopup = document.querySelector('#pool-popup')
const snackbar = document.querySelector('#snackbar')
const pageSpinner = document.querySelector('#page-spinner')

const initialization = ([pools, countries, populatedPlaces]) => {
    pageSpinner.classList.remove('hidden')

    const poolColor = 'rgba(255, 255, 0, 0.8)'
    const cityColor = '#eeeeee'
    const clickPoolSelectionRadiusKm = 50

    // remove same relays on single location as it clogs the interface
    pools = Utils.removeDuplicates(pools, (pool) => {
        return [pool.meta.ticker, pool.geo.lat, pool.geo.long].join('_')
    })

    // create common structure
    const placesPools = pools.map(pool => {
        return {
            name: pool.meta.name,
            lat: pool.geo.lat,
            long: pool.geo.long,
            type: 'pool',
            pool: {
                ticker: pool.meta.ticker
            }
        }
    })
    const placesCountries = countries.features.map(country => {
        return {
            name: country.properties.ADMIN,
            lat: '',
            lng: '',
            type: 'country'
        }
    })
    const placesPopulatedPlaces = populatedPlaces.features.map(populatedPlace => {
        return {
            name: populatedPlace.properties.name,
            lat: populatedPlace.properties.latitude,
            long: populatedPlace.properties.longitude,
            type: 'populatePlace'
        }
    })
    const places = [].concat(placesPools, placesCountries, placesPopulatedPlaces)

    const mapData = places.filter(place => ['pool', 'populatePlace'].includes(place.type)).map(place => {
        const isPool = place.type === 'pool'
        return {
            text: isPool ? '' : place.name,
            lat: place.lat,
            long: place.long,
            size: isPool ? 0.6 : 0.4,
            dotRadius: isPool ? 0.3 : 0.2,
            color: isPool ? poolColor : cityColor,
            altitude: isPool ? 0.006 : 0.0055
        }
    })

    const globeDOM = document.querySelector('#globe')
    const popup = Popup({ containerBBox: globeDOM.getBoundingClientRect() , places, snackbar })

    const globe = Globe({ waitForGlobeReady: true })(globeDOM)
        .globeImageUrl('/img/earth-blue-marble.jpg')
        .backgroundImageUrl('/img/night-sky.png')
        .bumpImageUrl('/img/earth-topology.png')

        .labelsData(mapData)
        .labelLat('lat')
        .labelLng('long')
        .labelText('text')
        .labelSize('size')
        .labelDotRadius('dotRadius')
        .labelColor('color')
        .labelResolution(2)
        .labelAltitude(0.0055)

        .onZoom(({ lat, lng, altitude }) => {
            if (globe.cameraAltitude != Utils.round(altitude, 2)) {
                globe.cameraAltitude = Utils.round(altitude, 2)

                popup.hide()
            }
        })

        .polygonsData(countries.features)
        .polygonCapColor(() => 'rgba(200, 0, 0, 0.0)')
        .polygonSideColor(() => 'rgba(150, 150, 150, 0.4)')
        .polygonStrokeColor(() => '#aaaaaa')
        .polygonAltitude(0.005)
        // .polygonLabel(({ properties: d }) => `
        //     <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        //     GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
        //     Population: <i>${d.POP_EST}</i>
        //     `)

    Tappable(globeDOM)
    globeDOM.addEventListener('tap', event => {
        const pos = globe.toGlobeCoords(event.detail.clientX, event.detail.clientY)
        if (pos === null) {
            return
        }

        var hasData = popup.search(pos.lat, pos.lng)
        if (hasData) {
            popup.show(event.detail.clientX, event.detail.clientY)
        }
    })

    globeDOM.addEventListener('dragging', event => {
        popup.hide()
    })

    const controls = globe.controls()
    Utils.clickListener(globeDOM, () => { controls.autoRotate = false })
    controls.autoRotate = true
    controls.enableKeys = true

    searchBar(document.querySelector('#search-field input'), pools, (pool) => {
        console.log(pool)
    })
}

Promise.all([
    window.fetch('relays/augmentedPools.json').then(res => res.json()),
    window.fetch('geodata/countryPolygons.json').then(res => res.json()),
    window.fetch('geodata/populatedPlaces.json').then(res => res.json())
]).then(initialization)
