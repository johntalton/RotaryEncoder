"use static"

const fs = require('fs');

class Config {
  static _getMs(cfg, name, defaultMs) {
    const s = cfg[name + 'S'];
    const ms = cfg[name + 'Ms'];

    if(s === undefined && ms === undefined) { return defaultMs; }

    const s_z = s !== undefined ? s : 0;
    const ms_z = ms !== undefined ? ms : 0;

    return s_z * 1000 + ms_z;
  }

  static config(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if(err){ console.log('default config not found', err); resolve({}); return; }
        resolve(JSON.parse(data));
       });
    })
    .then(Config.fillInTheBlanks);
  }

  static fillInTheBlanks(rawConfig) {
    if(!Array.isArray(rawConfig.encoders)) { throw Error('encoders is not an array'); }

    const encoders = rawConfig.encoders.map((rawEnc, index) => {
      return Config.fillInEnc(rawEnc, index);
    });

    return {
      encoders: encoders,
      mqtt: {
        url: (rawConfig.mqtt && rawConfig.mqtt.url) ? rawConfig.mqtt.url : process.env.mqtturl
      }
    };
  }

  static fillInEnc(enc, index) {
    const name = (enc.name !== undefined) ? enc.name : index.toString();
    const idleStatusPollMs = Config._getMs(enc, 'idleStatusPoll', 0);
    const retryMs = Config._getMs(enc, 'retry', 10 * 1000);

    return {
      name: name,
      A: Config.fillInGpio(enc.A, 'A'),
      B: Config.fillInGpio(enc.B, 'B'),
      button: Config.fillInGpio(enc.button, 'button'),
      idleStatusPollMs: idleStatusPollMs,
      retryMs: retryMs
    };
  }

  static fillInGpio(pin, defaultName) {
    if(pin === undefined) { return { disabled: true, name: defaultName }; }
    if(!Number.isNaN(parseInt(pin))) { return { name: defaultName, disabled: false, gpio: pin, activeLow: false}; }

    const name = (pin.name !== undefined) ? pin.name : defaultName;
    const disabled = (pin.disabled !== undefined) ? pin.disabled : false;
    const activeLow = (pin.activeLow !== undefined) ? pin.activeLow : false;

    if(!disabled) {
      if(pin.gpio === undefined) { throw Error('undefined gpio for pin: ' + name); }
      if(Number.isNaN(parseInt(pin.gpio))) { throw Error('invalid pin gpio number: ' + namne); }
    }

    const gpio = pin.gpio;

    return {
      name: name,
      disabled: disabled,
      gpio: gpio,
      activeLow: activeLow
    };
  }

}

module.exports = Config;


