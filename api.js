const Sentry = require('@sentry/node')

const express = require('express')
const helmet = require('helmet')
const compression = require('compression')
const asyncHandler = require('express-async-handler')

const Transaction = require('./Transaction')
const httpError = require('./http-error')

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(Sentry.Handlers.requestHandler())
}

app.use(helmet())
app.use(compression())
app.set('etag', false)

app.get('/txs/:account', asyncHandler(async (req, res, next) => {
  const { account } = req.params

  const txs = await Transaction.find({ from: account }).exec()

  res.set('Access-Control-Allow-Origin', '*')

  res.json({
    status: 'OK',
    data: {
      txs: txs.map(tx => {
        const json = tx.toJSON()

        delete json._id
        delete json.verified
        delete json.__v

        return json
      })
    }
  })
}))

app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || err.toString()

  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  return httpError(req, res, status, message)
})

app.listen(process.env.PORT)

console.log(`API is running on ${process.env.PORT}`)
