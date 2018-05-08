
const EventEmiter = require('events');

const RotaryEncoder = require('../src/rotaryencoder.js');

/**
 *
 *
 * knobtouch
 * knobidle
 * knobdown
 * knobup
 * knobrotate
 **/
class Device extends EventEmiter {
  static setupWithRetry(config) {
    return RotaryEncoder.setup(config)
      .then(enc => {
        console.log('Encoder', config.name, 'up\u00B9');

        config.client = enc;
        Device._configure(config);
      })
      .catch(e => {
        console.log('initial setup failure', e);

        // if(false) { console.log('halting error'); return; }

        config.retrytimmer = setInterval(Device._retrySetup_poll, config.retryMs, config);
      });
  }

  static async _retrySetup_poll(config) {
    console.log('retry setup', config.name);

    await RotaryEncoder.setup(config)
      .then(enc => {
        console.log('Encoder ', config.name, 'up\u00B2');

        clearInterval(config.retrytimmer);

        config.client = enc;
        Device._configure(config);
      })
      .catch(e => {
        console.log('retry setup failure', e);
      });
  }

  static _configure(config) {
    const enc = config.client;

    enc.on('up', () => console.log('up'));
    enc.on('down', () => console.log('down'));

    enc.on('CW', () => console.log('CW'));
    enc.on('RCW', () => console.log('RCW'));
    enc.on('CCW', () => console.log('CCW'));
    enc.on('RCCW', () => console.log('RCCW'));

    // idel status timer
  }

  static startStream(config) {
    console.log('starting device stream', config.name);
    if(config.client === undefined) { console.log('trying to start unsetup stream'); return; }
    config.client.start();
  }

  static stopStream(config) {
    if(config.client === undefined) { return; }
    config.client.stop();
  }

  static async idleStatus_poll(config) {
    await config.client.probe()
      .then(result => {
        console.log('probe returned', result)
      });
  }
}

module.exports = Device;

