const EventERC20Transfer = require('./models/EventERC20Transfer')
const EventSwapClaim = require('./models/EventSwapClaim')
const EventSwapRefund = require('./models/EventSwapRefund')

module.exports = [{
  name: 'Transfer(address,address,uint256)',
  model: EventERC20Transfer,
  abi: [{
    type: 'address',
    name: 'from',
    indexed: true
  }, {
    type: 'address',
    name: 'to',
    indexed: true
  }, {
    type: 'uint256',
    name: 'value'
  }]
},
{
  name: 'Claim(bytes32)',
  model: EventSwapClaim,
  abi: [{
    type: 'bytes32',
    name: 'secret'
  }]
},
{
  name: 'Refund()',
  model: EventSwapRefund,
  abi: [{
    type: 'bytes32',
    name: 'secret'
  }]
}]
