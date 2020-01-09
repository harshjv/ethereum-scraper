const Web3 = require('web3')

const Transaction = require('./Transaction')

const {
  WEB3_URI,
  MAX_BATCH_SIZE,
  START_FROM,
  NO_PREVIOUS
} = process.env

if (!WEB3_URI) throw new Error('Invalid WEB3_URI')
if (!MAX_BATCH_SIZE) throw new Error('Invalid MAX_BATCH_SIZE')
if (!START_FROM) throw new Error('Invalid START_FROM')

const web3 = new Web3(WEB3_URI)

let latestBlockStartedFrom = null
const REVISIT_BLOCKS_MAP = {}

async function handleBlock (blockNum, verified) {
  if (!blockNum) return
  if (verified) {
    const exist = await Transaction.findOne({ blockNumber: blockNum }).exec()

    if (exist) {
      if (!exist.verified) {
        await Transaction.updateMany({ blockNumber: blockNum }, { $set: { verified: true } }).exec()
        console.log(`✅ #${blockNum}`)
      }

      return
    }
  }

  const block = await web3.eth.getBlock(blockNum, true)
  if (block) {
    if (REVISIT_BLOCKS_MAP[`${blockNum}`]) {
      delete REVISIT_BLOCKS_MAP[`${blockNum}`]
    }
  } else {
    REVISIT_BLOCKS_MAP[`${blockNum}`] = true
    return
  }

  const blockNumber = block.number
  const blockHash = block.hash

  let transactions = block.transactions.map(({ hash, from, to }) => {
    return {
      from,
      to,
      hash,
      blockHash,
      blockNumber,
      verified
    }
  })

  if (transactions.length === 0) {
    transactions = [{
      blockHash,
      blockNumber,
      verified
    }]
  }

  await Transaction.insertMany(transactions, { ordered: false })

  const log = [
    verified ? '📝' : '⚡️',
    `#${blockNumber}[${block.transactions.length}]`
  ]

  if (verified && latestBlockStartedFrom) {
    const diff = latestBlockStartedFrom - blockNum
    const progress = Math.floor((1 - (diff / latestBlockStartedFrom)) * 10000) / 100
    log.push(`${progress}%`)
  }

  console.log(log.join(' '))
}

async function syncFromStart () {
  const lastVerifiedBlockblockNumber = await Transaction.getLastVerifiedBlockNumber()
  const startFromBlockNumber = Math.max(lastVerifiedBlockblockNumber + 1, Number(START_FROM))

  let batch = []

  for (let i = startFromBlockNumber; ; i++) {
    batch.push(handleBlock(i, true))

    if (batch.length === Number(MAX_BATCH_SIZE)) {
      await Promise.all(batch)
      batch = []
    }

    if (latestBlockStartedFrom && i >= latestBlockStartedFrom) {
      break
    }
  }
}

async function syncFromEnd () {
  const subscription = web3.eth.subscribe('newBlockHeaders')

  subscription.on('data', block => {
    if (block) {
      handleBlock(block.number)

      if (!latestBlockStartedFrom) latestBlockStartedFrom = block.number
    }

    const pendingBlockNumbers = Object.keys(REVISIT_BLOCKS_MAP)

    for (let i = 0; i < pendingBlockNumbers.length; i++) {
      handleBlock(pendingBlockNumbers[i])
    }
  })

  subscription.on('error', console.error.bind(console))
}

if (NO_PREVIOUS !== 'true') {
  syncFromStart()
}

syncFromEnd()
