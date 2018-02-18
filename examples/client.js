"use strict";


const mqtt = require('mqtt');
const onoff = require('onoff');
const Gpio = onoff.Gpio;

const State = require('../src/state.js');

function State_instance(machine) {
  return {
    state: machine.state,
    states: machine.states
  };
}

const config = {
  encoders: [
    {
      name: 'left',
      A: { gpio: 5, activeLow: false },
      B: { gpio: 6, activeLow: false },
      button: 12,
      pollTimeMs: 13 * 1000
    },
    {
      name: 'right',
      A: { gpio: 23, activeLow: true },
      B: { gpio: 24, activeLow: true },
      button: 25,
      pollTimeMs: 17 * 1000
    }
  ],
  mqtt: {
    url: process.env.mqtturl
  }
};

function defaultConfig() {
  return Promise.resolve(config);
}

function setupEncoders(config) {
  config.encoders.forEach(encoder => {
    encoder.client = buildClient(encoder)

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

    State.on(encoder.client.bmachine, 'UP', bhandler('UP'));
    State.on(encoder.client.bmachine, 'DOWN', bhandler('DOWN'));

    State.on(encoder.client.machine, 'CW', cury_handler('CW', 1));
    State.on(encoder.client.machine, 'CCW', cury_handler('CCW', -1));
    State.on(encoder.client.machine, 'RCW', cury_handler('RCW', 1));
    State.on(encoder.client.machine, 'RCCW', cury_handler('RCCW', -1));
  });

  return config;
}

function buildClient(config) {
  const client = {
    machine: State_instance(State.default),
    value: 0,
    A: new Gpio(config.A.gpio, 'in', 'both', { activeLow: config.A.activeLow }),
    B: new Gpio(config.B.gpio, 'in', 'both', { activeLow: config.B.activeLow }),
    button: new Gpio(config.button, 'in', 'both'),
    bmachine: {
      debug: false,
      state: 'init',
      states: {
        'init': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up', event: 'UP' } },
        'down': { 'down': { next: 'down' }, 'up': { next: 'up', event: 'UP' } },
        'up': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up' } }
      }
    }
  };

  function curry_watch(eventprefix) {
    return function(err, value) {
      if(err) { console.log(e); process.exit(-1); }
      State.to(client.machine, eventprefix + value);
    };
  }

  client.A.watch(curry_watch('A'));
  client.B.watch(curry_watch('B'));

  client.button.watch((err, value) => {
    if(err) { console.log(e); process.exit(-1); }
    State.to(client.bmachine, value === 1 ? 'down' : 'up');
  });

  function reaper(gpio) {
    return function reaper(err, value) {
      if(err) {
        console.log(config.name + ' ' + gpio.gpio, err);
        clearInterval(client.reaper);
            
        client.A.unexport();
        client.B.unexport();
        client.button.unexport();
      } 
    };
  }

  client.reaper = setInterval(() => {

    // console.log('reaper poll', config.name);
    if(client === undefined) {
      console.log('polling while down');
      return;
    }

    client.A.read(reaper(client.A));
    client.B.read(reaper(client.B));
    client.button.read(reaper(client.button));
  }, config.pollTimeMs);
  
  return client;
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

defaultConfig()
  .then(setupStore)
  .then(setupEncoders)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
