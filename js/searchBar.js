window.searchBar = (input, pools, onSelect) => {
    autocomplete({
        input,
        fetch: (text, update) => {
            text = text.toLowerCase();
            // you can also use AJAX requests instead of preloaded data
            const suggestions = pools.filter(pool => {
                if (typeof pool.meta !== 'object') return false
                if (pool.meta.name && pool.meta.name.toLowerCase().startsWith(text)) return true
                if (pool.meta.ticker && pool.meta.ticker.toLowerCase().startsWith(text)) return true
                if (pool.geo.country.toLowerCase().startsWith(text)) return true
                if (pool.geo.region.toLowerCase().startsWith(text)) return true
                if (pool.geo.city.toLowerCase().startsWith(text)) return true
                return false
            })
            update(suggestions);
        },
        onSelect,
        render: (pool, currentValue) => {
            const itemElement = document.createElement("div");
            const stringOption = `${pool.meta.name} [${pool.meta.ticker}]`
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
