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
  status: {
    type: Boolean,
    index: true
  },
  input: {
    type: String
  },
  contractAddress: {
    type: String,
    index: true
  },
  timestamp: {
    type: Number
  },
  value: {
    type: Number
  }
})

TransactionSchema.static('getLastBlockInRange', function (start, end) {
  const query = {
    blockNumber: {
      $gte: Number(start)
    }
  }

  if (end) {
    query.blockNumber.$lte = Number(end)
  }

  return Transaction
    .findOne(query)
    .sort('-blockNumber')
    .select('blockNumber')
    .exec()
    .then(tx => {
      if (tx) return tx.blockNumber
    })
})

const Transaction = mongoose.model('Transaction', TransactionSchema)
module.exports = Transaction
