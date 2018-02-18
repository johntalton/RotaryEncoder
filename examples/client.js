"use strict";

const mqtt = require('mqtt');

const Config = require('./client-config.js');
const RotaryEncoder = require('../src/rotaryencoder.js');

function setupEncoders(config) {
  config.encoders.forEach(encoder => {
    console.log('build encoder: ' + encoder.name, encoder);
    encoder.client = RotaryEncoder.make(encoder);

    function cury_handler(event, delta) {
      return function() {
        // updated est value even when not connected
        encoder.client.value += delta;
        
        if(config.mqtt.client.connected) {
          const topic = 'rotaryEncoder/' + encoder.name;
          const msg = {
            name: encoder.name,
            event: event,
            delta: delta,
            estValue: encoder.client.value
          };
          console.log('publish: ', topic, msg);
          config.mqtt.client.publish(topic, JSON.stringify(msg), {}, err => {});
        } 
        else {
          console.log('not connected, cache value', encoder.name,  encoder.client.value)
        }
      }
    }

    function bhandler(event) {
      return () => {
        if(config.mqtt.client.connected) {
          const topic = 'rotaryEncoder/' + encoder.name;
          const msg = {
            name: encoder.name,
            event: event,
            estValue: encoder.client.value
          };
          console.log('publish: ', topic, msg);
          config.mqtt.client.publish(topic, JSON.stringify(msg), {}, err => {});
        }
      }
    }

    RotaryEncoder.buttonUp(encoder.client, bhandler('UP'));
    RotaryEncoder.buttonDown(encoder.client, bhandler('DOWN'));

    RotaryEncoder.cw(encoder.client, cury_handler('CW', 1));
    RotaryEncoder.ccw(encoder.client, cury_handler('CCW', -1));
    RotaryEncoder.rcw(encoder.client, cury_handler('RCW', 1));
    RotaryEncoder.rccw(encoder.client, cury_handler('RCCW', -1));
  });

  return config;
}

function setupStore(config) {
  console.log('setup store ', config.mqtt.url);
  if(config.mqtt.url === undefined) { return Promise.reject('undefined mqtt url'); }
  
  config.mqtt.client = mqtt.connect(config.mqtt.url, { reconnectPeriod: config.mqtt.reconnectMSecs });
  config.mqtt.client.on('connect', () => { console.log('mqtt connected'); });
  config.mqtt.client.on('reconnect', () => { });
  config.mqtt.client.on('close', () => { });
  config.mqtt.client.on('offline', () => { console.log('mqtt offline'); });
  config.mqtt.client.on('error', (error) => { console.log(error); process.exit(-1); });

  return Promise.resolve(config);
}

Config.config('./client.json')
  .then(setupStore)
  .then(setupEncoders)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
