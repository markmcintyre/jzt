import { SONG_BAR_LENGTH, percussiveSounds } from './shared.js';
import { AudioNote } from './audio-note.js';

class AudioSong {
  constructor(notation) {
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
  addPercussiveSound(noteArray, currentDuration) {
    var index,
      remainingDuration = currentDuration;

    for (index in noteArray) {
      if (noteArray.hasOwnProperty(index)) {
        this.notes.push({
          frequency: noteArray[index],
          duration: 0.0015,
        });
        remainingDuration -= 0.0015;
      }
    }

    if (remainingDuration > 0) {
      this.addRest(remainingDuration);
    }
  }

  /**
   * Adds a specified rest duration (in seconds) to this Song.
   *
   * @param duration A duration in seconds to rest.
   */
  addRest(duration) {
    this.notes.push(new AudioNote(undefined, duration));
  }

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
  parse(notation) {
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
          activeDuration = currentDuration + currentDuration / 2;
        }

        // Adjust our octave
        currentNote.octaveUp(currentOctave);

        // Adjust our duration
        currentNote.duration = activeDuration;

        // Add our note
        this.notes.push(currentNote);
      }
    }
  }
}


export { AudioSong };
