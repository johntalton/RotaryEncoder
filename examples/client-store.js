
const mqtt = require('mqtt');

class Store {
  static make(config) {
    if(config.url === undefined) { throw Error('undefined mqtt url'); }
    return mqtt.connect(config.url, { reconnectPeriod: config.reconnectMSecs });
  }

  static sendKnobEvent(client, encoder, event, delta) {
    if(client.connected) {
      const topic = 'rotaryEncoder/' + encoder.name;
      const msg = {
        name: encoder.name,
        event: event,
        delta: delta,
        estValue: encoder.client.value
      };
      console.log('publish: ', topic, msg);
      client.publish(topic, JSON.stringify(msg), {}, err => { console.log('publish error', err); });
    }
    else {
      console.log('not connected, cache value', encoder.name, encoder.client.value)
    }
  }

  static sendButtonEvent(client, encoder, event) {
    if(client.connected) {
      const topic = 'rotaryEncoder/' + encoder.name;
      const msg = {
        name: encoder.name,
        event: event,
        estValue: encoder.client.value
      };
      console.log('publish: ', topic, msg);
      client.publish(topic, JSON.stringify(msg), {}, err => { console.log('publish error', err); });
    }
    else {
      console.log('not connected, button event dropped', encoder.name);
    }
  }
}

module.exports = Store;
