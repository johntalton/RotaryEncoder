"use strict";

const Device = require('./client-device.js');
const Config = require('./client-config.js');
const Store = require('./client-store.js');

function setupEncoders(config) {
  return Promise.all(config.encoders.map(encoder => Device.setupWithRetry(encoder).then(_ => {
    console.log('binding events to device');
    return config;
  })));
}

function setupStore(config) {
  config.mqtt.client = Store.make(config.mqtt);
  return config;
}

Config.config('./client.json')
  .then(setupStore)
  .then(setupEncoders)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
