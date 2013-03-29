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
	this.timestamp = 0;

};

jzt.Audio.prototype.add = function(song) {
	for(var index = 0; index < song.notes.length; ++index) {
		var note = song.notes[index];
		this.noteQueue.push(note);
	}
}

jzt.Audio.prototype.playNotation = function(notation) {
	this.add(new jzt.Audio.Song(notation));
	this.play();
};

jzt.Audio.prototype.play = function() {

	if(!this.unsupported) {

		// Cancel previous values, if any
		if(this.oscillator) {
			this.oscillator.frequency.cancelScheduledValues(0);
			this.volume.gain.cancelScheduledValues(0);
			this.oscillator.stop(0);
		}

		// Create an oscillator for this play session
		this.oscillator = this.context.createOscillator();
		this.oscillator.type = this.oscillator.SQUARE;
		this.oscillator.connect(this.volume);
		this.timestamp = this.context.currentTime;

		// Set our oscillator frequency at our scheduled note times
		var note = this.noteQueue.shift();
		while(note) {

			if(note.frequency && note.endFrequency) {
				this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);
				this.oscillator.frequency.linearRampToValueAtTime(note.endFrequency, this.timestamp + note.duration);
			}

			else if(note.frequency) {
				this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);
			}

			// If there's no frequency, treat it as a 'rest'
			else {
				this.volume.gain.setValueAtTime(0, this.timestamp);
				this.volume.gain.setValueAtTime(0.08, this.timestamp + note.duration);
			}

			// Update our timestamp
			this.timestamp += note.duration;
			
			// Grab our next note
	    	note = this.noteQueue.shift();

    	}

    	// Start our oscillator now, and stop after all notes are done
    	this.oscillator.start(this.context.currentTime);
    	this.oscillator.stop(this.timestamp);

	}
};

jzt.Audio.Percussion = function(startFrequency, endFrequency, duration) {
	this.frequency = startFrequency;
	this.endFrequency = endFrequency;
	this.duration = duration;
};

jzt.Audio.Percussion.Tick = new jzt.Audio.Percussion(1, 3135, 0.005); // Good
jzt.Audio.Percussion.Tweet = new jzt.Audio.Percussion(1046, 2500, 0.01); // Good
jzt.Audio.Percussion.Cowbell = new jzt.Audio.Percussion(1, 6000, 0.01);
jzt.Audio.Percussion.HighSnare = new jzt.Audio.Percussion(4000,1, 0.01);
jzt.Audio.Percussion.HighWoodblock = new jzt.Audio.Percussion(2000, 1, 0.01);
jzt.Audio.Percussion.LowSnare = new jzt.Audio.Percussion(3000, 1, 0.01);
jzt.Audio.Percussion.LowTom = new jzt.Audio.Percussion(700, 523, 0.01); // Good
jzt.Audio.Percussion.LowWoodblock = new jzt.Audio.Percussion(1046, 1396, 0.01);
jzt.Audio.Percussion.BassDrum = new jzt.Audio.Percussion(1, 600, 0.01);

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
	this.MAX_OCTAVE = 9;
	this.barLength = 1.8;
	this.notes = [];
	this.parse(notation);
};

jzt.Audio.Song.prototype.parse = function(notation) {

	function octaveUp(octave) {
		if(++octave > this.MAX_OCTAVE) {
			return this.MAX_OCTAVE;
		}
		return octave;
	}

	function octaveDown(octave) {
		if(--octave < 0) {
			return 0;
		}
		return octave;
	}

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
				currentOctave = octaveUp(currentOctave);
				break;
			case '-':
				currentOctave = octaveDown(currentOctave);
				break;
			case '.':
				timeAndHalf = true;
				break;
			case 'X':
			case 'C':
			case 'D':
			case 'E':
			case 'F':
			case 'G':
			case 'A':
			case 'B':
				currentNote = currentChar;
				break;
			case '0':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.Tick);
				break;
			case '1':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.Tweet);
				break;
			case '2':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.Cowbell);
				break;
			case '4':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.HighSnare);
				break;
			case '5':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.HighWoodblock);
				break;
			case '6':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.LowSnare);
				break;
			case '7':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.LowTom);
				break;
			case '8':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.LowWoodblock);
				break;
			case '9':
				currentNote = 'X';
				this.notes.push(jzt.Audio.Percussion.BassDrum);
				break;
			default:
				currentNote = undefined;

		}

		// If we got a note to play...
		if(currentNote) {

			var nextChar = index >= notation.length ? undefined : notation.charAt(index+1);
			var activeDuration = currentDuration;

			// If our note is melodic...
			if(currentNote !== 'X') {
			
				// Adjust our note for sharps
				if(nextChar === '#') {
					currentNote = currentNote === 'B' ? 'C' + octaveUp(currentOctave) : currentNote + '#' + currentOctave;
					index++;
				}

				// Adjust our note for flats
				else if(nextChar === '!') {
					currentNote = currentNote === 'C' ? 'B' + octaveDown(currentOctave) : currentNote + '!' + currentOctave;
					index++;
				}

				// Take our note as-is
				else {
					currentNote += currentOctave;
				}

			}

			// Otherwise, if we got a rest...
			else {
				currentNote = undefined;
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

			// Add our note
			this.notes.push(new jzt.Audio.Note(currentNote, activeDuration));

		}
	}

};