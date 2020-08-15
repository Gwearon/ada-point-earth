const os = require("os")
const fs = require('fs')
const requestPromise = require('request-promise')
const nsLookup = require('nslookup')

const continents = require(__dirname + '/../geodata/continents.json')
const countries = require(__dirname + '/../geodata/countries.json')

const poolsPath = __dirname + '/../relays/pools.json';
const augmentedPoolsPath = __dirname + '/../relays/augmentedPools.json'
const errorsLogPath = __dirname + "../errors.log"
const encoding = 'utf8'

const myArgs = process.argv.slice(2);
const startOffset = !!myArgs[0] ? myArgs[0]: 0
const endOffset = !!myArgs[1] ? myArgs[1]: Infinity

const pools = require(poolsPath).rows.slice(startOffset, endOffset)

const sleep = () => { return new Promise(resolve => setTimeout(resolve, 500)) }
const isIp = str => { return /^(([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$/.test(str) }
const outputError = e => { if (e) console.log(e) }

const getIp = (dnsOrIp, dns_srv_name) => {
    return new Promise((resolve, reject) => {
        if (isIp(dnsOrIp)) {
            resolve(dnsOrIp);
            return;
        }

        nsLookup(dnsOrIp)
            .server(dns_srv_name ? dns_srv_name : '8.8.8.8')
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

const getGeo = async (ipOrDns) => {
    const ip = await getIp(ipOrDns)
    if (!isIp(ip)) {
        throw new Error('Not an ip: ' + ip)
    }
    const geo = await requestPromise({ url: 'https://ip2.app/info.php?ip=' + ip, json: true});
    delete geo.pc
    delete geo.time_zone
    return geo
}

const getMeta = async (url) => {
    try {
        const meta = await requestPromise({ url, json: true });
        return meta
    } catch (e) {
        throw new Error('Unable to get meta for url: ' + url)
    }
}

const getAugmentedPoolData = async (pool, retry) => {
    try {
        const geoId = pool.ipv4 ? pool.ipv4 : (pool.dns_name ? pool.dns_name : pool.ipv6)
        const geo = await getGeo(geoId, pool.dns_srv_name)
        const meta = await getMeta(pool.url)

        try {
            // augment with continent information
            geo.continent = continents[countries[geo.code].continent]
        } catch {
            geo.continent = ''
        }

        const cPool = {...pool}
        // remove first 3 chars "\\x153806dbcd134ddee69a8c5204e38ac80448f62342f8c23cfe4b7edf"
        cPool.hash = pool.hash.substring(2)

        return {
            ...cPool,
            meta,
            geo
        }
    } catch (e) {
        if (!retry) {
            retry--;
            await sleep() // do some sleep to not overload the sys with requests
            return getAugmentedPoolData(pool, retry)
        }
        throw e
    }
}

if (!startOffset) {
    fs.writeFileSync(augmentedPoolsPath, '[ ', encoding, outputError);
}

const mapSeries = async (pools) => {
    for (const [i, pool] of pools.entries()) {
        let augmentedPool = null
        try {
            augmentedPool = await getAugmentedPoolData(pool, 1); // try twice
            augmentedPool.index = i
        } catch (e) {
            fs.appendFileSync(errorsLogPath, [pool.hash, ' ', e.message, os.EOL].join(''), encoding, outputError)
        }

        await sleep() // do some sleep to not overload the sys with requests
        console.log(i + '/' + pools.length + ' (' + Math.floor(i / pools.length * 100) + '%)')
        if (augmentedPool) {
            fs.appendFileSync(augmentedPoolsPath, (i || startOffset ? ', ' : '') + JSON.stringify(augmentedPool), encoding, outputError);
        }
    }
}

mapSeries(pools).then(_ => { 
    console.log('Done!')
    fs.appendFileSync(augmentedPoolsPath, ' ]', encoding, outputError);
})
