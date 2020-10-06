const popupClickTarget = document.querySelector('#popup-click-target')
const poolPopup = document.querySelector('#pool-popup')
const snackbar = document.querySelector('#snackbar')
const pageSpinner = document.querySelector('#page-spinner')
const globeAnimateButton = document.querySelector('#app-animate')

const globeImages = {
    blue: 'img/earth-blue-marble.jpg',
    night: 'img/earth-night.jpg'
}
const globeImagesDefault = 'blue'

const placeTypeEmoji = {
    'continent': '🌎',
    'country': '🌎',
    'region': '🗺️',
    'interest': '❔',
    'capital': '🏙️',
    'pool': ''
}

const initialization = ([pools, continents, countries, countryCapitals, usCountries, interests]) => {
    pageSpinner.classList.remove('hidden')

    // fade in elements
    document.querySelectorAll('.fade-initialize').forEach(other => other.classList.add('fade-in'))

    // remove same relays on single location as it clogs the interface
    pools = Utils.removeDuplicates(pools, (pool) => {
        return [pool.meta.ticker, pool.geo.lat, pool.geo.long].join('_')
    })

    const abcSort = Utils.propAbcSort('name')

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
    }).sort(abcSort)

    const placesContinents = Object.values(continents).map(continent => {
        return {
            name: continent.name,
            lat: continent.lat,
            long: continent.long,
            type: 'continent',
            geo: {
                continent: continent.name
            }
        }
    }).sort(abcSort)

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
    }).sort(abcSort)

    const placesUsCapitals = Object.values(usCountries).map(usCountry => {
        return {
            name: usCountry.capital,
            lat: usCountry.lat,
            long: usCountry.long,
            type: 'capital',
            geo: {
                continent: 'North America',
                country: 'United States',
                region: usCountry.name
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
                region: null
            }
        }
    }).concat(placesUsCapitals).sort(Utils.abcSort)

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
    }).sort(abcSort)

    const placesOfInterests = interests.map(interest => {
        return {
            name: interest.name,
            lat: interest.lat,
            long: interest.long,
            type: 'interest',
            interest: {
                description: interest.description
            },
            geo: {
                continent: interest.geo.continent,
                country: interest.geo.country,
                region: interest.geo.region,
                city: interest.geo.city
            }
        }
    }).sort(abcSort)

    const unsortedPlaces = [].concat(placesPools, placesContinents, placesCountries, placesUsRegions, placesCapitals, placesOfInterests)
    const order = {
        'continent': 1,
        'country': 2,
        'region': 3,
        'interest': 4,
        'capital': 5,
        'pool': 6
    }
    const places = unsortedPlaces.sort((a, b) => order[a.type] > order[b.type] ? 1: -1)

    const mapDataParams = {
        pool: {
            size: 0.6,
            dotRadius: 0.3,
            color: 'rgba(255, 255, 0, 0.8)',
            altitude: 0.006
        },
        capital: {
            size: 0.4,
            dotRadius: 0.2,
            color: '#eeeeee',
            altitude: 0.006
        },
        interest: {
            size: 0.6,
            dotRadius: 0.4,
            color: 'ee0000',
            altitude: 0.006
        }
    }

    const mapData = places.filter(place => ['pool', 'capital'].includes(place.type)).map(place => {
        return {
            text: place.type === 'pool' ? '' : place.name,
            lat: place.lat,
            long: place.long,
            ...mapDataParams[place.type]
        }
    })

    const globeDOM = document.querySelector('#globe')
    const popup = Popup({ 
        placesPopup: document.querySelector('#places-popup'),
        places,
        snackbar,
        onPopupChange,
        onPlaceShare,
        placeTypeEmoji,
        searchPlaceMain: searchPlace
    })

    const globe = Globe({ waitForGlobeReady: true })(globeDOM)
        .globeImageUrl(globeImages.blue)
        .backgroundImageUrl('img/night-sky.png')
        .bumpImageUrl('img/earth-topology.png')

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

    Tappable(globeDOM)
    globeDOM.addEventListener('tap', event => {
        const pos = globe.toGlobeCoords(event.detail.clientX, event.detail.clientY)
        if (pos === null) {
            return
        }
        const hasData = popup.search(pos.lat, pos.lng)
        if (hasData) {
            popup.hide()
            popup.show(event.detail.clientX, event.detail.clientY)
        }
    })

    globeDOM.addEventListener('dragging', event => {
        popup.hide()
    })

    const controls = globe.controls()
    Utils.clickListener(globeDOM, stopGlobeAnimation)
    controls.enableKeys = true
    startGlobeAnimation()

    function searchPlace(place, noHide) {
        const hasData = popup.searchPlace(place)
        if (!hasData) {
            return;
        }
        if (!noHide) {
            popup.hide()
        }
        stopGlobeAnimation()

        setTimeout(() => {
            globe.pointOfView({ lat: place.lat, lng: place.long, altitude: 1 })
            setTimeout(() => {
                const coords = globe.getScreenCoords(place.lat, place.long)
                popup.show(coords.x + 5, coords.y + 5)
            }, 300)
        }, 300)
    }

    //
    // Search bar
    //

    searchBar(document.querySelector('#search-field input'), places, searchPlace, placeTypeEmoji)

    //
    // Share dialog
    //
    const shareDialogButton = document.querySelector('#app-share')
    const shareDialog = document.querySelector('#app-share-dialog')
    const shareDialogCloseButton = shareDialog.querySelector('.mdl-button-get-started')
    const facebookShareButton = shareDialog.querySelector('.facebook-share')
    const twitterShareButton = shareDialog.querySelector('.twitter-share')
    const copyShareButton = shareDialog.querySelector('.copy-share')

    function showShareDialog() {
        shareDialog.classList.remove('hidden')
    }
    function closeShareDialog() {
        shareDialog.classList.add('hidden')
    }
    Utils.clickListener(shareDialogButton, showShareDialog)
    Utils.clickListener(shareDialogCloseButton, closeShareDialog)

    const copyUrlToClipboard = (text) => {
        var textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("Copy")
        textArea.remove()

        var data = {
            message: `Url copied. Paste it wherever you want to share it.`,
            timeout: 2000
        }

        if (!snackbar.MaterialSnackbar.active) {
            snackbar.MaterialSnackbar.showSnackbar(data)
        }
    }

    Utils.clickListener(twitterShareButton, () => {
        const place = getPlaceFromUrlHash(location.hash.substring(1))

        const hashtags =  ['cardano']
        if (place) {
            hashtags.push('cardano' + place.type.charAt(0).toUpperCase() + place.type.slice(1), 'AdaPointPool')
        }

        VanillaSharing.tw({
            url: window.location.href,
            title: `Cardano planet Earth` + (place ? ' - ' + place.name : ''),
            hashtags
        })
    })
    Utils.clickListener(facebookShareButton, () => {
        VanillaSharing.fbButton({ url: document.location.href })
    })
    Utils.clickListener(copyShareButton, () => {
        copyUrlToClipboard(window.location.href)
    })

    //
    // Animate
    //
    function startGlobeAnimation() {
        controls.autoRotate = true
        updateGlobeAnimate()
    }

    function stopGlobeAnimation() {
        controls.autoRotate = false
        updateGlobeAnimate()
    }

    function updateGlobeAnimate() {
        globeAnimateButton.querySelector('i').textContent = controls.autoRotate ? 'pause' : 'play_arrow'
        globeAnimateButton.querySelector('.label').textContent = controls.autoRotate ? 'Pause' : 'Play'
    }

    Utils.clickListener(globeAnimateButton, () => {
        controls.autoRotate = !controls.autoRotate
        controls.autoRotate ? startGlobeAnimation() : stopGlobeAnimation()

        var data = {
            message: `Globe animation ${controls.autoRotate ? `enabled`: `disabled`}.`,
            timeout: 2000
        }

        if (!snackbar.MaterialSnackbar.active) {
            snackbar.MaterialSnackbar.showSnackbar(data)
        }
    })
    updateGlobeAnimate()

    //
    // Light switch
    //

    const globeNightButton = document.querySelector('#app-globe-night')
    let globeNight = false

    const updateGlobeNight = () => {
        globe.globeImageUrl(globeImages[globeNight ? 'night': globeImagesDefault])
    }

    Utils.clickListener(globeNightButton, () => {
        globeNight = !globeNight

        updateGlobeNight()

        var data = {
            message: `Let there be ${globeNight ? `n`: `l`}ight.`,
            timeout: 2000
        }

        globeNightButton.classList[globeNight ? 'remove' : 'add']('on')

        if (!snackbar.MaterialSnackbar.active) {
            snackbar.MaterialSnackbar.showSnackbar(data)
        }
    })
    updateGlobeNight()

    //
    // Simulate random edges
    //

    const simulateEdgesButton = document.querySelector('#app-simulate-edges-labels')
    let simulateEdges = false

    const simulateRandomEdges = () => {
        const getRandomPool = () => pools[Math.floor(pools.length * Math.random())]
        const generateEdge = (startPool) => {
            const pool2 = getRandomPool()
            return  {
                startLat: startPool.geo.lat,
                startLng: startPool.geo.long,
                endLat: pool2.geo.lat,
                endLng: pool2.geo.long,
                color: ['#f0141e', '#f0141e']
            }
        }
    
        const arcsData = simulateEdges ? pools.map(generateEdge) : []

        globe
            .arcsData(arcsData)
            .arcColor('color')
            .arcDashLength(() => Math.random())
            .arcDashGap(() => Math.random())
            .arcDashAnimateTime(() => Math.random() * 4000 + 500)
    }
    
    Utils.clickListener(simulateEdgesButton, () => {
        simulateEdges = !simulateEdges

        simulateRandomEdges()

        var data = {
            message: `Simulate edges ${simulateEdges ? `enabled`: `disabled`}.`,
            timeout: 2000
        }

        simulateEdgesButton.querySelector('i').textContent = 'grid_' + (simulateEdges ? 'on' : 'off')

        if (!snackbar.MaterialSnackbar.active) {
            snackbar.MaterialSnackbar.showSnackbar(data)
        }
    })
    simulateRandomEdges()

    //
    // Hover text
    //

    const NAME_CIAWF_FIXES = {
        "Korea, South": "South Korea"
    }

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
        if (!countryName) {
            return 0
        }
        if (!!NAME_CIAWF_FIXES[countryName]) {
            countryName = NAME_CIAWF_FIXES[countryName]
        }
        countryName = countryName.toLowerCase()
        if (countryName && poolsByCountry[countryName]) {
            return poolsByCountry[countryName]
        }
        return 0
    }
    const naFormatter = (num1, num2) => num2 !== 0 ? Utils.formatNumber(Math.round(num1 / num2)) : 'N/A'

    const hoverLabelButton = document.querySelector('#app-hover-labels')
    let areHoverLabelsEnabled = true

    const updateHoverPolygonText = () => {
        const hoverFn = ({ properties: d }) => {
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

        globe.polygonLabel(areHoverLabelsEnabled ? hoverFn : () => {})
    }

    Utils.clickListener(hoverLabelButton, () => {
        areHoverLabelsEnabled = !areHoverLabelsEnabled

        updateHoverPolygonText()

        var data = {
            message: `Hover data ${areHoverLabelsEnabled ? `enabled`: `disabled`}.`,
            timeout: 2000
        }

        hoverLabelButton.querySelector('i').textContent = areHoverLabelsEnabled ? 'article' : 'domain_disabled'

        if (!snackbar.MaterialSnackbar.active) {
            snackbar.MaterialSnackbar.showSnackbar(data)
        }
    })
    updateHoverPolygonText()

    //
    // Help popup
    //

    const helpButton = document.querySelector('#app-help')
    const helpDialog = document.querySelector('#app-help-card')
    const closeButton = helpDialog.querySelector('.mdl-button-get-started')
    const showHelp = () => {
        helpDialog.classList.remove('hidden')
        onUrlChange('help')
    }
    const closeHelp = () => {
        helpDialog.classList.add('hidden')
        onUrlChange()
    }
    Utils.clickListener(helpButton, showHelp)
    Utils.clickListener(closeButton, closeHelp)

    //
    // Navigation
    //
    const typeUrlMap = {
        pool: 'pools',
        region: 'regions',
        country: 'countries',
        continent: 'continents',
        interest: 'interests'
    }

    function onUrlChange(newHash) {
        if (!newHash) {
            history.replaceState(null, null, document.location.pathname)
            return
        }
        history.replaceState(null, null, document.location.pathname + '#' + newHash)
    }

    function onPlaceShare(place) {
        showShareDialog()
    }

    function onPopupChange(place) {
        if (!place) {
            history.replaceState(null, null, document.location.pathname)
            return
        }
        if (!typeUrlMap[place.type]) {
            return
        }
        const id = place.type === 'pool' ? place.pool.hash : place.name
        const hash = `${typeUrlMap[place.type]}/${encodeURIComponent(id)}`
        history.replaceState(null, null, document.location.pathname + '#' + hash)
    }

    const getPlaceFromUrlHash = (hash) => {
        const type = Object.keys(typeUrlMap).find(type => hash.startsWith(typeUrlMap[type]))
        if (!type) {
            return null
        }

        const comparePlaceHash = (place, placeHash) => {
            return place.type === 'pool' ? place.pool.hash === placeHash : place.name === placeHash
        }

        const placeHash = decodeURIComponent(hash.substring(typeUrlMap[type].length + 1))
        const place = places.find(place => place.type === type && comparePlaceHash(place, placeHash))

        return place
    }

    const showPage = function(hash) {
        const place = getPlaceFromUrlHash(hash)
        if (place) {
            searchPlace(place)
        }
        if (hash.startsWith('help')) {
            showHelp()
        }
        if (hash.startsWith('share')) {
            showShareDialog()
        }
    }

    window.onhashchange = function() {
        showPage(location.hash.substring(1));
    }

    showPage(location.hash.substring(1));
}

Promise.all([
    window.fetch('relays/augmentedPools.json').then(res => res.json()),
    window.fetch('geodata/continents.json').then(res => res.json()),
    window.fetch('geodata/countryPolygons.json').then(res => res.json()),
    window.fetch('geodata/country-capitals.json').then(res => res.json()),
    window.fetch('geodata/us_state_capitals.json').then(res => res.json()),
    window.fetch('geodata/interests.json').then(res => res.json()),
]).then(initialization)
