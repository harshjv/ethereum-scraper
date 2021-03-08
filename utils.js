const Sentry = require('@sentry/node')
const Abi = require('web3-eth-abi')
const createKeccakHash = require('keccak')

const eventList = require('./eventList')
const ensure0xTypes = ['address', 'bytes32']

const keccak256 = str => createKeccakHash('keccak256').update(str).digest().toString('hex')
const ensure0x = value => value.startsWith('0x') ? value : `0x${value}`

const EVENT_SIG_MAP = eventList.reduce((acc, event, index) => {
  const signature = ensure0x(keccak256(event.name))
  acc[signature] = event
  return acc
}, {})

const parseNonZeroPositiveIntOrDefault = (value, defaultValue) => {
  try {
    value = parseInt(value)
    if (!(value > 0)) throw new Error('Invalid value')
  } catch (e) {
    return defaultValue
  }

  return value
}

const createCommonQuery = ({ limit, page, sort, fromBlock, toBlock }) => {
  const filter = {}
  const options = {}

  fromBlock = parseNonZeroPositiveIntOrDefault(fromBlock, false)
  toBlock = parseNonZeroPositiveIntOrDefault(toBlock, false)

  if (fromBlock !== false) {
    filter.blockNumber = {
      $gte: fromBlock
    }
  }

  if (toBlock !== false) {
    if (fromBlock !== false) {
      filter.blockNumber.$lte = toBlock
    } else {
      filter.blockNumber = {
        $lte: toBlock
      }
    }
  }

  if (sort === 'asc') {
    options.sort = { blockNumber: 1 }
  } else {
    sort = 'desc'
    options.sort = { blockNumber: -1 }
  }

  page = parseNonZeroPositiveIntOrDefault(page, 1)
  limit = parseNonZeroPositiveIntOrDefault(limit, 1)

  options.limit = limit
  options.skip = limit * (page - 1)

  return {
    filter,
    options,
    pagination: {
      sort,
      page,
      limit
    }
  }
}

const logParser = ({ address, topics, data }) => {
  const signature = topics.shift()
  const event = EVENT_SIG_MAP[signature]
  if (!event) return false

  const { abi, type } = event
  if (topics.length !== (abi.length - 1)) return false

  try {
    const decodedLog = Abi.decodeLog(abi, data, topics)
    const decodedLogWith0x = Object
      .entries(decodedLog)
      .reduce((acc, [key, value]) => {
        if (ensure0xTypes.includes(key)) {
          value = ensure0x(value)
        }

        acc[key] = value

        return acc
      }, {})

    return {
      type,
      contractAddress: ensure0x(address),
      data: decodedLogWith0x
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
}

module.exports = {
  parseNonZeroPositiveIntOrDefault,
  createCommonQuery,
  ensure0x,
  keccak256,
  logParser
}
