const Sentry = require('@sentry/node')

if (process.env.NODE_ENV === 'production') {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN
    })
  }
} else {
  require('dotenv').config()
}

const {
  MONGO_URI,
  WEB3_URI,
  PROCESS_TYPE
} = process.env

if (!MONGO_URI) throw new Error('Invalid MONGO_URI')
if (!WEB3_URI) throw new Error('Invalid WEB3_URI')

const mongoose = require('mongoose')
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })

switch (PROCESS_TYPE) {
  case 'api':
    require('./api')
    break
  case 'scraper':
    require('./scraper')
    break
  default:
    require('./api')
    require('./scraper')
}
