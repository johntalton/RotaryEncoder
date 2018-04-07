"use strict";

const onoff = require('onoff');
const Gpio = onoff.Gpio;

const State = require('./state.js');

class RotaryEncoder {
  static make(config) {
    const client = {
      abMachine: State.instance(State.machineABEncoder),
      value: 0,
      A: new Gpio(config.A.gpio, 'in', 'both', { activeLow: config.A.activeLow }),
      B: new Gpio(config.B.gpio, 'in', 'both', { activeLow: config.B.activeLow }),
      button: (config.button !== undefined) ? new Gpio(config.button, 'in', 'both') : undefined,
      bMachine: {
        debug: false,
        state: 'init',
        states: {
          'init': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up', event: 'UP' } },
          'down': { 'down': { next: 'down' }, 'up': { next: 'up', event: 'UP' } },
          'up': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up' } }
        }
      }
    };

    client.abMachine.debug = true;

    function curry_watch(eventprefix) {
      return function(err, value) {
        if(err) { console.log(e); process.exit(-1); }
        State.to(client.abMachine, eventprefix + value);
      };
    }

    client.A.watch(curry_watch('A'));
    client.B.watch(curry_watch('B'));

    if(client.button) {
      client.button.watch((err, value) => {
        if(err) { console.log(e); process.exit(-1); }
        State.to(client.bMachine, value === 1 ? 'down' : 'up');
      });
    }

    function reaper(gpio) {
      return function reaper(err, value) {
        if(err) {
          console.log(config.name + ' ' + gpio.gpio, err);
          clearInterval(client.reaper);

          client.A.unexport();
          client.B.unexport();
          if(client.button) {
            client.button.unexport();
          }
        }
      };
    }

    client.reaper = setInterval(() => {

      // console.log('reaper poll', config.name);
      if(client === undefined) {
        console.log('polling while down');
        return;
      }

      client.A.read(reaper(client.A));
      client.B.read(reaper(client.B));
      if(client.button) {
        client.button.read(reaper(client.button));
      }
    }, config.pollTimeMs);

    return client;
  }

  static buttonUp(client, callback) { State.on(client.bMachine, 'UP', callback); }
  static buttonDown(client, callback) { State.on(client.bMachine, 'DOWN', callback); }
  static cw(client, callback) { State.on(client.abMachine, 'CW', callback); }
  static ccw(client, callback) { State.on(client.abMachine, 'CCW', callback); }
  static rcw(client, callback) { State.on(client.abMachine, 'RCW', callback); }
  static rccw(client, callback) { State.on(client.abMachine, 'RCCW', callback); }

}

module.exports = RotaryEncoder;

