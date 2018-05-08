
const { EventEmitter } = require('events');

const State = require('./state.js');
const GpioGroup = require('./gpiogroup.js');

// const GPIO_ZERO = 0;
const GPIO_ONE = 1;

/**
 * RotaryEncoder Event Emiter
 */
class RotaryEncoder extends EventEmitter {
  static setup(config) {
    return GpioGroup.from(config.A, config.B, config.button)
      .then(group => new RotaryEncoder(group, config));
  }

  constructor(gpioGroup, config) {
    super();

    this.name = config.name;

    // A / B and button
    this.group = gpioGroup;

    // instance of machines
    this.abMachine = State.instance(State.machineABEncoder, config.debug);
    this.bMachine = State.instance(State.machineButton, config.debug);
  }

  start() {
    console.log('Starting Encoder Watches', this.group);
    const self = this;

    function makeABHandler(aorb) {
      return (err, value) => {
        if(err) { console.log('watch error (ignore)', err); return; }
        const outEvent = State.to(self.abMachine, aorb + value);
        if(outEvent !== undefined) { self.emit(outEvent); }
      }
    }

    function handleButton(err, value) {
      if(err) { console.log('button watch err (ignore)', err); return; }
      const dir = value === GPIO_ONE ? 'down' : 'up';
      const outEvent = State.to(self.abMachine, dir);
      if(outEvent !== undefined) { self.emit(outEvent); }
    }

    // setup watches
    const A = this.group.gpio('A');
    const B = this.group.gpio('B');
    const button = this.group.gpio('button');

    console.log(A);

    if(A !== undefined) { A.watch(makeABHandler('A')); }
    if(B !== undefined) { B.watch(makeABHandler('B')); }
    if(button !== undefined) { button.watch(handleButton); }
  }

  stop() {
    // note don't close as that would teardown the group
    // TODO unwatch all in group

    const [A, B, button] = this.group.gpio('A', 'B', 'button');

    A.unwatchAll(); // TODO unwatch ALL is agressive? track callback
    B.unwatchAll();
    button.unwatchAll();
  }

  probe() {
    function pinState(pin) {
      if(pin === undefined) { return Promise.resolve(); }

      return new Promise((resolve, reject) => {
        pin.read((err, value) => {
          if(err) { reject(err); return; }
          resolve(value);
        });
      });
    }

    const pins = this.group.gpio('A', 'B', 'button');

    return Promise.all(pins.map(pinState))
      .then((a, b, but) => {
        return {
          A: a, B: b, button: but,
          state: [this.abMachine.state, this.bMachine.state]
        };
      });
  }

  close() {
    this.group.close();
  }
}

module.exports = RotaryEncoder;

