window.jzt = window.jzt || {};

jzt.Audio = function() {

	if (typeof AudioContext !== "undefined") {
    	this.context = new AudioContext();
	}
	else if (typeof webkitAudioContext !== "undefined") {
    	this.context = new webkitAudioContext();
	}
	else {
    	this.unsupported = true;
	}

	this.noteQueue = [];
	this.volume = this.context.createGainNode();
	this.volume.gain.value = 0.08;
	this.volume.connect(this.context.destination);

	//this.oscillator = this.context.createOscillator();
	//this.oscillator.type = 1; // Square wave
	

};

jzt.Audio.prototype.add = function(song) {
	for(var index = 0; index < song.notes.length; ++index) {
		var note = song.notes[index];
		this.noteQueue.push(note);
	}
}

jzt.Audio.prototype.play = function() {

	var timestamp = 0;

	if(!this.unsupported) {

		var me = this;
		var note = this.noteQueue.shift();
		while(note) {

			if(note.frequency) {
				var oscillator = this.context.createOscillator();
				oscillator.type = 1;
				oscillator.frequency.value = note.frequency;
				oscillator.connect(this.volume);
				oscillator.start(timestamp);
				timestamp += note.duration;
				oscillator.stop(timestamp);
	    	}
	    	else {
	    		timestamp += note.duration;
	    	}

	    	note = this.noteQueue.shift();

    	}

	}
};

jzt.Audio.Note = function(note, duration) {

	if(note) {
		var octave = parseInt(note.charAt(note.length-1));
		if(!isNaN(octave)) {
			note = note.slice(0, note.length-1);
		}
		else {
			octave = 4;
		}

		this.frequency = jzt.Audio.Note.frequencyTable[note][octave];
	}

	this.duration = duration;

};

jzt.Audio.Note.frequencyTable = {
	'C':  [16.351, 32.703, 65.406, 130.812, 261.625, 523.251, 1046.502, 2093.004, 4186.008, 8372.016],
	'C#': [17.323, 34.647, 69.295, 138.591, 277.182, 554.365, 1108.730, 2217.460, 4434.920, 8869.840],
	'D':  [18.354, 36.708, 73.416, 146.832, 293.664, 587.329, 1174.059, 2344.318, 4698.636, 9397.272],
	'D#': [19.445, 38.890, 77.781, 155.563, 311.126, 622.253, 1244.507, 2489.014, 4978.028, 9956.056],
	'E':  [20.601, 41.203, 82.406, 164.813, 329.627, 659.255, 1318.510, 2637.020, 5274.040, 10548.080],
	'F':  [21.826, 43.653, 87.307, 174.614, 349.228, 698.456, 1396.912, 2793.824, 5587.648, 11175.26],
	'F#': [23.124, 46.249, 92.498, 184.997, 369.994, 739.988, 1479.976, 2959.952, 5919.904, 11839.808],
	'G':  [24.449, 48.999, 97.998, 195.997, 391.995, 783.991, 1567.982, 3135.964, 6270.928, 12541.856],
	'G#': [25.956, 25.956, 103.826, 207.652, 415.304, 830.609, 1661.218, 3322.436, 6644.872, 13289.744],
	'A':  [27.500, 55.000, 110.000, 220.000, 440.000, 880.000, 1760.000, 3520.000, 7040.000, 14080.000],
	'A#': [29.135, 58.270, 116.540, 233.081, 466.163, 932.327, 1964.654, 3729.308, 7458.616, 14917.232],
	'B':  [30.867, 61.735, 123.470, 246.941, 493.883, 987.766, 1975.532, 3951.064, 7902.128, 15804.256],
};
jzt.Audio.Note.frequencyTable['E#'] = jzt.Audio.Note.frequencyTable['F'];
jzt.Audio.Note.frequencyTable['D!'] = jzt.Audio.Note.frequencyTable['C#'];
jzt.Audio.Note.frequencyTable['E!'] = jzt.Audio.Note.frequencyTable['D#'];
jzt.Audio.Note.frequencyTable['F!'] = jzt.Audio.Note.frequencyTable['E'];
jzt.Audio.Note.frequencyTable['G!'] = jzt.Audio.Note.frequencyTable['F#'];
jzt.Audio.Note.frequencyTable['A!'] = jzt.Audio.Note.frequencyTable['G#'];
jzt.Audio.Note.frequencyTable['B!'] = jzt.Audio.Note.frequencyTable['A#'];

jzt.Audio.Song = function(notation) {
	this.barLength = 1.8;
	this.notes = [];
	this.parse(notation);
};

jzt.Audio.Song.prototype.parse = function(notation) {

	var currentOctave = 4;
	var currentNote = undefined;
	var oldDuration = this.barLength / 4;
	var currentDuration = this.barLength / 4;
	var tripletCount = -1;
	var timeAndHalf = false;

	notation = notation.toUpperCase();

	for(var index = 0; index < notation.length; ++index) {

		if(tripletCount === 0) {
			tripletCount = -1;
			currentDuration = oldDuration;
		}
		else if(tripletCount > 0) {
			tripletCount--;
		}

		var currentChar = notation.charAt(index);
		var nextChar = index >= notation.length ? undefined : notation.charAt(index+1);

		// If we've got a musical note...
		
		if(currentChar === 'T') {
			currentDuration = this.barLength / 32;
		}
		else if(currentChar === 'S') {
			currentDuration = this.barLength / 16;
		}
		else if(currentChar === 'I') {
			currentDuration = this.barLength / 8;
		}
		else if(currentChar === 'Q') {
			currentDuration = this.barLength / 4;
		}
		else if(currentChar === 'H') {
			currentDuration = this.barLength / 2;
		}
		else if(currentChar === 'W') {
			currentDuration = this.barLength;
		}
		else if(currentChar === '3') {
			tripletCount = 3;
			oldDuration = currentDuration;
			currentDuration = currentDuration / 3;
		}
		else if(currentChar === '+') {
			currentOctave++;
			if(currentOctave > 9) {
				currentOctave = 9;
			}
		}
		else if(currentChar === '-') {
			currentOctave--;
			if(currentOctave < 0) {
				currentOctave = 0;
			}
		}
		else if(currentChar === 'C' || currentChar === 'D' || currentChar === 'E' || currentChar === 'F' || 
			currentChar === 'G' || currentChar === 'A' || currentChar === 'B') {

			if(nextChar === '#') {
				if(currentChar === 'B') {
					currentNote = 'C' + (currentOctave >= 9 ? 9 : currentOctave + 1);
				}
				else {
					currentNote = currentChar + nextChar + currentOctave;
				}
				index++;
			}
			else if(nextChar === '!') {
				if(currentChar === 'C') {
					currentNote = 'B' + (currentOctave <= 0 ? 0 : currentOctave - 1);
				}
				else {
					currentNote = currentChar + nextChar + currentOctave;
				}
				index++;
			}
			else {
				currentNote = currentChar + currentOctave;
			}

			if(currentNote) {
				this.notes.push(new jzt.Audio.Note(currentNote, currentDuration));
			}

		}

	}

};