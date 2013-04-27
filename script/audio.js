window.jzt = window.jzt || {};

jzt.Audio = function() {

	this.setActive(true);

	if(this.active) {

		if (typeof AudioContext !== 'undefined') {
	    	this.context = new AudioContext();
		}
		else if (typeof webkitAudioContext !== 'undefined') {
	    	this.context = new webkitAudioContext();
		}

		this.userVolume = 0.08;
		this.volume = this.context.createGainNode();
		this.volume.gain.value = this.userVolume;
		this.volume.connect(this.context.destination);
		this.timestamp = this.context.currentTime;
		this.interruptTimestamp = this.context.currentTime;
	}

};

jzt.Audio.prototype.setActive = function(activeValue) {

	this.active = (activeValue && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'));

};

jzt.Audio.prototype.cancel = function() {

	if(this.active && this.oscillator) {
		this.oscillator.frequency.cancelScheduledValues(0);
		this.volume.gain.cancelScheduledValues(0);
		this.volume.gain.value = this.userVolume;
		this.oscillator.stop(0);
		this.timestamp = this.context.currentTime;
		this.interruptTimestamp = this.context.currentTime;
	}

}

jzt.Audio.prototype.isPlaying = function() {
	return this.active && this.context.currentTime < this.timestamp;
};

jzt.Audio.prototype.playAfter = function(notation, uninterruptable) {

	if(this.active) {

		var song = new jzt.Audio.Song(notation);

		// Create an oscillator for this play session
		this.oscillator = this.context.createOscillator();
		this.oscillator.type = this.oscillator.SQUARE;
		this.oscillator.connect(this.volume);

		// Polyfill for oscillator start and stop
		if(!this.oscillator.start) {
			this.oscillator.start = this.oscillator.noteOn;
		}
		if(!this.oscillator.stop) {
			this.oscillator.stop = this.oscillator.noteOff;
		}

		if(this.timestamp < this.context.currentTime) {
			this.timestamp = this.context.currentTime;
		}

		var startTime = this.timestamp;

		// Set our oscillator frequency at our scheduled note times
		for(var index = 0; index < song.notes.length; ++index) {

			var note = song.notes[index];

			// If there's a start and end frequency
			if(note.frequency && note.endFrequency) {
				this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);
				this.oscillator.frequency.linearRampToValueAtTime(note.endFrequency, this.timestamp + note.duration);
			}

			// If there's just a start frequency
			else if(note.frequency) {
				this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);
			}

			// If there's no frequency at all
			else {
				this.volume.gain.setValueAtTime(0, this.timestamp);
				this.volume.gain.setValueAtTime(0.08, this.timestamp + note.duration);
			}

			// Update our timestamp
			this.timestamp += note.duration;

    	}

    	// Start our oscillator now, and stop after all notes are done
    	this.oscillator.start(startTime);
    	this.oscillator.stop(this.timestamp);

    	// If we're not to be interrupted, upadte the timestamp
    	if(uninterruptable) {
    		this.interruptTimestamp = this.timestamp;
    	}

	}

};

jzt.Audio.prototype.play = function(notation, uninterruptable) {
	if(this.active && this.context.currentTime >= this.interruptTimestamp) {
		this.cancel();
		this.playAfter(notation, uninterruptable);
	}
};

jzt.Audio.Note = function(index, duration) {
	this.noteIndex = index;
	this.frequency = jzt.Audio.Note.frequencyTable[this.noteIndex];
	this.duration = duration;
};

jzt.Audio.Note.prototype.adjustNote = function(adjustmentValue) {
	if(this.noteIndex !== undefined) {
		this.noteIndex += adjustmentValue;
		if(this.noteIndex >= jzt.Audio.Note.frequencyTable.length-1) {
			this.noteIndex = jzt.Audio.Note.frequencyTable.length-1;
		}
		else if(this.noteIndex < 0) {
			this.noteIndex = 0;
		}
		this.frequency = jzt.Audio.Note.frequencyTable[this.noteIndex];
	}
};

jzt.Audio.Note.prototype.shiftUp = function() {
	this.adjustNote(1);
};

jzt.Audio.Note.prototype.shiftDown = function() {
	this.adjustNote(-1);
};

jzt.Audio.Note.prototype.octaveUp = function(octaveCount) {
	this.adjustNote(12*octaveCount);
};

jzt.Audio.Note.prototype.octaveDown = function(octaveCount) {
	this.adjustNote(-12*octaveCount);
};

jzt.Audio.Note.prototype.bendTo = function(newIndex) {
	this.endFrequency = jzt.Audio.Note.frequencyTable[newIndex];
};

jzt.Audio.Note.frequencyTable = [
//  0      1      2      3      4      5      6      7      8      9      10     11
	16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87, // 0
	32.70, 34.65, 36.71, 38.89, 41.20, 43.65, 46.25, 49.00, 51.91, 55.00, 58.27, 61.74, // 12
	65.41, 69.30, 73.42, 77.78, 82.41, 87.31, 92.50, 98.00, 103.8, 110.0, 116.5, 123.5, // 24
	130.8, 138.6, 146.8, 155.6, 164.8, 174.6, 185.0, 196.0, 207.7, 220.0, 233.1, 246.9, // 36
	261.6, 277.2, 293.7, 311.1, 329.6, 349.2, 370.0, 392.0, 415.3, 440.0, 466.2, 493.9, // 48
	523.3, 554.4, 587.3, 622.3, 659.3, 698.5, 740.0, 784.0, 830.6, 880.0, 932.3, 987.8, // 60
	1047,  1109,  1175,  1245,  1319,  1397,  1480,  1568,  1661,  1760,  1865,  1976,  // 72
	2093,  2217,  2349,  2489,  2637,  2794,  2960,  3136,  3322,  3520,  3729,  3951,  // 84
	4186,  4435,  4699,  4978,  5274,  5588,  5920,  6272,  6645,  7040,  7459,  7902   // 96
];

jzt.Audio.Song = function(notation) {
	this.MAX_OCTAVE = 8;
	this.barLength = 1.8;
	this.notes = [];
	this.parse(notation);
};

jzt.Audio.Song.percussiveSound = {
	'Cowbell': [103,103,105,80,103,103,105,80,103,103,105,80,103,103,105,80],
	'HighSnare': [12,71,87,83,94,12,92,89,85,99,12,92,68,79,103],
	'HighWoodblock': [80, 79, 80, 68, 80, 79, 80, 70, 80, 83, 78, 80, 81, 80],
	'LowSnare': [12,97,93,76,88,81,12,97,93,76,88,81,12,97,93,76,88,81],
	'LowWoodblock': [12,74,74,73,73,12,74,74,75,75,12,74,74,75,75,76,76],
	'BassDrum': [54,52,50,5,12,30,58,56,54,5,12,30,62,60,58,5,12]
};
/*
*/
jzt.Audio.Song.prototype.addPercussiveSound = function(noteArray, currentDuration) {

	var remainingDuration = currentDuration;

	for(var index in noteArray) {
		if(noteArray.hasOwnProperty(index)) {
			this.notes.push(new jzt.Audio.Note(noteArray[index], 0.001));
			remainingDuration -= 0.001;
		};
	}

	this.addRest(remainingDuration);

};

jzt.Audio.Song.prototype.addRest = function(duration) {
	this.notes.push(new jzt.Audio.Note(undefined, duration));
};

jzt.Audio.Song.prototype.parse = function(notation) {

	var currentOctave = 4;
	var currentDuration = this.barLength / 32;
	var tripletDuration = currentDuration / 3;
	var tripletCount = -1;
	var timeAndHalf = false;

	notation = notation.toUpperCase();

	for(var index = 0; index < notation.length; ++index) {

		var currentNote = undefined;
		var currentChar = notation.charAt(index);

		// If we've got a musical note...
		
		switch(currentChar) {
			case 'T':
				currentDuration = this.barLength / 32;
				break;
			case 'S':
				currentDuration = this.barLength / 16;
				break;
			case 'I':
				currentDuration = this.barLength / 8;
				break;
			case 'Q':
				currentDuration = this.barLength / 4;
				break;
			case 'H':
				currentDuration = this.barLength / 2;
				break;
			case 'W':
				currentDuration = this.barLength;
				break;
			case '3':
				tripletCount = 3;
				tripletDuration = currentDuration / 3;
				break;
			case '+':
				currentOctave++;
				break;
			case '-':
				currentOctave--;
				break;
			case '.':
				timeAndHalf = true;
				break;
			case 'X':
				currentNote = new jzt.Audio.Note();
				break;
			case 'C':
				currentNote = new jzt.Audio.Note(0);
				break;
			case 'D':
				currentNote = new jzt.Audio.Note(2);
				break;
			case 'E':
				currentNote = new jzt.Audio.Note(4);
				break;
			case 'F':
				currentNote = new jzt.Audio.Note(5);
				break;
			case 'G':
				currentNote = new jzt.Audio.Note(7);
				break;
			case 'A':
				currentNote = new jzt.Audio.Note(9);
				break;
			case 'B':
				currentNote = new jzt.Audio.Note(11);
				break;
			case '0':
				var percussiveNote = new jzt.Audio.Note(0, 0.005);
				percussiveNote.bendTo(56);
				this.notes.push(percussiveNote);
				this.addRest(currentDuration - 0.005);
				break;
			case '1':
				var percussiveNote = new jzt.Audio.Note(72, 0.015);
				percussiveNote.bendTo(87);
				this.notes.push(percussiveNote);
				this.addRest(currentDuration - 0.015);
				break;
			case '2':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.Cowbell, currentDuration);
				break;
			case '4':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.HighSnare, currentDuration);
				break;
			case '5':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.HighWoodblock, currentDuration);
				break;
			case '6':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.LowSnare, currentDuration);
				break;
			case '7':
				var percussiveNote = new jzt.Audio.Note(65, 0.015);
				percussiveNote.bendTo(60);
				this.notes.push(percussiveNote);
				this.addRest(currentDuration - 0.015);
				break;
			case '8':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.LowWoodblock, currentDuration);
				break;
			case '9':
				this.addPercussiveSound(jzt.Audio.Song.percussiveSound.BassDrum, currentDuration);
				break;
			default:
				currentNote = undefined;

		}

		// If we got a note to play...
		if(currentNote) {

			var nextChar = index >= notation.length ? undefined : notation.charAt(index+1);
			var activeDuration = currentDuration;

			if(nextChar === '#') {
				currentNote.shiftUp();
				index++;
			}
			else if(nextChar === '!') {
				currentNote.shiftDown();
				index++;
			}

			// If we're in a triplet, set our duration to 1/3 normal
			if(tripletCount > 0) {
				tripletCount--;
				activeDuration = tripletDuration;
			}

			// If we're in time and a half, increase our duration by 50%
			if(timeAndHalf) {
				timeAndHalf = false;
				activeDuration = currentDuration + (currentDuration / 2);
			}

			// Adjust our octave
			currentNote.octaveUp(currentOctave);

			// Adjust our duration
			currentNote.duration = activeDuration;

			// Add our note
			this.notes.push(currentNote);

		}
	}

};