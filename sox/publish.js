// TODO: translate comments into English when complete
var DEFAULT_BOSH = 'http://sox.ht.sfc.keio.ac.jp:5280/http-bind/'
var DEFAULT_XMPP = 'sox.ht.sfc.keio.ac.jp'
var SoxConnection = require('soxjs2').SoxConnection
var TransducerValue = require('soxjs2').TransducerValue
var Data = require('soxjs2').Data

module.exports = function(RED) {
  'use strict'
  function SoxPublishNode(config) {
    RED.nodes.createNode(this, config)

    this.login = RED.nodes.getNode(config.login)
    if (!this.login) {
      node.error('No credentials specified')
      return
    }

    this.device = config.device

    this.bosh = this.login.bosh || DEFAULT_BOSH
    this.xmpp = this.login.xmpp || DEFAULT_XMPP
    this.jid = this.login.jid
    this.password = this.login.password

    var node = this

    node.on('input', function(msg) {
      node.client = new SoxConnection(node.bosh, node.xmpp)
      var domain = node.client.getDomain()

      node.client.connect(() => {
        node.status({ fill: 'green', shape: 'dot', text: 'request...' })

        var device = node.client.bind(node.device, domain)
        var values = []
        Object.keys(msg.transducer).forEach(function(key) {
          var t_val = new TransducerValue(
            key,
            msg.transducer[key],
            msg.transducer[key]
          )
          values.push(t_val)
        })

        var data = new Data(device, values)

        var suc = function() {
          console.log('\n\n@@@@ suc\n\n')
          node.send({ payload: 'Success' })
          node.status({})
        }

        var err = function() {
          console.log('\n\n@@@@ err\n\n')
          node.send({ payload: 'Error' })
          node.status({ fill: 'red', shape: 'dot', text: 'error' })
        }

        node.client.publish(data, suc, err)
      })
    })

    node.on('close', function() {
      node.client.disconnect()
      node.status({})
    })
  }
  RED.nodes.registerType('Publish', SoxPublishNode)
}
