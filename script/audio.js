/**
 * JZT Audio
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */
/* global AudioContext, webkitAudioContext */

"use strict";

var jzt = jzt || {};

/**
 * Audio is capable of playing melodic tunes and sound effects through a 
 * textual syntax on a single square wave oscillator.
 */
jzt.Audio = function() {

    // Try to activate this Audio instance
    this.setActive(true);

    // If it was successfully activated...
    if(this.active) {

        // Establish our context
        if (typeof AudioContext !== 'undefined') {
            this.context = new AudioContext();
        }
        else if (typeof webkitAudioContext !== 'undefined') {
            /*jshint newcap: false */
            this.context = new webkitAudioContext();
            /*jshint newcap: true */
        }

        // Initialize our audio nodes
        this.userVolume = 0.08;
        this.volume = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.volume.gain.value = this.userVolume;
        this.volume.connect(this.context.destination);

        this.timestamp = this.context.currentTime;
        this.interruptTimestamp = this.context.currentTime;
    }

};

/**
 * Activates or deactivates this Audio instance. Activation will only work if
 * AudioContext or webkitAudioContext is available.
 *
 * @param activeValue A boolean value indicating whether or not to activate this Audio instance.
 */
jzt.Audio.prototype.setActive = function(activeValue) {

    this.active = (activeValue && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'));

};

/**
 * Cancels all audio events for this Audio instance. This will immediately halt any playing
 * audio.
 */
jzt.Audio.prototype.cancel = function() {

    // If this Audio instance is active and has an oscillator...
    if(this.active && this.oscillator) {

        // Cancel all scheduled frequency changes on the oscillator
        this.oscillator.frequency.cancelScheduledValues(0);

        // Cancel all scheduled volumne changes on the volumne node
        this.volume.gain.cancelScheduledValues(0);
        this.volume.gain.value = this.userVolume;

        // Stop the oscillator
        // TODO: Once Chrome fixes a certain bug, use stop instead of disconnect
        this.oscillator.disconnect();
        this.oscillator = undefined;

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
jzt.Audio.prototype.isPlaying = function() {
    return this.active && this.context.currentTime < this.timestamp;
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
jzt.Audio.prototype.playAfter = function(notation, uninterruptable) {

    if(this.active) {

        // Create a song from our notation
        var song = new jzt.Audio.Song(notation);

        // Create an oscillator for this play session
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = this.oscillator.SQUARE ? this.oscillator.SQUARE : 'square';
        this.oscillator.connect(this.volume);

        // Polyfill for oscillator start and stop
        if(!this.oscillator.start) {
            this.oscillator.start = this.oscillator.noteOn;
        }
        if(!this.oscillator.stop) {
            this.oscillator.stop = this.oscillator.noteOff;
        }

        // Update our starting timestamp
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
jzt.Audio.prototype.play = function(notation, uninterruptable) {
    if(this.active && this.context.currentTime >= this.interruptTimestamp) {
        this.cancel();
        this.playAfter(notation, uninterruptable);
    }
};

/**
 * Note represents a single melodic note, taking a numeric index from 0 to 107, with 0 representing C-0
 * and 107 representing B-8, incrementing along all traditional notes on a piano. A duration in seconds must 
 * also be provided.
 *
 * @param A note index.
 * @param A note duration in seconds.
 */
jzt.Audio.Note = function(index, duration) {
    this.noteIndex = index;
    this.frequency = jzt.Audio.Note.frequencyTable[this.noteIndex];
    this.duration = duration;
};

/**
 * Adjusts this Note instance by a specified value on our linear frequency scale. Increasing this Note's
 * value will move it up the scale, while decreasing it will move it down.
 *
 * @param adjustmentValue An integer value to modify this note's index on the linear frequency scale.
 */
jzt.Audio.Note.prototype.adjustNote = function(adjustmentValue) {

    // If we have a note index to adjust...
    if(this.noteIndex !== undefined) {

        // Adjust the value
        this.noteIndex += adjustmentValue;

        // If it moves past the end of our scale, cap it to the last note
        if(this.noteIndex >= jzt.Audio.Note.frequencyTable.length-1) {
            this.noteIndex = jzt.Audio.Note.frequencyTable.length-1;
        }

        // If it moves before the start of our scale, base it to the first note
        else if(this.noteIndex < 0) {
            this.noteIndex = 0;
        }

        // Assign our actual frequency value
        this.frequency = jzt.Audio.Note.frequencyTable[this.noteIndex];

    }
};

/**
 * Shifts this Note up by one note on a traditional scale.
 */
jzt.Audio.Note.prototype.shiftUp = function() {
    this.adjustNote(1);
};

/**
 * Shifts this Note down by one note on a traditional scale.
 */
jzt.Audio.Note.prototype.shiftDown = function() {
    this.adjustNote(-1);
};

/**
 * Shifts this Note up by a provided number of octaves on a traditional scale.
 *
 * @param octaveCount A number of octaves to shift this Note up.
 */
jzt.Audio.Note.prototype.octaveUp = function(octaveCount) {
    this.adjustNote(12*octaveCount);
};

/**
 * Shifts this Note down by a provided number of ocaves on a traditional scale.
 *
 * @param octaveCount A number of octaves to shift this Note down.
 */
jzt.Audio.Note.prototype.octaveDown = function(octaveCount) {
    this.adjustNote(-12*octaveCount);
};

/**
 * 'Bends' this note to have a different ending frequency than its starting
 * frequency over the course of its duration.
 *
 * @param newIndex A different ending frequency for this Note.
 */
jzt.Audio.Note.prototype.bendTo = function(newIndex) {
    this.endFrequency = jzt.Audio.Note.frequencyTable[newIndex];
};

/**
 * A static frequency table that maps indicies from 0 to 107 to notes on a traditional
 * scale, starting with 0 at C-0 to 107 at B-8.
 */
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

/**
 * Song represents a sequence of Note instances chained one after another to create a
 * melody or sound effect. Percussive sounds and rest periods may also be added.
 *
 * @param notation A textual notation representing a melody or sound effect.
 */
jzt.Audio.Song = function(notation) {
    this.MAX_OCTAVE = 8;
    this.barLength = 1.8;
    this.notes = [];
    this.parse(notation);
};

/**
 * percussiveSound is an enumerated type representing percussive sound effects.
 */
jzt.Audio.Song.percussiveSound = {
    'Cowbell': [103,103,105,80,103,103,105,80,103,103,105,80,103,103,105,80],
    'HighSnare': [12,71,87,83,94,12,92,89,85,99,12,92,68,79,103],
    'HighWoodblock': [80, 79, 80, 68, 80, 79, 80, 70, 80, 83, 78, 80, 81, 80],
    'LowSnare': [12,97,93,76,88,81,12,97,93,76,88,81,12,97,93,76,88,81],
    'LowWoodblock': [12,74,74,73,73,12,74,74,75,75,12,74,74,75,75,76,76],
    'BassDrum': [54,52,50,5,12,30,58,56,54,5,12,30,62,60,58,5,12]
};

/**
 * Adds a provided sequence of frequencies as a percussive sound effect to fit
 * within a provided duration.
 *
 * @param noteArray An array of note indicies to be played rapidly in succession
 * @param currentDuration A duration in which we expect the percussive sound to fit
 */
jzt.Audio.Song.prototype.addPercussiveSound = function(noteArray, currentDuration) {

    var remainingDuration = currentDuration;

    for(var index in noteArray) {
        if(noteArray.hasOwnProperty(index)) {
            this.notes.push(new jzt.Audio.Note(noteArray[index], 0.001));
            remainingDuration -= 0.001;
        }
    }

    if(remainingDuration > 0) {
        this.addRest(remainingDuration);
    }

};

/**
 * Adds a specified rest duration (in seconds) to this Song.
 *
 * @param duration A duration in seconds to rest.
 */
jzt.Audio.Song.prototype.addRest = function(duration) {
    this.notes.push(new jzt.Audio.Note(undefined, duration));
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
jzt.Audio.Song.prototype.parse = function(notation) {

    var currentOctave = 4;
    var currentDuration = this.barLength / 32;
    var tripletDuration = currentDuration / 3;
    var tripletCount = -1;
    var timeAndHalf = false;
    var percussiveNote;
    var currentNote;
    var currentChar;
    var nextChar;
    var activeDuration;
    var index;

    // Convert the notation to uppercase so that it's effectively case-insensitive
    notation = notation.toUpperCase();

    // For each character in our notation...
    for(index = 0; index < notation.length; ++index) {

        currentNote = undefined;
        currentChar = notation.charAt(index);

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
                percussiveNote = new jzt.Audio.Note(0, 0.005);
                percussiveNote.bendTo(56);
                this.notes.push(percussiveNote);
                this.addRest(currentDuration - 0.005);
                break;
            case '1':
                percussiveNote = new jzt.Audio.Note(72, 0.015);
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
                percussiveNote = new jzt.Audio.Note(65, 0.015);
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

            nextChar = index >= notation.length ? undefined : notation.charAt(index+1);
            activeDuration = currentDuration;

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