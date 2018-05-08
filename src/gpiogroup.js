
const { Gpio } = require('onoff');

class GpioUtil {
  // setup single pin or throw (also undef all disableds)
  static _setup(gpio) {
    console.log('settup gpio pin', gpio.name);
    if(gpio.disabled) { return undefined; }

    // TODO direction / edge

    try {
      console.log('trying gpio pin ', gpio.gpio)
      const pin = new Gpio(gpio.gpio, 'in', 'both', { activeLow: gpio.activeLow });
      if(pin.direction() !== 'in') {
        pin.unexport(); // TODO this unexport may have fixed the problem of ownership, try again
        throw Error('Gpio pin ' + gpio.name + ' direction invalid');
      }

      return { name: gpio.name, client: pin };
    }
    catch(e) {
      throw Error('Gpio pin ' + gpio.name + ' failure: ' + e.message);
    }
  }

  // close any valid pins in array
  static _close(...gpios) {
    console.log('gpio group closing');
    gpios.forEach(gpio => {
      if(gpio === undefined) { return; } // make safe for sparce array
      try { gpio.unexport(); } catch(e) { console.log(e); } // TODO fully suppress or warn?
    });
  }
}

/**
 * Implementation used to interact with running group.
 **/
class GpioGroupImpl {
  constructor(...config) {
    console.log('gpio group created', config);
    this.gpios = config;
  }

  gpio(name) {
    return this.gpios.filter(gpio => gpio.name === name)
      .map(gpio => gpio.client)
      .find(() => true);
  }

  gpios(...names) {
    return this.gpios.filter(gpio => names.includes(gpio.name))
      .map(gpio => gpio.client);
  }

  close() {
    const pins = this.gpios.map(gpio => gpio.client);
    GpioUtil._close(...pins);
  }
}


/**
 * A all-or-none group of Gpio pins.
 * Note, disabled gpios get stripped. Some more like all-enabled-or-none is guess :)
 */
class GpioGroup {
  static from(...config) {
    // do we have basic access
    if(Gpio.accessible === false) { return Promise.reject(Error('Gpio not Accessible.')); }

    const gpios = [];
    try {
      config.forEach(gpio => gpios.push(GpioUtil._setup(gpio)));
    }
    catch(e) {
      console.log('gpio group setup failure');
      GpioUtil._close(...gpios.map(gpio => gpio.client));
      return Promise.reject(e);
    }

    const valids = gpios.filter(gpio => gpio !== undefined);
    // TODO allow for valids length of zero, but warn?
    return Promise.resolve(new GpioGroupImpl(...valids));
  }
}

module.exports = GpioGroup;

