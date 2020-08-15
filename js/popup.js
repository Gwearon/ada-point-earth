const Popup = (globeDOM, poolPopup, popupClickTarget) => {

    const parseData = (data) => {
        const pools = data.places.filter(place => place.type === 'pool')
        const countries = data.places.filter(place => place.type === 'country')
        const populatedPlaces = data.places.filter(place => place.type === 'populatedPlace')
        return {
            meta: data.meta,
            places: pools.concat(countries).concat(populatedPlaces)
        }
    }

    const populate = (data, filter) => {
        const parsedData = parseData(data)

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
        poolsPopup.innerHTML = ''
        poolsPopup.appendChild(poolsDOM)

    }

    const show = (x, y) => {
        const maxPageX = window.pageXOffset + window.innerWidth;
        const maxPageY = window.pageYOffset + window.innerHeight;
        const availableHeight = maxPageY - (globeDOM.offsetTop + y);
        const availableWidth = maxPageX - (globeDOM.offsetLeft + x);

        setTimeout(() => {
            const top = y - (availableHeight / 0.7 < poolPopup.offsetHeight ? poolPopup.offsetHeight + 5 : -5)
            const left = x - (availableWidth < poolPopup.offsetWidth ? poolPopup.offsetWidth + 5 : -5)

            if (availableHeight / 0.7 >= poolPopup.offsetHeight) {
                poolPopup.style.maxHeight = availableHeight - 100
            }

            popupClickTarget.style.top = top + 'px';
            popupClickTarget.style.left = left + 'px';
            popupClickTarget.click()
        }, 0)
    }

    const hide = () => {

    }

    return { hide, show }
}