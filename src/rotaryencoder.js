"use strict";

const { EventEmitter } = require('events');

const onoff = require('onoff');
const Gpio = onoff.Gpio;

const State = require('./state.js');

class GpioGroup {
  static from(config) {
    // try gpio first, fast fail
    if(Gpio.accessible === false) { return Promise.reject(Error('Gpio not Accessible.')); }

    // as we are doing fullup/down here we have to work in steps
    const gpios = [];
    try {
      tmpA = RotaryEncoder._setupGpio(config.A);
      tmpB = RotaryEncoder._setupGpio(config.B);
      tmpButton = RotaryEncoder._setupGpio(config.button);
    }
    catch(e) {
      if(tmpA) { tmpA.unexport(); }
      if(tmpB) { tmpB.unexport(); }
      if(tmpButton) { tmpButton.unexport(); }

      return Promise.reject(e);
    }

    return Promise.resolve();
  }


  static _setupGpio(gpio) {
    //console.log('attempting to setup gpio for', gpio.name);
    if(gpio.disabled) { return; }

    try {
      const pin = new Gpio(gpio.gpio, 'in', 'both', { activeLow: gpio.activeLow });
      if(pin.direction() !== 'in') {
        pin.export();
        return Promise.reject(Error('Gpio pin ' + gpio.name + ' direction invalid'));
      }
      return pin;
    }
    catch(e) {
      throw Error('Gpio pin ' + gpio.name + ' failure: ' + e.message);
    }
  }


}

class RotaryEncoder extends EventEmitter{
  static setup(config) {
    //console.log('RC setup', config);

    const group = GpioGroup.from();

    return Promise.resolve(new RotaryEncoder(tmpA, tmpB, tmpButton, config));
  }

  constructor(gpioGroup, config) {
    super();

    this.gpioGroup = gpioGroup;

    // instance of machines
    this.abMachine = State.instance(State.machineABEncoder, config.debug);
    this.bMachine = State.instance(State.machineButton, config.debug);
  }

  start() {
    // setup watches
    if(this.A !== undefined) { this.A.watch(RotaryEncoder._makeHandler(this.abMachine, value => ('A' + value))); }
    if(this.B !== undefined) { this.B.watch(RotaryEncoder._makeHandler(this.abMachine, value => ('B' + value))); }
    if(this.button !== undefined) { this.button.watch(RotaryEncoder._makeHandler(this.bMachine, value => (value === 1 ? 'down' : 'up'))); }
  }

  static _makeHandler(machine, eventnameFn) {
    return (err, value) => {
      if(err) { console.log('watch error (suppress)', err); return; }
      const outEvent = State.to(machine, eventnameFn(value));
      if(outEvent !== undefined) {
        emit('')
      }
    }
  }

  proble() {
    return Promise.resolve();
  }

  close() {
    if(this.A) { try { this.A.unexport(); } catch(e) { console.log(e);} }
    if(this.B) { try { this.B.unexport(); } catch(e) { console.log(e); } }
    if(this.button) { try { this.button.unexport(); } catch(e) { console.log(e); } }
  }
}

module.exports = RotaryEncoder;

