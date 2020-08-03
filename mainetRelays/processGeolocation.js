const fs = require('fs')
const topology = require('./topology.json')
const rp = require('request-promise')
const nl = require('nslookup')

const args = process.argv.slice(2)
if (!args[1]) {
    throw new Error('Missing https://app.ipgeolocation.io/ API key.')
}
const API_KEY = args[1]

const ips = topology.Producers.map(producer => producer.addr).slice(0, 2)

const sleep = () => {
    return new Promise(resolve => setTimeout(resolve, 500));
}

const isIp = str => {
    return /^(([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$/.test(str);
};

const getIp = (dnsOrIp) => {
    return new Promise((resolve, reject) => {
        if (isIp(dnsOrIp)) {
            resolve(dnsOrIp);
            return;
        }

        nl(dnsOrIp)
            .end(function (err, addrs) {
                if (err) {
                    reject(err);
                    return;
                }
                // don't bother with round robin
                // multiple A records per DNS
                resolve(addrs[0]);
            });
    })
}

const fields = [
    'continent_name','country_name','city','zipcode',
    'latitude','longitude',
    'is_eu',
    'languages',
    'isp',
    'organization',
    'time_zone'
].join(',')

const getGeoInformation = async (ipOrDns) => {
    const ip = await getIp(ipOrDns)
    const result = await rp({ url: 'https://api.ipgeolocation.io/ipgeo?ip=' + ip + '&apiKey=' + API_KEY + '&fields=' + fields});
    await sleep()
    return result
}

const mapSeries = async (ips) => {
    const results = []
    for (const ipOrDns of ips) {
        try {
            const result = await getGeoInformation(ip)
            result.ipOrDns = ipOrDns
            results.push(result)
        } catch (e) {}
    }
    return results
}

mapSeries(ips).then((results) => {
    fs.writeFile("topologyGeoInformation.json", JSON.stringify(results), 'utf8', (err) => {
        if (err) {
            console.log(err);
        }
    });
})
