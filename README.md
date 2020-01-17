## ⚡️ Ethereum Scraper (Mainly eth_getTransactionsByAccount) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


> 🚨 Experimental tool


### Why?

* https://github.com/ethereum/go-ethereum/issues/2104
* https://github.com/ethereum/wiki/issues/501


### Demo

|Network|URL|
|-|-|
|Mainnet|https://mainnet-ethereum.harshjv.com/txs/0x11180911f1852d08467bcf5fe41ac38580adf7ab?page=1&limit=5&sort=asc|
|Rinkeby|https://rinkeby-ethereum.harshjv.com/txs/0x443a0fced533cc1f3c780b3def81da471a3b12ad?page=1&limit=5&sort=asc|
|Kovan|https://kovan-ethereum.harshjv.com/txs/0x454f8d6e2b0f6ca13638ce6e00904d5e75cba291?page=1&limit=5&sort=asc|


### Run your own node

```bash
cp .env.example .env  # configure
npm run scraper       # run scraper
npm run api           # run api in a separate shell
```


### License

[MIT](./LICENSE.md)
