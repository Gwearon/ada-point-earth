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
        console.log('show details')
        placesPopup.innerHTML = `<h7></h7><br/>
            <a class="gmaps-link" target="_blank">google map link</a>
        `

        const titleDOM = placesPopup.querySelector('h7')
        const sufix = place.pool ? ` [${place.pool.ticker}]` : ''
        titleDOM.textContent = `${place.name}${sufix}`

        const googleMapsLink = placesPopup.querySelector('.gmaps-link')
        googleMapsLink.href = `https://maps.google.com/?q=${place.lat},${place.long}`
    }

    const search = (lat, long, type, radiusKm = 50) => {
        console.log(lat, long)
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

    const hide = () => {
        placesPopup.style.display = 'none';
    }

    return {
        hide,
        show,
        search
    }
}