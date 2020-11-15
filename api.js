const Sentry = require('@sentry/node')

const Web3 = require('web3')
const express = require('express')
const helmet = require('helmet')
const compression = require('compression')
const asyncHandler = require('express-async-handler')

const Event = require('./Event')
const Transaction = require('./Transaction')
const httpError = require('./http-error')

const {
  PORT,
  WEB3_URI,
  NODE_ENV
} = process.env

if (!PORT) throw new Error('Invalid PORT')

const parseNonZeroPositiveIntOrDefault = (value, defaultValue) => {
  try {
    value = parseInt(value)
    if (!(value > 0)) throw new Error('Invalid value')
  } catch (e) {
    return defaultValue
  }

  return value
}

const web3 = new Web3(WEB3_URI)
const app = express()

if (NODE_ENV === 'production') {
  app.use(Sentry.Handlers.requestHandler())
}

app.use(helmet())
app.use(compression())
app.set('etag', false)

app.get('/status', asyncHandler(async (req, res, next) => {
  let { maxgap } = req.query

  const [latest, tx] = await Promise.all([
    web3.eth.getBlock('latest'),
    Transaction.findOne({}).sort('-blockNumber').select('blockNumber').exec()
  ])

  const difference = latest.number - tx.blockNumber

  maxgap = parseNonZeroPositiveIntOrDefault(maxgap, false)

  res.set('Access-Control-Allow-Origin', '*')

  const status = {
    latestBlockNumber: latest.number,
    latestScrapedBlockNumber: tx.blockNumber,
    difference
  }

  if (maxgap && difference > maxgap) {
    res.status(503)
    res.json({
      status: 'ERROR',
      data: { status }
    })
    return
  }

  res.json({
    status: 'OK',
    data: { status }
  })
}))

app.get('/txs/:account', asyncHandler(async (req, res, next) => {
  const { account } = req.params
  let { limit, page, sort, fromBlock, toBlock } = req.query

  const blockQuery = {}
  fromBlock = parseNonZeroPositiveIntOrDefault(fromBlock, false)
  toBlock = parseNonZeroPositiveIntOrDefault(toBlock, false)

  if (fromBlock !== false) {
    blockQuery.blockNumber = {
      $gte: fromBlock
    }
  }

  if (toBlock !== false) {
    if (fromBlock !== false) {
      blockQuery.blockNumber.$lte = toBlock
    } else {
      blockQuery.blockNumber = {
        $lte: toBlock
      }
    }
  }

  const q = Transaction.find({
    ...blockQuery,
    $or: [
      { to: account },
      { from: account }
    ]
  })

  if (sort === 'asc') {
    q.sort('blockNumber')
  } else {
    sort = 'desc'
    q.sort('-blockNumber')
  }

  page = parseNonZeroPositiveIntOrDefault(page, 1)
  limit = parseNonZeroPositiveIntOrDefault(limit, 1)

  q.limit(limit).skip(limit * (page - 1))

  const [latest, txs] = await Promise.all([
    web3.eth.getBlock('latest'),
    q.exec()
  ])

  const data = {}

  if (limit || page) {
    data.pagination = {
      sort,
      page,
      limit
    }
  }

  data.txs = txs.map(tx => {
    const json = tx.toJSON()

    delete json._id
    delete json.verified
    delete json.__v

    json.confirmations = latest.number - tx.blockNumber

    return json
  })

  res.set('Access-Control-Allow-Origin', '*')

  res.json({
    status: 'OK',
    data
  })
}))

app.get('/events/:account', asyncHandler(async (req, res, next) => {
  const { account } = req.params
  let { signature, contractAddress, limit, page, sort, fromBlock, toBlock } = req.query

  if (!signature) return httpError(req, res, 400, 'Missing field: signature')
  if (!contractAddress) return httpError(req, res, 400, 'Missing field: contractAddress')

  const blockQuery = {
    signature,
    contractAddress
  }

  fromBlock = parseNonZeroPositiveIntOrDefault(fromBlock, false)
  toBlock = parseNonZeroPositiveIntOrDefault(toBlock, false)

  if (fromBlock !== false) {
    blockQuery.blockNumber = {
      $gte: fromBlock
    }
  }

  if (toBlock !== false) {
    if (fromBlock !== false) {
      blockQuery.blockNumber.$lte = toBlock
    } else {
      blockQuery.blockNumber = {
        $lte: toBlock
      }
    }
  }

  const q = Event.find({
    ...blockQuery,
    $or: [
      { to: account },
      { from: account }
    ]
  })

  if (sort === 'asc') {
    q.sort('blockNumber')
  } else {
    sort = 'desc'
    q.sort('-blockNumber')
  }

  page = parseNonZeroPositiveIntOrDefault(page, 1)
  limit = parseNonZeroPositiveIntOrDefault(limit, 1)

  q.limit(limit).skip(limit * (page - 1))

  const [latest, txs] = await Promise.all([
    web3.eth.getBlock('latest'),
    q.exec()
  ])

  const data = {}

  if (limit || page) {
    data.pagination = {
      sort,
      page,
      limit
    }
  }

  data.txs = txs.map(tx => {
    const json = tx.toJSON()

    delete json._id
    delete json.verified
    delete json.__v

    json.confirmations = latest.number - tx.blockNumber

    return json
  })

  res.set('Access-Control-Allow-Origin', '*')

  res.json({
    status: 'OK',
    data
  })
}))

app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || err.toString()

  if (NODE_ENV !== 'production') {
    console.error(err)
  }

  return httpError(req, res, status, message)
})

app.listen(PORT)

console.log(`API is running on ${PORT}`)
