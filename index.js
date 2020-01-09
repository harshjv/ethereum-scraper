const Sentry = require('@sentry/node')

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN
  })
} else {
  require('dotenv').config()
}

if (!process.env.MONGO_URI) throw new Error('Invalid MONGO_URI')
if (!process.env.WEB3_URI) throw new Error('Invalid WEB3_URI')
if (!process.env.MAX_BATCH_SIZE) throw new Error('Invalid MAX_BATCH_SIZE')
if (!process.env.START_FROM) throw new Error('Invalid START_FROM')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useCreateIndex: true })

switch (process.env.PROCESS_TYPE) {
  case 'api':
    require('./api')
    break
  case 'scrapper':
    require('./scrapper')
    break
  default:
    require('./api')
    require('./scrapper')
}
