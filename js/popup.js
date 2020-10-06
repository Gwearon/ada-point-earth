window.Popup = ({ placesPopup, places, snackbar, onPopupChange, onPlaceShare, placeTypeEmoji, searchPlaceMain }) => {
    onPopupChange = onPopupChange || function() {}

    const placesPopupInner = document.createElement('div')
    placesPopupInner.id = 'places-popup-inner'
    placesPopup.append(placesPopupInner)

    const history = []

    let isShown = false

    const show = (x, y) => {
        if (isShown) {
            return
        }
        isShown = true

        placesPopup.style.top = (y - 26) + 'px'
        placesPopup.style.left = (x + 11) + 'px'
        placesPopup.style.display = 'block'
    }

    const createPlacesList = (selectedPlaces, callback) => {
        return selectedPlaces.map(place => {
            const placeDOM = document.createElement('li')
            placeDOM.dataset.id = place.hash

            const boldDOM = document.createElement('b')
            boldDOM.textContent = place.name
            placeDOM.appendChild(boldDOM)

            if (place.pool) {
                const tickerDOM = document.createElement('span')
                tickerDOM.textContent = ` [${place.pool.ticker}]`
                placeDOM.appendChild(tickerDOM)
            } else {
                boldDOM.textContent = placeTypeEmoji[place.type] + ' ' + boldDOM.textContent
            }

            Utils.clickListener(placeDOM, () => { callback(place) })

            return placeDOM
        })
    }

    const showDetails = (place) => {
        const searchArguments = ['showDetails', place]

        placesPopupInner.innerHTML = `
            <header><i class="back material-icons">arrow_back_ios</i><span class="title"></span>&nbsp;<i class="share material-icons">share</i></header><br/>
            <div class="details"></div>
        `

        const backButton = placesPopupInner.querySelector('.back')
        Utils.clickListener(backButton, back)

        const titleDOM = placesPopupInner.querySelector('.title')
        const sufix = place.pool ? ` [${place.pool.ticker}]` : ` ${placeTypeEmoji[place.type]}`
        titleDOM.textContent = `${place.name}${sufix}`

        const details = placesPopupInner.querySelector('.details')
        if (place.type === 'pool') {
            details.innerHTML = `
                <p class="description"></p>
                <ul>
                    <li><a class="homepage" target="_blank">Homepage</a></li>
                    <li>Fee: <span class="margin"></span></li>
                    <li>Fixed cost: <span class="fixed_cost"></span></li>
                    <li>Pledge: <span class="pledge"></span></li>
                    <li><a class="adapool" target="_blank">AdaPools.org</a></li>
                    <li><a class="pooltool" target="_blank">Pooltool.io</a></li>
                    <li><a class="gmaps-link" target="_blank">Google Maps</a></li>
                </ul>
            `
            details.querySelector('.homepage').href = place.pool.homepage
            details.querySelector('.description').textContent = place.pool.description
            details.querySelector('.margin').textContent = (place.pool.margin * 100) + '%'
            details.querySelector('.fixed_cost').textContent = Utils.formatNumber(place.pool.fixed_cost / 1000000) + ' ADA'
            details.querySelector('.pledge').textContent = Utils.formatNumber(place.pool.pledge / 1000000) + ' ADA'
            details.querySelector('.adapool').href = `https://adapools.org/pool/${place.pool.hash}`
            details.querySelector('.pooltool').href = `https://pooltool.io/pool/${place.pool.hash}`
        }
        if (['continent', 'country', 'region'].includes(place.type)) {
            const geoType = place.type

            details.innerHTML = `
                <ul class="places"></ul>
            `
            const list = details.querySelector('ul')
            const countryPlaces = places.filter(currentPlace => currentPlace.type === 'pool' && currentPlace.geo && currentPlace.geo[geoType] === place.name)
            const countryPlacesLis = createPlacesList(countryPlaces, (place) => {
                history.push(searchArguments)
                searchPlaceMain(place, true)
            })
            list.append.apply(list, countryPlacesLis)

            titleDOM.textContent = `${titleDOM.textContent} (${countryPlacesLis.length})`
        }
        if (place.type === 'capital') {
            details.innerHTML = `
                <ul class="places"><li>Capital of ${place.geo.country}.</li></ul>
            `
            const countryPlace = places.find(currentPlace => ['country', 'region'].includes(currentPlace.type) && currentPlace.name === place.geo.country)
            Utils.clickListener(details.querySelector('li'), () => {
                history.push(searchArguments)
                showDetails(countryPlace)
            })
        }
        if (place.type === 'interest') {
            details.innerHTML = `
                <p>${place.interest.description}.</p>
            `
        }

        const googleMapsLink = placesPopupInner.querySelector('.gmaps-link')
        if (googleMapsLink) {
            googleMapsLink.href = `https://maps.google.com/?q=${place.lat},${place.long}`
        }

        const shareLink = placesPopupInner.querySelector('.share')
        if (shareLink) {
            Utils.clickListener(shareLink, () => {
                onPlaceShare(place)
            })
        }

        onPopupChange(place)
    }

    const search = (lat, long, type, radiusKm = 50) => {
        const searchArguments = ['search', lat, long, type, radiusKm]

        const placesType = places.filter(place => !type || type.includes(place.type))
        const placesTypeInRadius = placesType.filter(place => Utils.haversineDistance({ lat: place.lat, long: place.long}, { lat, long }) < radiusKm)

        const placesFiltered = placesTypeInRadius.filter(place => !!place.name)

        if (!placesFiltered.length) {
            var data = {
                message: 'No pool in radius. Please create one. 😊',
                timeout: 2000
            }
            if (!snackbar.MaterialSnackbar.active) {
                snackbar.MaterialSnackbar.showSnackbar(data)
            }
            return false
        }

        if (placesFiltered.length === 1) {
            history.push(searchArguments)
            showDetails(placesFiltered[0])
            return true
        }

        // add country to every radius result
        const firstPool = placesFiltered.find(place => place.type === 'pool')
        const hasRegion = placesFiltered.find(place => place.type === 'region')
        if (firstPool && !hasRegion) {
            const regionPlace = places.find(place => place.type === 'region' && place.name === firstPool.geo.region)
            regionPlace && placesFiltered.unshift(regionPlace)
        }
        const hasCountry = placesFiltered.find(place => place.type === 'country')
        if (firstPool && !hasCountry) {
            const countryPlace = places.find(place => place.type === 'country' && place.name === firstPool.geo.country)
            countryPlace && placesFiltered.unshift(countryPlace)
        }
        const hasContinent = placesFiltered.find(place => place.type === 'continent')
        if (firstPool && !hasContinent) {
            const continentPlace = places.find(place => place.type === 'continent' && place.name === firstPool.geo.continent)
            continentPlace && placesFiltered.unshift(continentPlace)
        }

        placesPopupInner.innerHTML = `
            <header><i class="back material-icons">arrow_back_ios</i><span class="title"></span></header><br/>
            <ul class="places"></ul>
        `

        const backButton = placesPopupInner.querySelector('.back')
        Utils.clickListener(backButton, back)

        const numPools = placesFiltered.filter(place => place.type === 'pool')
        placesPopupInner.querySelector('.title').innerText = `Places in click radius. (${numPools.length})`
        const placesDOM = placesPopupInner.querySelector('ul')
        placesDOM.append.apply(placesDOM, createPlacesList(placesFiltered, (place) => {
            history.push(searchArguments)
            searchPlaceMain(place, true)
        }))

        if (placesFiltered.length) {
            onPopupChange()
            placesPopupInner.appendChild(placesDOM)
            return true
        }
        return true
    }

    const searchPlace = (searchPlace) => {
        if (['interest', 'pool', 'region', 'country', 'continent'].includes(searchPlace.type)) {
            showDetails(searchPlace)
            return true;
        }
        return search(searchPlace.lat, searchPlace.long)
    }

    const hide = () => {
        if (!isShown) {
            return
        }
        isShown = false

        placesPopup.style.display = 'none';
        onPopupChange()
    }

    const interface = {
        hide,
        show,
        search,
        searchPlace
    }

    function back() {
        if (!hasHistory()) {
            hide()
            return;
        }
        const state = history.pop()
        const fn = state[0]
        interface[fn] && interface[fn].apply(interface[fn], state.slice(1))
    }

    function hasHistory() {
        return !!history.length
    }

    return interface
}
