const Popup = ({ globeDOM, poolPopup, popupClickTarget, places }) => {

    const countries = places.filter(place => place.type === 'country')
    const populatedPlaces = places.filter(place => place.type === 'populatedPlace')
    const pools = places.filter(place => place.type === 'pool')

    const placeType = {
        POOL: 'pool',
        COUNTRY: 'country',
        POPULATED_PLACES: 'populatedPlaces'
    }

    [
        {
            name: 'Ada Point Pool',
            ticker: 'APP',
            type: 'pool'
        },
        {
            name: 'Germany',
            type: 'country'
        },
        {
            name: 'Paris',
            type: 'populatedPlaces'
        }
    ]

    const getSingle = (data) => {

    }

    const getSingleLi = (data) => {
        const li = document.createElement('li')
        li.classList = 'mdl-menu__item'
        switch(data.type) {
            case placeType.COUNTRY:
            case placeType.POPULATED_PLACES:
            case placeType.POOL:
                li.dataset.id = data.hash

                const boldDOM = document.createElement('b')
                boldDOM.textContent = data.meta.name
                li.appendChild(boldDOM)

                const tickerDOM = document.createElement('span')
                tickerDOM.textContent = ` [${data.meta.ticker}]`
                li.appendChild(tickerDOM)

        }
    }

    const getUl = (data) => {
        const ul = document.createElement('ul')
        ul.append(...data.places.map(getSingleLi))
        return ul
    }

    const getDom = (data) => {
        const parsedData = parseData(data)
        const main = parseData.places.length === 1 ? getDOMSingle(data.places[0]) : getDOMUl(data.places)

    }

    const render = (data) => {

        const poolsDOM = document.createElement('ul')
        parsedData.places.forEach(pool => {
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