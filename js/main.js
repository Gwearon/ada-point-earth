const popupClickTarget = document.querySelector('#popup-click-target')
const poolPopup = document.querySelector('#pool-popup')
const snackbar = document.querySelector('#snackbar')
const pageSpinner = document.querySelector('#page-spinner')
const appInfo = document.querySelector('#app-info')

const initialization = ([pools, countries, countryCapitals, usCountries]) => {
    pageSpinner.classList.remove('hidden')
    appInfo.querySelectorAll('.other').forEach(other => other.classList.add('fadeIn'))
    
    const poolColor = 'rgba(255, 255, 0, 0.8)'
    const cityColor = '#eeeeee'

    // remove same relays on single location as it clogs the interface
    pools = Utils.removeDuplicates(pools, (pool) => {
        return [pool.meta.ticker, pool.geo.lat, pool.geo.long].join('_')
    })

    // create common structure
    const placesUsCountries = Object.values(usCountries).map(usCountry => {
        return {
            name: usCountry.name,
            lat: usCountry.lat,
            long: usCountry.long,
            type: 'country',
            geo: {
                continent: 'North America',
                country: usCountry.name
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
    }).concat(placesUsCountries)

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

    const unsortedPlaces = [].concat(placesPools, placesCountries, placesCapitals)
    const order = {
        'country': 1,
        'capital': 2,
        'pool': 3
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
