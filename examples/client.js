"use strict";

const onoff = require('onoff');
const Gpio = onoff.Gpio;

class RotaryEncoder {
  static init(A, B, button) {
    
  }
}

const config = {
  encoders: [
    {
      Asignal: 5,
      Bsignal: 6,
      button: 12
    },
    {
      Asignal: 0,
      Bsignal: 0,
      button: 0 
    }
  ]
};

function defaultConfig() {
  return Promise.resolve(config);
}

function setupEncoders(config) {
  config.encoders.map(encoder => {
    encoder.client = {};
    encoder.client.A = new Gpio(encoder.Asignal, 'in');
    encoder.client.B = new Gpio(encoder.Bsignal, 'in');
    encoder.client.button = new Gpio(encoder.button, 'in');

    encoder.client.A.watch((err, value) => {
      if(err) {}
      console.log('A', err, value);
    });

    encoder.client.B.watch((err, value) => {
      console.log('B', err, value);
    });

    encoder.client.button.watch((err, value) => {
      console.log('button', err, value);
    });
  });
}

defaultConfig()
  .then(setupEncoders)

  .catch(e => {
    console.log('top-level error', e);
    process.exit(-1);
  });
