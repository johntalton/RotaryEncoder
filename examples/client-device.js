"use strict";

const RotaryEncoder = require('../src/rotaryencoder.js');

class Device {
  static setupWithRetry(config) {
    return RotaryEncoder.setup(config)
      .then(enc => {
        console.log('Encoder', config.name, 'up\u00B9');
        config.client = enc;
      })
      .catch(e => {
        console.log('initial setup failure', e);

        if(false) { console.log('halting error'); return; }

        config.retrytimmer = setInterval(Device._retrySetup_poll, config.retryMs, config);
      });
  }

  static async _retrySetup_poll(config) {
    console.log('retry setup', config.name);
    // async off into oblivion
    const rv = await RotaryEncoder.setup(config)
      .then(enc => {
        console.log('Encoder ', config.name, 'up\u00B2');
        config.client = enc;

        clearInterval(config.retrytimmer);

        // start idlePoll
      })
      .catch(e => {
        console.log('retry setup failure', e);
      });
  }

  static startStream() {}

  static stopStream() {}

  static idleStatus_poll() {
  }
}

module.exports = Device;

