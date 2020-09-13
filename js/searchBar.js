window.searchBar = (input, places, onSelect) => {
    autocomplete({
        input,
        fetch: (text, update) => {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            const suggestions = places.filter(place => {
                if (place.name && place.name.toLowerCase().startsWith(text)) return true

                const pool = place.pool
                if (pool) {
                    if (pool.ticker && pool.ticker.toLowerCase().startsWith(text)) return true
                }

                const geo = place.geo
                if (geo) {
                    if (geo.country && geo.country.toLowerCase().startsWith(text)) return true
                    if (geo.region && geo.region.toLowerCase().startsWith(text)) return true
                    if (geo.city && geo.city.toLowerCase().startsWith(text)) return true
                }

                return false
            })
            update(suggestions);
        },
        onSelect,
        render: (place, currentValue) => {
            const itemElement = document.createElement("div");
            const stringOption = `${place.name}` + (place.pool ? `[${place.pool.ticker}]` : ``)
            const searchPos = stringOption.toLocaleLowerCase().indexOf(currentValue.toLocaleLowerCase())
            if (searchPos === -1) {
                itemElement.textContent = stringOption
                return itemElement
            }

            const firstPart = document.createElement('span')
            const boldPart = document.createElement('b')
            const lastPart = document.createElement('span')

            firstPart.textContent = stringOption.substr(0, searchPos)
            boldPart.textContent = stringOption.substr(searchPos, currentValue.length)
            lastPart.textContent = stringOption.substr(searchPos + currentValue.length)

            itemElement.appendChild(firstPart)
            itemElement.appendChild(boldPart)
            itemElement.appendChild(lastPart)

            return itemElement;
        },
        preventSubmit: true
    })
}
