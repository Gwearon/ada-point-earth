require('dotenv').config()

const fs = require('fs')
const os = require("os")
const rp = require('request-promise')

if (!process.env.BLOCKFROST_API_KEY) {
    throw new Error('Must provide a BLOCKFROST_API_KEY in the .env file. (https://blockfrost.io/)')
}

const myArgs = process.argv.slice(2);
const startOffset = !!myArgs[0] ? myArgs[0]: 0
const endOffset = !!myArgs[1] ? myArgs[1]: Infinity

const blockfrostAPIKey = process.env.BLOCKFROST_API_KEY
const blockfrostAPIURL = 'https://cardano-mainnet.blockfrost.io/api/v0'
const augmentedPoolsPath = __dirname + '/pools.json'
const errorsLogPath = __dirname + "/../blockfrostPools-errors.log"
const encoding = 'utf8'

const outputError = e => { if (e) console.log(e) }
const sleep = (time = 150) => { return new Promise(resolve => setTimeout(resolve, time)) }
const prettyStringify = (object) => JSON.stringify(object, null, 4)

const blockfrostAPIHeaders = { 'project_id': blockfrostAPIKey }
const get = async (api = '/', page = 1) => {
    return await rp({ headers: blockfrostAPIHeaders, url: blockfrostAPIURL + `/${api}?page=${page}`, json: true})
}

const getPools = async (page = 1) => await get('/pools', page)
const getPool = async (poolId) => await get(`/pools/${poolId}`)
const getPoolRelays = async (poolId) => await get(`/pools/${poolId}/relays`)
const getPoolMetadata = async (poolId) => await get(`/pools/${poolId}/metadata`)

const getAllPools = async () => {
    let pools = []
    let newPools = []

    console.log('Fetching all pools')

    i = 0
    do {
        await sleep()
        newPools = await getPools(++i)
        pools = pools.concat(newPools)
    } while (newPools.length)

    console.log(`Fetching pools done. Found ${pools.length}.`)

    return pools
}

const getPoolRelayInformation = (poolDetails, poolMetadata, poolRelay) => {
    let poolRelayInformation = {}

    poolRelayInformation.ipv4 = poolRelay.ipv4
    poolRelayInformation.ipv6 = poolRelay.ipv6
    poolRelayInformation.dns_name = poolRelay.dns
    poolRelayInformation.dns_srv_name = poolRelay.dns_srv

    poolRelayInformation.pledge = poolDetails.declared_pledge
    poolRelayInformation.margin = poolDetails.margin_cost
    poolRelayInformation.fixed_cost = poolDetails.fixed_cost
    poolRelayInformation.hash = poolDetails.hex

    poolRelayInformation.url = poolMetadata.url

    return poolRelayInformation
}

const mapSeries = async (pools) => {
    for (const [i, pool] of pools.entries()) {

        try {
            // do some sleeping to not overload the sys with requests
            const poolDetail = await getPool(pool)
            await sleep()
            const poolRelays = await getPoolRelays(pool)
            await sleep()
            const poolMetadata = await getPoolMetadata(pool)
            await sleep()

            const augmentedPoolRelays = poolRelays.map(getPoolRelayInformation.bind(this, poolDetail, poolMetadata))

            console.log((i + 1) + '/' + pools.length + ' (' + Math.floor((i + 1) / pools.length * 100) + '%)')
    
            const augmentedPoolRelaysJSON = augmentedPoolRelays.map(prettyStringify).join(', ' + os.EOL + '    ');
            fs.appendFileSync(augmentedPoolsPath, (i || startOffset ? ', ' : '') + augmentedPoolRelaysJSON, encoding, outputError);
        } catch (e) {
            fs.appendFileSync(errorsLogPath, [pool, ' - ', e.message, '\n'].join(''), encoding, outputError)
        }

    }
}

const start = async () => {
    const beginningHeader = `{
        "table": "pool_hash",
        "rows":
        [
        `
    
    if (!startOffset) {
        fs.writeFileSync(augmentedPoolsPath, beginningHeader, encoding, outputError);
    }

    const pools = (await getAllPools()).slice(startOffset, endOffset)

    mapSeries(pools).then(_ => {
        console.log('Done!')
        fs.appendFileSync(augmentedPoolsPath, os.EOL + `        ]`  + os.EOL, encoding, outputError);
    
        fs.appendFileSync(augmentedPoolsPath, '}', encoding, outputError);    
    })
}

start()
