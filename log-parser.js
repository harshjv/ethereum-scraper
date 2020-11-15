const Abi = require('web3-eth-abi')

const EVENTS = require('./events.json')

const EVENT_SIG_MAP = EVENTS.reduce((acc, event) => {
  acc[event.signature] = event
  return acc
}, {})

module.exports = logs => logs.map(log => {
  const { address, topics, data } = log
  const topic0 = topics.shift()
  const event = EVENT_SIG_MAP[topic0]
  if (!event) return

  const { from, to, value } = Abi.decodeLog(event.abi, data, topics)

  return {
    signature: event.signature,
    contractAddress: address,
    from,
    to,
    value
  }
})
