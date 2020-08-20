window.Popup = ({ containerBBox, places, snackbar }) => {

    const popupClickTarget = document.querySelector('#popup-click-target')
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

            popupClickTarget.style.top = top + 'px';
            popupClickTarget.style.left = left + 'px';
            popupClickTarget.click()
        }, 0)
    }

    const showDetails = (place, searchArgs) => {
        console.log('show details')
        placesPopup.innerHTML = ''
        placesPopup.textContent = place.name
    }

    const search = (lat, long, type, radiusKm = 50) => {
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

        const placesDOM = document.createElement('ul')
        placesFiltered.forEach(place => {
            const placeDOM = document.createElement('li')
            placeDOM.classList = 'mdl-menu__item'
            placeDOM.dataset.id = place.hash

            const boldDOM = document.createElement('b')
            boldDOM.textContent = place.name
            placeDOM.appendChild(boldDOM)

            if (place.pool) {
                const tickerDOM = document.createElement('span')
                tickerDOM.textContent = ` [${place.pool.ticker}]`
                placeDOM.appendChild(tickerDOM)
            }

            Utils.clickListener(placeDOM, () => { showDetails(place, arguments) })

            placesDOM.appendChild(placeDOM)
        })

        placesPopup.innerHTML = ''
        if (placesFiltered.length) {
            placesPopup.appendChild(placesDOM)
            return true
        }
        return true
    }

    const hide = () => {
        placesPopup.MaterialMenu.hide()
    }

    return {
        hide,
        show,
        search
    }
}