/**
 * JZT Audio
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ConstructorError = require('./basic').ConstructorError,

/**
 * A static frequency table that maps indicies from 0 to 107 to notes on a traditional
 * scale, starting with 0 at C-0 to 107 at B-8.
 */
    frequencyTable = [
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
    ],

/**
 * Some of our percussive instruments can be represented as a crude assemblage of notes
 * played very rapidly.
 */
    percussiveSounds = {
        tick: [],
        tweet: [],
        cowbell: [],
        snare: [],
        woodblock: [],
        lowSnare: [],
        tom: [],
        lowWoodblock: [],
        bass: []
    },
    SONG_BAR_LENGTH = 1.8;

/**
 * Initializes our percussive instruments.
 */
function initalizePercussiveSounds() {

    var index;

    // Tick
    percussiveSounds.tick.push(3200);

    // Tweet
    for (index = 0; index < 14; ++index) {
        percussiveSounds.tweet.push(index * 100 + 1000); 
    }

    // Cowbell
    for (index = 0; index < 16; ++index) {
        percussiveSounds.cowbell.push((index % 2) * 1600 + 1600 + (index % 4) + 1600);
    }

    // Snare
    for (index = 0; index < 14; ++index) {
        percussiveSounds.snare.push(Math.random() * 1600 + 800);
    }

    // Woodblock
    for (index = 0; index < 8; ++index) {
        percussiveSounds.woodblock.push(1600);
        percussiveSounds.woodblock.push(Math.random() * 1600 + 800);
    }

    // Low Snare
    for (index = 0; index < 14; ++index) {
        percussiveSounds.lowSnare.push(((index % 2) * 880) + 880 + ((index % 3) * 440));
    }

    // Tom
    for (index = 0; index < 14; ++index) {
        percussiveSounds.tom.push(700 - (index * 12));
    }

    // Low Woodblock
    for (index = 0; index < 14; ++index) {
        percussiveSounds.lowWoodblock.push((index * 20 + 1200) - Math.random() * index * 40);
    }

    // Bass
    for (index = 0; index < 14; ++index) {
        percussiveSounds.bass.push(Math.random() * 440 + 220);
    }

}

/**
 * Note represents a single melodic note, taking a numeric index from 0 to 107, with 0 representing C-0
 * and 107 representing B-8, incrementing along all traditional notes on a piano. A duration in seconds must
 * also be provided.
 *
 * @param A note index.
 * @param A note duration in seconds.
 */
function AudioNote(index, duration) {

    if (!(this instanceof AudioNote)) {
        throw ConstructorError;
    }

    this.noteIndex = index;
    this.frequency = frequencyTable[this.noteIndex];
    this.duration = duration;
}

/**
 * Adjusts this Note instance by a specified value on our linear frequency scale. Increasing this Note's
 * value will move it up the scale, while decreasing it will move it down.
 *
 * @param adjustmentValue An integer value to modify this note's index on the linear frequency scale.
 */
AudioNote.prototype.adjustNote = function (adjustmentValue) {

    // If we have a note index to adjust...
    if (this.noteIndex !== undefined) {

        // Adjust the value
        this.noteIndex += adjustmentValue;

        // Check our scale position...
        if (this.noteIndex >= frequencyTable.length - 1) {

            // We've moved past the end of our scale, so
            // cap to the last note
            this.noteIndex = frequencyTable.length - 1;

        } else if (this.noteIndex < 0) {

            // We've moved before the start of our scale, so
            // base it to the first note
            this.noteIndex = 0;

        }

        // Assign our actual frequency value
        this.frequency = frequencyTable[this.noteIndex];

    }
};

/**
 * Shifts this Note up by one note on a traditional scale.
 */
AudioNote.prototype.shiftUp = function () {
    this.adjustNote(1);
};

/**
 * Shifts this Note down by one note on a traditional scale.
 */
AudioNote.prototype.shiftDown = function () {
    this.adjustNote(-1);
};

/**
 * Shifts this Note up by a provided number of octaves on a traditional scale.
 *
 * @param octaveCount A number of octaves to shift this Note up.
 */
AudioNote.prototype.octaveUp = function (octaveCount) {
    this.adjustNote(12 * octaveCount);
};

/**
 * Shifts this Note down by a provided number of ocaves on a traditional scale.
 *
 * @param octaveCount A number of octaves to shift this Note down.
 */
AudioNote.prototype.octaveDown = function (octaveCount) {
    this.adjustNote(-12 * octaveCount);
};

/**
 * 'Bends' this note to have a different ending frequency than its starting
 * frequency over the course of its duration.
 *
 * @param newIndex A different ending frequency for this Note.
 */
AudioNote.prototype.bendTo = function (newIndex) {
    this.endFrequency = frequencyTable[newIndex];
};

/**
 * Song represents a sequence of Note instances chained one after another to create a
 * melody or sound effect. Percussive sounds and rest periods may also be added.
 *
 * @param notation A textual notation representing a melody or sound effect.
 */
function AudioSong(notation) {

    if (!(this instanceof AudioSong)) {
        throw ConstructorError;
    }

    this.notes = [];
    this.parse(notation);
}

/**
 * Adds a provided sequence of frequencies as a percussive sound effect to fit
 * within a provided duration.
 *
 * @param noteArray An array of note indicies to be played rapidly in succession
 * @param currentDuration A duration in which we expect the percussive sound to fit
 */
AudioSong.prototype.addPercussiveSound = function (noteArray, currentDuration) {

    var index,
        remainingDuration = currentDuration;

    for (index in noteArray) {
        if (noteArray.hasOwnProperty(index)) {
            this.notes.push({
                frequency: noteArray[index], 
                duration: 0.0015
            });
            remainingDuration -= 0.0015;
        }
    }

    if (remainingDuration > 0) {
        this.addRest(remainingDuration);
    }

};

/**
 * Adds a specified rest duration (in seconds) to this Song.
 *
 * @param duration A duration in seconds to rest.
 */
AudioSong.prototype.addRest = function (duration) {
    this.notes.push(new AudioNote(undefined, duration));
};

/**
 * Parses a provided textual melody notation, creating a melodic song or sound effect.
 *
 * Each character in the notation has the following purpose:
 * T: All notes that follow will be played as 1/32 notes
 * S: All notes that follow will be played as 1/16 notes
 * I: All notes that follow will be played as 1/8 notes
 * Q: All notes that follow will be played as 1/4 notes
 * H: All notes that follow will be played as 1/2 notes
 * W: All notes that follow will be played as whole notes
 * 3: The following 3 notes will be played as a triplet
 * +: Increases the current octave
 * -: Decreases the current octave
 * .: The following note will be played in time-and-a-half
 * X: Rest
 * C-B: Plays a note on the traditional melodic scale
 * #: The previous note is modified as a sharp note
 * !: The previous note is modified as a flat note
 * 0: Percussive tick
 * 1: Percussive tweet
 * 2: Percussive cowbell
 * 4: Percussive high snare
 * 5: Percussive high woodblock
 * 6: Percussive low snare
 * 7: Percussive low tom
 * 8: Percussive low woodblock
 * 9: Percussive base
 *
 * @param notation A textual music notation
 */
AudioSong.prototype.parse = function (notation) {

    var currentOctave = 4,
        currentDuration = SONG_BAR_LENGTH / 32,
        tripletDuration = currentDuration / 3,
        tripletCount = -1,
        timeAndHalf = false,
        currentNote,
        currentChar,
        nextChar,
        activeDuration,
        index;

    // Convert the notation to uppercase so that it's effectively case-insensitive
    notation = notation.toUpperCase();

    // For each character in our notation...
    for (index = 0; index < notation.length; index += 1) {

        currentNote = undefined;
        currentChar = notation.charAt(index);

        // If we've got a musical note...
        switch (currentChar) {
        case 'T':
            currentDuration = SONG_BAR_LENGTH / 32;
            break;
        case 'S':
            currentDuration = SONG_BAR_LENGTH / 16;
            break;
        case 'I':
            currentDuration = SONG_BAR_LENGTH / 8;
            break;
        case 'Q':
            currentDuration = SONG_BAR_LENGTH / 4;
            break;
        case 'H':
            currentDuration = SONG_BAR_LENGTH / 2;
            break;
        case 'W':
            currentDuration = SONG_BAR_LENGTH;
            break;
        case '3':
            tripletCount = 3;
            tripletDuration = currentDuration / 3;
            break;
        case '+':
            currentOctave += 1;
            break;
        case '-':
            currentOctave -= 1;
            break;
        case '.':
            timeAndHalf = true;
            break;
        case 'X':
            currentNote = new AudioNote();
            break;
        case 'C':
            currentNote = new AudioNote(0);
            break;
        case 'D':
            currentNote = new AudioNote(2);
            break;
        case 'E':
            currentNote = new AudioNote(4);
            break;
        case 'F':
            currentNote = new AudioNote(5);
            break;
        case 'G':
            currentNote = new AudioNote(7);
            break;
        case 'A':
            currentNote = new AudioNote(9);
            break;
        case 'B':
            currentNote = new AudioNote(11);
            break;
        case '0':
            this.addPercussiveSound(percussiveSounds.tick, currentDuration);
            break;
        case '1':
            this.addPercussiveSound(percussiveSounds.tweet, currentDuration);
            break;
        case '2':
            this.addPercussiveSound(percussiveSounds.cowbell, currentDuration);
            break;
        case '4':
            this.addPercussiveSound(percussiveSounds.snare, currentDuration);
            break;
        case '5':
            this.addPercussiveSound(percussiveSounds.woodblock, currentDuration);
            break;
        case '6':
            this.addPercussiveSound(percussiveSounds.lowSnare, currentDuration);
            break;
        case '7':
            this.addPercussiveSound(percussiveSounds.tom, currentDuration);
            break;
        case '8':
            this.addPercussiveSound(percussiveSounds.lowWoodblock, currentDuration);
            break;
        case '9':
            this.addPercussiveSound(percussiveSounds.bass, currentDuration);
            break;
        default:
            currentNote = undefined;

        }

        // If we got a note to play...
        if (currentNote) {

            nextChar = index >= notation.length ? undefined : notation.charAt(index + 1);
            activeDuration = currentDuration;

            if (nextChar === '#') {
                currentNote.shiftUp();
                index += 1;
            } else if (nextChar === '!') {
                currentNote.shiftDown();
                index += 1;
            }

            // If we're in a triplet, set our duration to 1/3 normal
            if (tripletCount > 0) {
                tripletCount -= 1;
                activeDuration = tripletDuration;
            }

            // If we're in time and a half, increase our duration by 50%
            if (timeAndHalf) {
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

/**
 * Audio is capable of playing melodic tunes and sound effects through a
 * textual syntax on a single square wave oscillator.
 */
function Audio() {

    /*jslint newcap: true */

    var audioContextFunction = window.AudioContext || window.webkitAudioContext;

    if (!(this instanceof Audio)) {
        throw ConstructorError;
    }

    // Try to activate this Audio instance
    this.setActive(true);

    // If it was successfully activated...
    if (this.active) {

        // Establish our context
        this.context = new audioContextFunction();

        // Initialize our audio nodes
        this.userVolume = 0.1;
        this.delay = 0.06;
        this.volume = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.volume.gain.value = 0;
        this.volume.connect(this.context.destination);

        // Create an oscillator
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = this.oscillator.SQUARE || 'square';
        this.oscillator.connect(this.volume);

        // Polyfill for oscillator start
        if (!this.oscillator.start) {
            this.oscillator.start = this.oscillator.noteOn;
        }

        this.timestamp = this.context.currentTime;
        this.interruptTimestamp = this.context.currentTime;

        // Start our oscillator
        this.oscillator.start(this.context.currentTime);

    }

}

/**
 * Activates or deactivates this Audio instance. Activation will only work if
 * AudioContext or webkitAudioContext is available.
 *
 * @param activeValue A boolean value indicating whether or not to activate this Audio instance.
 */
Audio.prototype.setActive = function (activeValue, immediately) {

    // Our immediately parameter defaults to true
    immediately = (immediately === undefined) ? true : immediately;

    // Cancel all audio if we're about to unset it
    if (this.active && !activeValue && immediately) {
        this.cancel();
    }

    // Assign our new value
    this.active = (activeValue && (window.AudioContext || window.webkitAudioContext));

};

/**
 * Cancels all audio events for this Audio instance. This will immediately halt any playing
 * audio.
 */
Audio.prototype.cancel = function () {

    // If this Audio instance is active and has an oscillator...
    if (this.active && this.oscillator) {

        var cancelTime = this.context.currentTime + this.delay;

        // Cancel all scheduled frequency changes on the oscillator
        this.oscillator.frequency.cancelScheduledValues(cancelTime);

        // Cancel all scheduled volumne changes on the volumne node
        this.volume.gain.cancelScheduledValues(cancelTime);
        this.volume.gain.setValueAtTime(0, cancelTime);

        // Reset our timestamp and interrupt timestamp to right now
        this.timestamp = this.context.currentTime;
        this.interruptTimestamp = this.context.currentTime;

    }

};

/**
 * Retrieves whether or not this Audio instance is currently playing audio.
 *
 * @return True if audio is currently playing, false otherwise.
 */
Audio.prototype.isPlaying = function () {
    return this.active && (this.context.currentTime + this.delay) < this.timestamp;
};

/**
 * Schedules a provided notation to begin playing immediately after any
 * currently playing audio has finished. The new audio can optionally be
 * marked as uninterruptable, meaning that no other audio event will be
 * able to interrupt its progress unless this Audio instance is explicitly
 * cancelled.
 *
 * @param notation A textual notation indicating a melody to play
 * @param uninterruptable A truthy value indicating if the new melody is interruptable
 */
Audio.prototype.playAfter = function (notation, uninterruptable) {

    if (this.active) {

        var index,
            note,
            song,
            startTime;

        // Create a song from our notation
        song = new AudioSong(notation);

        // Update our starting timestamp
        if (this.timestamp < this.context.currentTime + this.delay) {
            this.timestamp = this.context.currentTime + this.delay;
        }

        startTime = this.timestamp;

        // Set our oscillator frequency at our scheduled note times
        for (index = 0; index < song.notes.length; index += 1) {

            note = song.notes[index];

            // Check what we've been given...
            if (note.frequency && note.endFrequency) {

                // We've got both a start and end frequency
                this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);
                this.oscillator.frequency.linearRampToValueAtTime(note.endFrequency, this.timestamp + note.duration);

            } else if (note.frequency) {

                // There's just a start frequency
                this.oscillator.frequency.setValueAtTime(note.frequency, this.timestamp);

            } else {

                // There's no frequency at all
                this.volume.gain.setValueAtTime(0, this.timestamp);
                this.volume.gain.setValueAtTime(this.userVolume, this.timestamp + note.duration);

            }

            // Update our timestamp
            this.timestamp += note.duration;

        }

        // Start our oscillator now, and stop after all notes are done
        this.volume.gain.setValueAtTime(this.userVolume, startTime);
        this.volume.gain.setValueAtTime(0, this.timestamp);

        // If we're not to be interrupted, upadte the timestamp
        if (uninterruptable) {
            this.interruptTimestamp = this.timestamp;
        }

    }

};

/**
 * Immediately plays a provided notation, interrupting any currently playing audio,
 * unless that audio has been denoted as uninterruptable. The new audio can optionally be
 * marked as uninterruptable, meaning that no other audio event will be
 * able to interrupt its progress unless this Audio instance is explicitly
 * cancelled.
 *
 * @param notation A textual notation indicating a melody to play
 * @param uninterruptable A truthy value indicating if the new melody is interruptable
 */
Audio.prototype.play = function (notation, uninterruptable) {
    if (this.active && this.context.currentTime + this.delay >= this.interruptTimestamp) {
        this.cancel();
        this.playAfter(notation, uninterruptable);
    }
};

initalizePercussiveSounds();
exports.Audio = Audio;
