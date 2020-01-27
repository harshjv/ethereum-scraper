const Bluebird = require('bluebird')
const Web3 = require('web3')

const Transaction = require('./Transaction')

const {
  WEB3_URI,
  MAX_BLOCK_BATCH_SIZE,
  MAX_TRANSACTION_BATCH_SIZE,
  START_BLOCK,
  END_BLOCK,
  REORG_GAP
} = process.env

if (!MAX_BLOCK_BATCH_SIZE) throw new Error('Invalid MAX_BLOCK_BATCH_SIZE')
if (!MAX_TRANSACTION_BATCH_SIZE) throw new Error('Invalid MAX_TRANSACTION_BATCH_SIZE')
if (!START_BLOCK) throw new Error('Invalid START_BLOCK')
if (!REORG_GAP) throw new Error('Invalid REORG_GAP')

let web3
let syncing = true
let latestBlockNumber = null

function handleError (e) {
  console.error(e)
  process.exit(1)
}

if (WEB3_URI.startsWith('ws')) {
  const provider = new Web3.providers.WebsocketProvider(WEB3_URI, {
    clientConfig: {
      maxReceivedFrameSize: 100000000,
      maxReceivedMessageSize: 100000000
    }
  })

  provider.on('error', handleError)
  provider.on('end', handleError)

  web3 = new Web3(provider)
} else {
  web3 = new Web3(WEB3_URI)
}

async function handleBlock (blockNum) {
  if (!blockNum) return

  const exist = await Transaction.findOne({
    blockNumber: blockNum
  }).exec()
  if (exist) return

  const block = await web3.eth.getBlock(blockNum, true)
  if (!block) return

  const blockNumber = block.number
  const blockHash = block.hash
  const timestamp = block.timestamp

  let transactions = await Bluebird.map(block.transactions, async ({ hash, from, to, input, value }) => {
    const { status, contractAddress } = await web3.eth.getTransactionReceipt(hash)

    return {
      from,
      to,
      hash,
      blockHash,
      blockNumber,
      status,
      input,
      contractAddress,
      timestamp,
      value
    }
  }, { concurrency: Number(MAX_TRANSACTION_BATCH_SIZE) })

  if (transactions.length === 0) {
    transactions = [{
      blockHash,
      blockNumber
    }]
  }

  await Transaction.insertMany(transactions, { ordered: false })

  const log = [
    `#${blockNumber}[${block.transactions.length}]`
  ]

  const compareWith = Number(END_BLOCK) || latestBlockNumber
  if (compareWith) {
    const diff = compareWith - blockNum
    const progress = Math.floor((1 - (diff / compareWith)) * 10000) / 100
    log.push(`${progress}%`)
  }

  console.log(log.join(' '))
}

async function sync () {
  const lastBlockInRange = await Transaction.getLastBlockInRange(START_BLOCK, END_BLOCK)

  let startFrom
  if (lastBlockInRange) {
    startFrom = lastBlockInRange + 1
  } else {
    startFrom = Number(START_BLOCK)
  }

  let batch = []
  for (let i = startFrom; ; i++) {
    if (batch.length === Number(MAX_BLOCK_BATCH_SIZE)) {
      await Promise.all(batch)
      batch = []
    }

    if (END_BLOCK && i >= Number(END_BLOCK)) {
      console.log('Reached END_BLOCK', END_BLOCK)
      break
    }

    if (latestBlockNumber && i >= latestBlockNumber) {
      console.log('Reached latestBlockNumber', latestBlockNumber)
      break
    }

    batch.push(handleBlock(i))
  }

  if (batch.length !== 0) {
    await Promise.all(batch)
  }

  syncing = false

  console.log('Synced!')
}

async function latest () {
  const gap = Number(REORG_GAP)
  const subscription = web3.eth.subscribe('newBlockHeaders')

  subscription.on('data', block => {
    if (block) {
      latestBlockNumber = block.number

      if (!syncing && !END_BLOCK) {
        handleBlock(latestBlockNumber - gap)
      }
    }
  })

  subscription.on('error', handleError)
}

sync()
latest()
