import { frequencyTable } from './shared.js';

class AudioNote {
  constructor(index, duration) {
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
  adjustNote(adjustmentValue) {
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
  }

  /**
   * Shifts this Note up by one note on a traditional scale.
   */
  shiftUp() {
    this.adjustNote(1);
  }

  /**
   * Shifts this Note down by one note on a traditional scale.
   */
  shiftDown() {
    this.adjustNote(-1);
  }

  /**
   * Shifts this Note up by a provided number of octaves on a traditional scale.
   *
   * @param octaveCount A number of octaves to shift this Note up.
   */
  octaveUp(octaveCount) {
    this.adjustNote(12 * octaveCount);
  }

  /**
   * Shifts this Note down by a provided number of ocaves on a traditional scale.
   *
   * @param octaveCount A number of octaves to shift this Note down.
   */
  octaveDown(octaveCount) {
    this.adjustNote(-12 * octaveCount);
  }

  /**
   * 'Bends' this note to have a different ending frequency than its starting
   * frequency over the course of its duration.
   *
   * @param newIndex A different ending frequency for this Note.
   */
  bendTo(newIndex) {
    this.endFrequency = frequencyTable[newIndex];
  }
}



export { AudioNote };
