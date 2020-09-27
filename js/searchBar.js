window.searchBar = (input, places, onSelect, placeTypeEmoji) => {
    autocomplete({
        input,
        fetch: (text, update) => {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            const suggestions = places.filter(place => {
                if (place.name && place.name.toLowerCase().includes(text)) return true

                const pool = place.pool
                if (pool) {
                    if (pool.ticker && pool.ticker.toLowerCase().includes(text)) return true
                }

                const geo = place.geo
                if (geo) {
                    if (geo.continent && geo.continent.toLowerCase().startsWith(text)) return true
                    if (geo.country && geo.country.toLowerCase().startsWith(text)) return true
                    if (geo.region && geo.region.toLowerCase().startsWith(text)) return true
                    if (geo.city && geo.city.toLowerCase().startsWith(text)) return true
                }

                const pluralToSingular = {
                    'continents': 'continent',
                    'countries': 'country',
                    'regions': 'region',
                    'interests': 'interest',
                    'capitals': 'capital'
                }
                textFixedPlural = !!pluralToSingular[text] ? pluralToSingular[text] : text
                if (place.type.startsWith(textFixedPlural)) return true

                return false
            })
            update(suggestions);
        },
        onSelect,
        render: (place, currentValue) => {
            const itemElement = document.createElement("div")
            const tickerPostfix = place.pool ? `[${place.pool.ticker}]` : ``
            const stringOption = `${placeTypeEmoji[place.type]}${place.name}${tickerPostfix}`
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
