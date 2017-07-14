
var GS = require('gpio-stream');
var Transform = require('stream').Transform;

var knobA = GS.readable(5);
var knobB = GS.readable(6);
var knobC = GS.readable(12);

var states = {
	'I':   { 'A0': 'I', 'A1': 'II', 'B0': 'I', 'B1': 'III' },
	'II':  { 'A0': 'I', 'A1': 'II', 'B0': 'II', 'B1': 'IV' },
	'III': { 'A0': 'III', 'A1': 'V', 'B0': 'I', 'B1': 'III' },
	'IV':  { 'A0': 'VI', 'A1': 'IV', 'B0': 'II', 'B1': 'IV' },
	'V':   { 'A0': 'III', 'A1': 'V', 'B0': 'VII', 'B1': 'V' },
	'VI':  { 'A0': 'VI', 'A1': 'IV', 'B0': 'I', 'B1': 'VI' },
	'VII': { 'A0': 'I', 'A1': 'VII', 'B0': 'VII', 'B1': 'V' }
}

class State {
	constructor(states){ this.states = states; this.currentState = 'I'; this.value = 0; }
	transition(edge){
		var prev = this.currentState;

		var posibles = this.states[this.currentState];
		//console.log(posibles[edge.trim()]);
		this.currentState = posibles[edge.trim()];

		var cur = this.currentState;
		//console.log(prev +  ' -> ' + cur);

		if(prev === 'VI' && cur === 'I') { this.value += 1; console.log('CW  ' + this.value); }
		if(prev === 'VII' && cur === 'I') { this.value -= 1; console.log('CCW ' + this.value); }
		if(prev === 'II' && cur === 'I') { this.value -= 1; console.log('R CWW ' + this.value); }
		if(prev === 'III' && cur === 'I') { this.value += 1; console.log('R CW ' + this.value); }

	}

}

class StateApplyer extends Transform {
	constructor(statename, state) { super(); this.statename = statename; this.state = state; }
	_transform(chunk, encoding, callback) {
		//console.log(this.opt +  chunk);
		this.state.transition(this.statname + chunk);
		callback(null, chunk);
	}
}

class ButtonTracker extends Transform {
	_transform(chunk, encoding, callback) {
		if(chunk[0] === '1'.charCodeAt(0)) { if(!this.down) { this.down = true; console.log('down'); } }
		else if(chunk[0] === '0'.charCodeAt(0)) { if(this.down) { this.down = false; console.log('up'); } }
		callback(null, chunk);
	}
}

var state = new State(states);

knobA.pipe(new StateApplyer('A', state));
knobB.pipe(new StateApplyer('B', state));

knobC.pipe(new ButtonTracker());
