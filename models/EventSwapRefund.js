const mongoose = require('mongoose')

const EventSwapRefundSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    index: true,
    lowercase: true
  },
  txHash: {
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
  timestamp: {
    type: Number
  }
})

module.exports = mongoose.model('EventSwapRefund', EventSwapRefundSchema)
