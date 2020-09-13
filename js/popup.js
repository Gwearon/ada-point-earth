window.Popup = ({ containerBBox, places, snackbar }) => {

    const placesPopup = document.querySelector('#places-popup')

    const show = (x, y) => {
        const maxPageX = window.pageXOffset + window.innerWidth;
        const maxPageY = window.pageYOffset + window.innerHeight;
        const availableHeight = maxPageY - (containerBBox.top + y);
        const availableWidth = maxPageX - (containerBBox.left + x);

        setTimeout(() => {
            const top = y - (availableHeight / 0.7 < placesPopup.offsetHeight ? placesPopup.offsetHeight + 5 : -5)
            const left = x - (availableWidth < placesPopup.offsetWidth ? placesPopup.offsetWidth + 5 : -5)

            if (availableHeight / 0.7 >= placesPopup.offsetHeight) {
                placesPopup.style.maxHeight = availableHeight - 100
            }

            placesPopup.style.top = top + 'px'
            placesPopup.style.left = left + 'px'
            placesPopup.style.display = 'block'
        }, 0)
    }

    const showDetails = (place, searchArguments) => {
        placesPopup.innerHTML = `
            <h7></h7><br/>
            <div class="details"></div>
        `

        const titleDOM = placesPopup.querySelector('h7')
        const sufix = place.pool ? ` [${place.pool.ticker}]` : ''
        titleDOM.textContent = `${place.name}${sufix}`

        const details = placesPopup.querySelector('.details')
        if (place.type === 'pool') {
            details.innerHTML = `
                <br/>
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
        if (place.type === 'country') {
            details.innerHTML = `
                <ul></ul>
            `
            const list = details.querySelector('ul')
            const countryPlacesLis = places.filter(place => pool.type === 'pool' && pool.geo && pool.geo.country === place.name).map(place => {
                const li = document.createElement('li')
                li.textContent = place.name
                return li
            })
            list.append.apply(this, countryPlacesLis)
        }
        if (place.type === 'populatePlace') {
            details.innerHTML = `
                <a class="gmaps-link" target="_blank">Google Maps</a>
            `
        }

        const googleMapsLink = placesPopup.querySelector('.gmaps-link')
        if (googleMapsLink) {
            googleMapsLink.href = `https://maps.google.com/?q=${place.lat},${place.long}`
        }
    }

    const search = (lat, long, type, radiusKm = 50) => {
        const searchArguments = [lat, long, type, radiusKm]

        const placesType = places.filter(place => !type || type.includes(place.type))
        const placesTypeInRadius = placesType.filter(place => Utils.haversineDistance({ lat: place.lat, long: place.long}, { lat, long }) < radiusKm)

        const placesFiltered = placesTypeInRadius.filter(place => !!place.name)

        if (!placesFiltered.length) {
            var data = {
                message: 'No pool in radius. Plsease create one. :)',
                timeout: 2000
            }
            if (!snackbar.MaterialSnackbar.active) {
                snackbar.MaterialSnackbar.showSnackbar(data)
            }
            return false
        }

        if (placesFiltered.length === 1) {
            showDetails(placesFiltered[0])
            return true
        }

        placesPopup.innerHTML = '<ul class="places"></ul>'
        const placesDOM = placesPopup.querySelector('ul')
        placesFiltered.forEach(place => {
            const placeDOM = document.createElement('li')
            placeDOM.dataset.id = place.hash

            const boldDOM = document.createElement('b')
            boldDOM.textContent = place.name
            placeDOM.appendChild(boldDOM)

            if (place.pool) {
                const tickerDOM = document.createElement('span')
                tickerDOM.textContent = ` [${place.pool.ticker}]`
                placeDOM.appendChild(tickerDOM)
            }

            Utils.clickListener(placeDOM, () => { showDetails(place, searchArguments) })

            placesDOM.appendChild(placeDOM)
        })

        if (placesFiltered.length) {
            placesPopup.appendChild(placesDOM)
            return true
        }
        return true
    }

    const searchPlace = (searchPlace) => {
        if (searchPlace.type === 'pool') {
            showDetails(searchPlace)
            return true;
        }
        return search(searchPlace.lat, searchPlace.long)
    }

    const hide = () => {
        placesPopup.style.display = 'none';
    }

    return {
        hide,
        show,
        search,
        searchPlace
    }
}