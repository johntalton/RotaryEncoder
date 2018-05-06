"use strict";

const machineButton = {
  debug: false,
   state: 'init',
   states: {
    'init': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up', event: 'UP' } },
    'down': { 'down': { next: 'down' }, 'up': { next: 'up', event: 'UP' } },
    'up': { 'down': { next: 'down', event: 'DOWN' }, 'up': { next: 'up' } }
  }
};

const machineABEncoder = {
  debug: false,
  state: 'I',
  states: {
    'I': {
      'A0': { next: 'I' },
      'A1': { next: 'II' },
      'B0': { next: 'I' },
      'B1': { next: 'III' } },
     'II':  {
      'A0': { next: 'I', event: 'RCCW' },
      'A1': { next: 'II' },
      'B0': { next: 'II' },
      'B1': { next: 'IV' } },
    'III': {
      'A0': { next: 'III' },
      'A1': { next: 'V' },
      'B0': { next: 'I', event: 'RCW' },
      'B1': { next: 'III' } },
    'IV':  {
      'A0': { next: 'VI' },
      'A1': { next: 'IV' },
      'B0': { next: 'II' },
      'B1': { next: 'IV' } },
    'V':   {
      'A0': { next: 'III' },
      'A1': { next: 'V' },
      'B0': { next: 'VII' },
      'B1': { next: 'V' } },
    'VI':  {
      'A0': { next: 'VI' },
      'A1': { next: 'IV' },
      'B0': { next: 'I', event: 'CW' },
      'B1': { next: 'VI' } },
    'VII': {
      'A0': { next: 'I', event: 'CCW' },
      'A1': { next: 'VII' },
      'B0': { next: 'VII' },
      'B1': { next: 'V' } }
  }
};

class SyncState {
  static instance(machine, debug) {
    const d = (debug !== undefined) ? debug : machine.debug;
    return {
      debug: d,
      state: machine.state,
      states: machine.states
    };
  }

  static to(machine, state) {
    const transition = machine.states[machine.state][state];
    if(machine.debug) {
      console.log('\u001b[91mtransition', machine.state, state, transition, '\u001b[0m');
    }

    //if(machine.ons !== undefined && transition.event !== undefined) {
    //  const on = machine.ons[transition.event];
    //  if(on !== undefined) {
    //    try { on(); } catch(e) { console.log('machine callback error', e); }
    //  }
    //}

    machine.state = transition.next;
    return transition.event;
  }

  //static on(machine, event, callback) {
  //  if(machine.ons === undefined) { machine.ons = {}; }
  //  machine.ons[event] = callback;
  //}
}

SyncState.machineABEncoder = machineABEncoder;
SyncState.machineButton = machineButton

module.exports = SyncState;
