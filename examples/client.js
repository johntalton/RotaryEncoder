
const Device = require('./client-device.js');
const Config = require('./client-config.js');
const Store = require('./client-store.js');

function startStreaming(config) {
  //console.log('start all streams', config);
  config.encoders.forEach(enc => Device.startStream(enc));
}

function stopStreaming(config) {
  config.encoders.forEach(enc => Device.stopStream(enc));
}

function setupEncoders(config) {
  return Promise.all(config.encoders.map(encoder => Device.setupWithRetry(encoder)))
    .then(() => config);
}

function setupStore(config) {
  config.mqtt.client = Store.make(config.mqtt);

  config.mqtt.client.on('connect', () => { console.log('mqtt connected'); startStreaming(config); });
  //config.mqtt.client.on('reconnect', () => { });
  //config.mqtt.client.on('close', () => { });
  config.mqtt.client.on('offline', () => { console.log('mqtt offline'); stopStreaming(config); });
  config.mqtt.client.on('error', (error) => { console.log(error); throw Error('mqtt error' + error.toString()) });

  return config;
}

Config.config('./client.json')
  .then(setupEncoders)
  .then(setupStore)
  .then(() => { console.log('Up.'); })
  .catch(e => {
    console.log('top-level error', e);
    //process.exit(-1); // eslint-disable-line no-process-exit
  });
