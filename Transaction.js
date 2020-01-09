const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  from: {
    type: String,
    index: true,
    lowercase: true
  },
  to: {
    type: String,
    index: true,
    lowercase: true
  },
  hash: {
    type: String,
    index: true,
    lowercase: true
  },
  blockHash: {
    type: String,
    index: true,
    lowercase: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  verified: {
    type: Boolean,
    index: true
  }
})

TransactionSchema.static('getLastVerifiedBlockNumber', function () {
  return Transaction
    .findOne({ verified: true })
    .sort('-blockNumber')
    .select('blockNumber')
    .exec()
    .then(tx => {
      if (tx) return tx.blockNumber

      return 0
    })
})

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction
