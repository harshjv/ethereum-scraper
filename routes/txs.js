const asyncHandler = require('express-async-handler')
const Transaction = require('../models/Transaction')
const { createCommonQuery } = require('../utils')
const router = require('express').Router()

router.get('/:account', asyncHandler(async (req, res) => {
  const web3 = req.app.get('web3')
  const { account } = req.params

  const { filter, options, pagination } = createCommonQuery(req.query)

  const q = Transaction.find({
    ...filter,
    $or: [
      { to: account },
      { from: account }
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

module.exports = router
