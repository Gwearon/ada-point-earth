# Network globe

Network globe is Cardano globe visualization for Ada Point Earth. It is made by Ada Point Pool.

## Installation

Not needed for the frontend.

## Installation dev

Use the package manager and nodejs [npm](https://nodejs.org/en/) to install network globe.

```bash
npm install
npm install --only=dev
```

## Usage

### Frontend

Open `index.html` in the browser.

### Parsing data

#### Cardano db sync (Option 1)

See `relays/pools.sql` and export as json if you are using `cardano-db-sync`.

### Blockfrost (Option 2)

Provide `.env` file with your [blockfrost](https://blockfrost.io) key.

```bash
BLOCKFROST_API_KEY=<your blockforst API key>
```

### Augmenting data

After using cardano db sync or blockfrost fetcher augment the relay data with location information.

```bash
relays/fetchBlockforstPoolsData.js`
```

Parse scripts:

- see `relays/pools.sql` and export as json if you are using `cardano-db-sync`.
- if using blockfrost `relays/pools.sql` and export as json if you are using `cardano-db-sync`.

```bash
node relays/augmentPoolsData.js
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://github.com/Gwearon/ada-point-earth/blob/master/LICENSE)

## Using

- Graph QL: https://github.com/input-output-hk/cardano-graphql (Option 1)
- Graph QL schemas: https://input-output-hk.github.io/cardano-graphql/ (Option 1)
- Blockfrost: https://blockfrost.io (Option 2)

- Ip geolocation: https://ipgeolocation.io/
- Geodata: https://github.com/annexare/Countries/tree/master/data/countries.json
