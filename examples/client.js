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
      pollTimeMs: 0
    },
    {
      name: 'right',
      A: { gpio: 23, activeLow: true },
      B: { gpio: 24, activeLow: true },
      button: 25,
      pollTimeMs: 10 * 100
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
  config.encoders.map(encoder => {
    encoder.client = { value: 0 };
    encoder.client.A = new Gpio(encoder.A.gpio, 'in', 'both', { activeLow: encoder.A.activeLow });
    encoder.client.B = new Gpio(encoder.B.gpio, 'in', 'both', { activeLow: encoder.B.activeLow });
    encoder.client.button = new Gpio(encoder.button, 'in', 'both');

    // each encoder has its own instance
    encoder.client.machine = State_instance(State.default);

    function cury_handler(event, delta) {
      return function() {
        encoder.client.value += delta;
        console.log(encoder.name, event, encoder.client.value);
      }
    }

    State.on(encoder.client.machine, cury_handler('CW', 1));
    State.on(encoder.client.machine, cury_handler('CCW', -1));
    State.on(encoder.client.machine, cury_handler('RCW', 1));
    State.on(encoder.client.machine, 'RCCW', -1));

    encoder.client.A.watch((err, value) => {
      if(err) { console.log(e); process.exit(-1); }
      //console.log(encoder.name, 'A', err, value);
      State.to(encoder.client.machine, 'A' + value);
    });

    encoder.client.B.watch((err, value) => {
      if(err) { console.log(e); process.exit(-1); }
      //console.log(encoder.name, 'B', err, value);
      State.to(encoder.client.machine, 'B' + value);
    });

    encoder.client.buttonState = false;
    encoder.client.button.watch((err, value) => {
      if(err) { console.log(e); process.exit(-1); }
      //console.log(encoder.name, 'button', err, value);
      if(value === 0 && encoder.client.buttonState) {
        console.log(encoder.name + ' up');
        encoder.client.buttonState = false;
      } else if(value === 1 && !encoder.client.buttonState) {
        console.log(encoder.name + ' down');
        encoder.client.buttonState = true;
      }
    });

    encoder.client.reaper = setInterval(() => {
      if(encoder.client === undefined) {
        console.log('polling while down');
        return;
      }

      function reaper(gpio) {
        return function reaper(err, value) {
          if(err) {
            console.log(encoder.name + ' ' + gpio.gpio, err);
            //clearInterval(encoder.client.reaper);
            
            encoder.client.A.unexport();
            encoder.client.B.unexport();
            encoder.client.button.unexport();
            encoder.client = undefined;
          } 
        };
      }

      encoder.client.A.read(reaper(encoder.client.A));
      encoder.client.B.read(reaper(encoder.client.B));
      encoder.client.button.read(reaper(encoder.client.button));
    }, encoder.pollTimeMs);
  });

  return config;
}

function setupStore(config) {
 console.log('setup store ', config.mqtt.url);
 if(application.mqtt.url === undefined) { return Promise.reject('undefined mqtt url'); }
    application.mqtt.client = mqtt.connect(config.mqtt.url, { reconnectPeriod: config.mqtt.reconnectMSecs });
    application.mqtt.client.on('connect', () => { State.to(config.mqtt.machine, 'mqtt') });
    application.mqtt.client.on('reconnect', () => { });
    application.mqtt.client.on('close', () => { });
    application.mqtt.client.on('offline', () => { State.to(application.mqtt.machine, 'dmqtt'); });
    application.mqtt.client.on('error', (error) => { console.log(error); process.exit(-1); });

    confing.machine

    return Promise.resolve(application);

}

defaultConfig()
  .then(setupState)
  .then(setupEncoders)
  .then(setupStore)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
