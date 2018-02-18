"use strict";

const Config = require('./client-config.js');
const RotaryEncoder = require('../src/rotaryencoder.js');
const Store = require('./client-store.js');

function setupEncoders(config) {
  config.encoders.forEach(encoder => setupEncoder(config, encoder));
  return config;
}

function setupEncoder(config, encoder) {
  encoder.client = RotaryEncoder.make(encoder);

  function cury_handler(event, delta) {
    return function() {
      encoder.client.value += delta;
      Store.sendKnobEvent(config.mqtt.client, encoder, event, delta);
    }
  }

  RotaryEncoder.cw(encoder.client, cury_handler('CW', 1));
  RotaryEncoder.ccw(encoder.client, cury_handler('CCW', -1));
  RotaryEncoder.rcw(encoder.client, cury_handler('RCW', 1));
  RotaryEncoder.rccw(encoder.client, cury_handler('RCCW', -1));
  
  function bhandler(event) {
    return function() {
      Store.sendButtonEvent(config.mqtt.client, encoder, event)
    }
  }

  RotaryEncoder.buttonUp(encoder.client, bhandler('UP'));
  RotaryEncoder.buttonDown(encoder.client, bhandler('DOWN'));
}

Config.config('./client.json')
  .then(config => { config.mqtt.client = Store.make(config.mqtt); return config; })
  .then(setupEncoders)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
