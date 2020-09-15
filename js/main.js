const popupClickTarget = document.querySelector('#popup-click-target')
const poolPopup = document.querySelector('#pool-popup')
const snackbar = document.querySelector('#snackbar')
const pageSpinner = document.querySelector('#page-spinner')
const hoverLabelButton = document.querySelector('#app-hover-labels')

let areHoverLabelsEnabled = true
Utils.clickListener(hoverLabelButton, () => { 
    areHoverLabelsEnabled = !areHoverLabelsEnabled

    var data = {
        message: `Hover data ${areHoverLabelsEnabled ? `enabled`: `disabled`}.`,
        timeout: 2000
    }

    if (!snackbar.MaterialSnackbar.active) {
        snackbar.MaterialSnackbar.showSnackbar(data)
    }
})

const initialization = ([pools, countries, countryCapitals, usCountries]) => {
    pageSpinner.classList.remove('hidden')

    // fade in elements
    document.querySelectorAll('.fade-initialize').forEach(other => other.classList.add('fade-in'))

    const poolColor = 'rgba(255, 255, 0, 0.8)'
    const cityColor = '#eeeeee'

    // remove same relays on single location as it clogs the interface
    pools = Utils.removeDuplicates(pools, (pool) => {
        return [pool.meta.ticker, pool.geo.lat, pool.geo.long].join('_')
    })

    const poolsByCountry = pools.reduce((accumulator, pool) => {
            const countryName = pool.geo.country.toLowerCase()
            if (!!accumulator[countryName]) {
                accumulator[countryName]++;
            } else {
                accumulator[countryName] = 1;
            }
            return accumulator
        }, {})

    const getCountryPoolNumber = countryName => {
        if (countryName && poolsByCountry[countryName.toLowerCase()]) {
            return poolsByCountry[countryName.toLowerCase()]
        }
        return 0
    }
    const naFormatter = (num1, num2) => num2 !== 0 ? Utils.formatNumber(Math.round(num1 / num2)) : 'N/A'

    // create common structure
    const placesUsRegions = Object.values(usCountries).map(usCountry => {
        return {
            name: usCountry.name,
            lat: usCountry.lat,
            long: usCountry.long,
            type: 'region',
            geo: {
                continent: 'North America',
                country: usCountry.name,
                region: usCountry.region
            }
        }
    })

    const placesCountries = countryCapitals.map(country => {
        return {
            name: country.CountryName,
            lat: country.CapitalLatitude,
            long: country.CapitalLongitude,
            type: 'country',
            geo: {
                continent: country.ContinentName,
                country: country.CountryName
            }
        }
    })

    const placesUsCapitals = Object.values(usCountries).map(usCountry => {
        return {
            name: usCountry.capital,
            lat: usCountry.lat,
            long: usCountry.long,
            type: 'capital',
            geo: {
                continent: 'North America',
                country: usCountry.name
            }
        }
    })

    const placesCapitals = countryCapitals.map(country => {
        return {
            name: country.CapitalName,
            lat: country.CapitalLatitude,
            long: country.CapitalLongitude,
            type: 'capital',
            geo: {
                continent: country.ContinentName,
                country: country.CountryName,
            }
        }
    }).concat(placesUsCapitals)

    const placesPools = pools.map(pool => {
        return {
            name: pool.meta.name,
            lat: pool.geo.lat,
            long: pool.geo.long,
            type: 'pool',
            pool: {
                ticker: pool.meta.ticker,

                description: pool.meta.description,
                homepage: pool.meta.homepage,
                margin: pool.margin,
                fixed_cost: pool.fixed_cost,
                pledge: pool.pledge,
                hash: pool.hash
            },
            geo: {
                continent: pool.geo.continent,
                country: pool.geo.country,
                region: pool.geo.region,
                city: pool.geo.city
            }
        }
    })

    const unsortedPlaces = [].concat(placesPools, placesCountries, placesUsRegions, placesCapitals)
    const order = {
        'country': 1,
        'region': 2,
        'capital': 3,
        'pool': 4
    }
    const places = unsortedPlaces.sort((a, b) => order[a.type] > order[b.type] ? 1: -1)

    const mapData = places.filter(place => ['pool', 'capital'].includes(place.type)).map(place => {
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
    const popup = Popup({ 
        placesPopup: document.querySelector('#places-popup'),
        containerBBox: globeDOM.getBoundingClientRect() ,
        places,
        snackbar
    })

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
        .polygonLabel(({ properties: d }) => {
                if (areHoverLabelsEnabled) {
                    return `
                        <div class="country-labels">
                            <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
                            Population: <i>${Utils.formatNumber(d.POP_EST)}</i><br/>
                            GDP: <i>${Utils.formatNumber(d.GDP_MD_EST)}</i> M$<br/>
                            Num pools: <i>${getCountryPoolNumber(d.NAME_CIAWF)}</i><br/>
                            Pop/num pools: <i>${naFormatter(d.POP_EST, getCountryPoolNumber(d.NAME_CIAWF))}</i><br/>
                            GDP/num pools: <i>${naFormatter(d.GDP_MD_EST, getCountryPoolNumber(d.NAME_CIAWF))}</i><br/>
                        </div>
                    `
                }
                return ``
            })

    Tappable(globeDOM)
    globeDOM.addEventListener('tap', event => {
        const pos = globe.toGlobeCoords(event.detail.clientX, event.detail.clientY)
        if (pos === null) {
            return
        }

        const hasData = popup.search(pos.lat, pos.lng)
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

    searchBar(document.querySelector('#search-field input'), places, (place) => {
        const hasData = popup.searchPlace(place)
        if (!hasData) {
            return;
        }
        popup.hide()
        controls.autoRotate = false

        setTimeout(() => {
            globe.pointOfView({ lat: place.lat, lng: place.long, altitude: 1 })
            setTimeout(() => {
                const coords = globe.getScreenCoords(place.lat, place.long)
                popup.show(coords.x + 5, coords.y + 5)
            }, 300)
        }, 300)
    })
}

Promise.all([
    window.fetch('relays/augmentedPools.json').then(res => res.json()),
    window.fetch('geodata/countryPolygons.json').then(res => res.json()),
    window.fetch('geodata/country-capitals.json').then(res => res.json()),
    window.fetch('geodata/us_state_capitals.json').then(res => res.json())
]).then(initialization)
