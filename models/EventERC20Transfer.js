const mongoose = require('mongoose')

const EventERC20TransferSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    index: true,
    lowercase: true
  },
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
  value: {
    type: Number
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

module.exports = mongoose.model('EventERC20Transfer', EventERC20TransferSchema)
