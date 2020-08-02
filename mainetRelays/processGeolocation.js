const unirest = require("unirest")
const fs = require('fs')
const topology = require('topology.json')

const getGeolocation = (ip) => {
    return new Promise((resolve, reject) => {
        const req = unirest("GET", "https://apility-io-ip-geolocation-v1.p.rapidapi.com/" + ip)

        req.headers({
            "x-rapidapi-host": "apility-io-ip-geolocation-v1.p.rapidapi.com",
            "x-rapidapi-key": "c14fadce51msh9442455ec9197f9p122f07jsnda5c512ff418",
            "accept": "application/json",
            "useQueryString": true
        });

        req.end(function (res) {
            if (res.error) reject(res.error)
            resolve(res.body)
        })
    })
}

const augmentedProducers = topology.Producers.map(async (producer) => {
    const augmentedProducer = { ...producer }
    return new Promise((resolve, reject) => {
        const geoData = await getGeolocation(producer.ip)
        resolve(augmentedProducers)
    })
})

const augmentedTopology = {
    Producers: augmentedProducers
}

fs.writeFileSync('./augmented-topology.json', augmentedTopology , 'utf-8');
