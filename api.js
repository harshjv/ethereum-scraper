const Sentry = require('@sentry/node')

const Web3 = require('web3')
const express = require('express')
const helmet = require('helmet')
const compression = require('compression')

const {
  PORT,
  WEB3_URI,
  NODE_ENV
} = process.env

if (!PORT) throw new Error('Invalid PORT')

const app = express()
const web3 = new Web3(WEB3_URI)

if (NODE_ENV === 'production') {
  app.use(Sentry.Handlers.requestHandler())
}

app.use(helmet())
app.use(compression())
app.use(require('./middlewares/httpHelpers'))
app.set('etag', false)
app.set('web3', web3)

app.use('/status', require('./routes/status'))
app.use('/txs', require('./routes/txs'))
app.use('/events', require('./routes/events'))

app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || err.toString()

  if (NODE_ENV !== 'production') {
    console.error(err)
  }

  return res.notOk(status, message)
})

app.listen(PORT)

console.log(`API is running on ${PORT}`)
