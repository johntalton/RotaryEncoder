
const fs = require('fs');

const BASE_10 = 10;

const MS_PER_S = 1000;

const DEFAULT_IDLE_POLL_MS = 0;
const DEFAULT_RETRY_POLL_S = 10;

class Config {
  static _getMs(cfg, name, defaultMs) {
    const ZERO = 0;

    const s = cfg[name + 'S'];
    const ms = cfg[name + 'Ms'];

    if(s === undefined && ms === undefined) { return defaultMs; }

    const s_z = s !== undefined ? s : ZERO;
    const ms_z = ms !== undefined ? ms : ZERO;

    return s_z * MS_PER_S + ms_z;
  }

  static config(path) {
    return new Promise(resolve => {
      fs.readFile(path, (err, data) => {
        if(err){
          console.log('default config not found', err);
          resolve({});
          return;
        }
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

    const envUrl = process.env.mqtturl; // eslint-disable-line no-process-env

    return {
      encoders: encoders,
      mqtt: {
        url: rawConfig.mqtt && rawConfig.mqtt.url ? rawConfig.mqtt.url : envUrl
      }
    };
  }

  static fillInEnc(enc, index) {
    const name = enc.name !== undefined ? enc.name : index.toString();
    const idleStatusPollMs = Config._getMs(enc, 'idleStatusPoll', DEFAULT_IDLE_POLL_MS);
    const retryMs = Config._getMs(enc, 'retry', DEFAULT_RETRY_POLL_S * MS_PER_S);

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
    if(!Number.isNaN(parseInt(pin, BASE_10))) { return { name: defaultName, disabled: false, gpio: pin, activeLow: false}; }

    const name = pin.name !== undefined ? pin.name : defaultName;
    const disabled = pin.disabled !== undefined ? pin.disabled : false;
    const activeLow = pin.activeLow !== undefined ? pin.activeLow : false;

    if(!disabled) {
      if(pin.gpio === undefined) { throw Error('undefined gpio for pin: ' + name); }
      if(Number.isNaN(parseInt(pin.gpio, BASE_10))) { throw Error('invalid pin gpio number: ' + name); }
    }

    return {
      name: name,
      disabled: disabled,
      gpio: pin.gpio,
      activeLow: activeLow
    };
  }

}

module.exports = Config;


