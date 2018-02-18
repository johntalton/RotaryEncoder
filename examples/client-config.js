"use static"

const fs = require('fs');

class Config {
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
    let encoders = rawConfig.encoders ? rawConfig.encoders : []; // [rawConfig.encoders] ruby style?
    encoders = encoders.map((rawEnc, index) => {
      let name = rawEnc.name;
      if(name === undefined) { console.log('unnamed encoder', index); name = index.toString(); }


      if(!rawEnc.A) { console.log('encoder missing A config', name, ); return null; }
      if(rawEnc.A.gpio === undefined) { console.log('missing A.gpio', name); return null; }

      if(!rawEnc.B) { console.log('encoder missing B config', name, ); return null; }
      if(rawEnc.B.gpio === undefined) { console.log('missing B.gpio', name); return null; }

      let A = { gpio: rawEnc.A.gpio, activeLow: rawEnc.A.activeLow };
      if(rawEnc.A.activeLow === undefined) { console.log('assuming active low false for A', name); A.activeLow = false  }

      let B = { gpio: rawEnc.B.gpio, activeLow: rawEnc.B.activeLow };
      if(rawEnc.B.activeLow === undefined) { console.log('assuming active low false for B', name); B.activeLow = false  }


      let button = rawEnc.button;
      if(rawEnc.button === undefined) { console.log('no button config, assuming disabled'); button = undefined; }

      const S = rawEnc.pollTimeS ? rawEnc.pollTimeS : 0;
      const Ms = rawEnc.pollTimeMs ? rawEnc.pollTimeMs : 0;
      const pollTimeMs = S * 1000 + Ms;
  
      return {
        name: name,
        A: A,
        B: B,
        button: button,
        pollTimeMs: pollTimeMs
      }
    }).filter(enc => enc != null);

    return {
      encoders: encoders,
      mqtt: {
        url: (rawConfig.mqtt && rawConfig.mqtt.url) ? rawConfig.mqtt.url : process.env.mqtturl
      }
    };
  }

}

module.exports = Config;


