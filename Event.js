const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  signature: {
    type: String,
    index: true
  },
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

const Event = mongoose.model('Event', EventSchema)
module.exports = Event
