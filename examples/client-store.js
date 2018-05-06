"use strict";

const mqtt = require('mqtt');

class Store {
  static make(config) {
    //console.log('setup store ', config.url);
    if(config.url === undefined) { throw Error('undefined mqtt url'); }

    const client = mqtt.connect(config.url, { reconnectPeriod: config.reconnectMSecs });
    client.on('connect', () => { console.log('mqtt connected'); });
    client.on('reconnect', () => { });
    client.on('close', () => { });
    client.on('offline', () => { console.log('mqtt offline'); });
    client.on('error', (error) => { console.log(error); process.exit(-1); });

    return client;
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
      client.publish(topic, JSON.stringify(msg), {}, err => {});
    }
    else {
      console.log('not connected, cache value', encoder.name,  encoder.client.value)
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
      client.publish(topic, JSON.stringify(msg), {}, err => {});
    }
    else {
      console.log('not connected, button event dropped', encoder.name);
    }
  }
}

module.exports = Store;
