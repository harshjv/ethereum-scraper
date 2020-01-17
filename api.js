const Sentry = require('@sentry/node')

const Web3 = require('web3')
const express = require('express')
const helmet = require('helmet')
const compression = require('compression')
const asyncHandler = require('express-async-handler')

const Transaction = require('./Transaction')
const httpError = require('./http-error')

const {
  PORT,
  WEB3_URI,
  NODE_ENV
} = process.env

if (!PORT) throw new Error('Invalid PORT')

const web3 = new Web3(WEB3_URI)
const app = express()

if (NODE_ENV === 'production') {
  app.use(Sentry.Handlers.requestHandler())
}

app.use(helmet())
app.use(compression())
app.set('etag', false)

app.get('/txs/:account', asyncHandler(async (req, res, next) => {
  const { account } = req.params
  let { limit, page, sort } = req.query

  const q = Transaction.find({
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

  if (limit || page) {
    page = Number(page)
    limit = Number(limit)

    if (!page) page = 1
    if (!limit) limit = 250

    q.limit(limit).skip(limit * page)
  }

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
