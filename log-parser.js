const Sentry = require('@sentry/node')
const Abi = require('web3-eth-abi')

const EVENTS = require('./events.json')

const EVENT_SIG_MAP = EVENTS.reduce((acc, event) => {
  acc[event.signature] = event
  return acc
}, {})

function ensure0x (value) {
  if (value.startsWith('0x')) return value
  return `0x${value}`
}

module.exports = logs => logs.map(log => {
  const { address, topics, data } = log
  const signature = topics.shift()
  const event = EVENT_SIG_MAP[signature]
  if (!event) return false

  try {
    const { from, to, value } = Abi.decodeLog(event.abi, data, topics)

    return {
      signature: ensure0x(event.signature),
      contractAddress: ensure0x(address),
      from: ensure0x(from),
      to: ensure0x(to),
      value
    }
  } catch (e) {
    Sentry.withScope(scope => {
      scope.setTag('signature', signature)

      scope.setExtra('data', data)
      scope.setExtra('topics', topics)

      Sentry.captureException(e)
    })

    return false
  }
}).filter(log => log !== false)
