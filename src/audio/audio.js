import { AudioSong } from './audio-song.js';

const MAX_SONG_CACHE_ENTRIES = 64;
const MAX_SONG_CACHE_NOTES = 4096;

class Audio {
  constructor() {
    /*jslint newcap: true */

    this.songCache = new Map();
    this.songCacheNotes = 0;
    this.songCacheHits = 0;
    this.songCacheMisses = 0;
    this.songCacheEvictions = 0;
    this.songCacheSkipped = 0;

    var audioContextFunction = window.AudioContext || window.webkitAudioContext;

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
  setActive(activeValue, immediately) {
    // Our immediately parameter defaults to true
    immediately = immediately === undefined ? true : immediately;

    // Cancel all audio if we're about to unset it
    if (this.active && !activeValue && immediately) {
      this.cancel();
    }

    // Assign our new value
    this.active = activeValue && (window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Cancels all audio events for this Audio instance. This will immediately halt any playing
   * audio.
   */
  cancel() {
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
  }

  /**
   * Retrieves whether or not this Audio instance is currently playing audio.
   *
   * @return True if audio is currently playing, false otherwise.
   */
  isPlaying() {
    return this.active && this.context.currentTime + this.delay < this.timestamp;
  }
  /**
   * Retrieves a parsed song from the bounded per-instance LRU cache.
   *
   * @param notation A textual music notation.
   * @return A parsed AudioSong.
   */
  getSong(notation) {

    var key = notation.toUpperCase(),
      entry,
      song,
      noteCount,
      oldestKey,
      oldestEntry;

    entry = this.songCache.get(key);
    if (entry) {
      this.songCache.delete(key);
      this.songCache.set(key, entry);
      this.songCacheHits += 1;
      return entry.song;
    }

    this.songCacheMisses += 1;
    song = new AudioSong(key);
    noteCount = song.notes.length;

    if (noteCount > MAX_SONG_CACHE_NOTES) {
      this.songCacheSkipped += 1;
      return song;
    }
    song.notes.forEach(note => Object.freeze(note));
    Object.freeze(song.notes);
    Object.freeze(song);

    this.songCache.set(key, {song, noteCount});
    this.songCacheNotes += noteCount;

    while (this.songCache.size > MAX_SONG_CACHE_ENTRIES || this.songCacheNotes > MAX_SONG_CACHE_NOTES) {
      oldestKey = this.songCache.keys().next().value;
      oldestEntry = this.songCache.get(oldestKey);
      this.songCache.delete(oldestKey);
      this.songCacheNotes -= oldestEntry.noteCount;
      this.songCacheEvictions += 1;
    }

    return song;

  }

  /**
   * Returns diagnostics for the bounded song cache.
   *
   * @return A snapshot of cache usage and lookup counters.
   */
  getSongCacheStats() {
    return {
      hits:this.songCacheHits,
      misses:this.songCacheMisses,
      evictions:this.songCacheEvictions,
      skipped:this.songCacheSkipped,
      entries:this.songCache.size,
      cachedNotes:this.songCacheNotes,
      maxEntries:MAX_SONG_CACHE_ENTRIES,
      maxNotes:MAX_SONG_CACHE_NOTES
    };
  }


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
  playAfter(notation, uninterruptable) {
    if (this.active) {
      var index, note, song, startTime;

      // Retrieve the parsed song from the bounded cache.
      song = this.getSong(notation);

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
  }

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
  play(notation, uninterruptable) {
    if (this.active && this.context.currentTime + this.delay >= this.interruptTimestamp) {
      this.cancel();
      this.playAfter(notation, uninterruptable);
    }
  }
}

export { Audio };
