const asyncHandler = require('express-async-handler')
const EventERC20Transfer = require('../models/EventERC20Transfer')
const EventSwapClaim = require('../models/EventSwapClaim')
const { createCommonQuery } = require('../utils')
const router = require('express').Router()

router.get('/erc20Transfer/:contractAddress', asyncHandler(async (req, res) => {
  const web3 = req.app.get('web3')
  const { contractAddress } = req.params

  const { filter, options, pagination } = createCommonQuery(req.query)
  const { address } = req.query
  if (!address) return res.notOk(400, 'Missing query: address')

  const q = EventERC20Transfer.find({
    ...filter,
    contractAddress,
    $or: [
      { to: address },
      { from: address }
    ]
  }, null, options)

  const [latest, txs] = await Promise.all([
    web3.eth.getBlock('latest'),
    q.exec()
  ])

  const data = { pagination }

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

router.get('/swapClaim/:contractAddress', asyncHandler(async (req, res) => {
  const web3 = req.app.get('web3')
  const { contractAddress } = req.params

  const { filter, options, pagination } = createCommonQuery(req.query)

  const q = EventSwapClaim.find({
    ...filter,
    contractAddress
  }, null, options)

  const [latest, txs] = await Promise.all([
    web3.eth.getBlock('latest'),
    q.exec()
  ])

  const data = { pagination }

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

module.exports = router
