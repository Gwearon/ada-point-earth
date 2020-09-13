window.Utils = {}

Utils.haversineDistance = (coords1, coords2) => {
    const toRad = x => {
        return x * Math.PI / 180;
    }

    const lon1 = coords1.lat;
    const lat1 = coords1.long;

    const lon2 = coords2.lat;
    const lat2 = coords2.long;

    const R = 6371; // km

    const x1 = lat2 - lat1;
    const dLat = toRad(x1);
    const x2 = lon2 - lon1;
    const dLon = toRad(x2)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
}

Utils.round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

Utils.removeDuplicates = (arr, keygen) => {
    const duplicated = {}
    return arr.filter(item => {
        const key = keygen(item)
        if (!duplicated[key]) {
            duplicated[key] = 1
            return true
        }
        duplicated[key]++
        return false
    })
}

Utils.clickListener = (dom, fn) => {
    ['mousedown', 'touchstart'].forEach(eventName => {
        dom.addEventListener(eventName, fn)
    })
}

Utils.clone = (object) => {
    return JSON.stringify(JSON.parse(object))
}

Utils.formatNumber = (num) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
