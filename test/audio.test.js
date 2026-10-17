import test from 'node:test';
import assert from 'node:assert/strict';
import {Audio, AudioNote, AudioSong} from '../src/audio.js';

test('AudioNote clamps indices and supports shifts and bends', () => {
  const note = new AudioNote(60, 0.5);
  assert.equal(note.noteIndex, 60); assert.equal(note.frequency, 523.3);
  note.shiftUp(); note.shiftDown(); note.octaveUp(1); assert.equal(note.noteIndex, 72);
  note.octaveDown(10); assert.equal(note.noteIndex, 0);
  note.adjustNote(999); assert.equal(note.noteIndex, 107);
  note.bendTo(40); assert.equal(note.endFrequency, 164.8);
});

test('AudioSong parses rests, duration and percussive notes', () => {
  const song = new AudioSong('Q C H X');
  assert.equal(song.notes.length, 2);
  assert.equal(song.notes[0].noteIndex, 48);
  assert.equal(song.notes[0].duration, 1.8 / 4);
  assert.equal(song.notes[1].noteIndex, undefined);
  assert.equal(song.notes[1].duration, 1.8 / 2);
  const percussion = new AudioSong('0');
  assert.ok(percussion.notes.length > 1);
  assert.ok(percussion.notes.every(note => note.duration > 0));
});

test('AudioSong applies accidentals, octave shifts, and dotted durations', () => {
  const song = new AudioSong('Q C# D! +C .D');
  assert.equal(song.notes.length, 4);
  assert.equal(song.notes[0].noteIndex, 49);
  assert.equal(song.notes[0].duration, 1.8 / 4);
  assert.equal(song.notes[1].noteIndex, 49);
  assert.equal(song.notes[1].duration, 1.8 / 4);
  assert.equal(song.notes[2].noteIndex, 60);
  assert.equal(song.notes[2].duration, 1.8 / 4);
  assert.equal(song.notes[3].noteIndex, 62);
  assert.equal(song.notes[3].duration, (1.8 / 4) * 1.5);
});

test('AudioSong emits rests between notes with the active duration', () => {
  const song = new AudioSong('Q C X D');
  assert.equal(song.notes.length, 3);
  assert.equal(song.notes[0].noteIndex, 48);
  assert.equal(song.notes[0].duration, 1.8 / 4);
  assert.equal(song.notes[1].noteIndex, undefined);
  assert.equal(song.notes[1].duration, 1.8 / 4);
  assert.equal(song.notes[2].noteIndex, 50);
  assert.equal(song.notes[2].duration, 1.8 / 4);
});

test('AudioSong accounts for every percussive tick duration', () => {
  const song = new AudioSong('Q0');
  assert.equal(song.notes.length, 2);
  assert.equal(song.notes[0].frequency, 3200);
  assert.equal(song.notes[0].duration, 0.0015);
  assert.equal(song.notes[1].noteIndex, undefined);
  assert.equal(song.notes[1].duration, 1.8 / 4 - 0.0015);
});

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
  }

  createGain() {
    return {
      gain:{
        value:0,
        cancelScheduledValues(){},
        setValueAtTime(){}
      },
      connect(){}
    };
  }

  createOscillator() {
    return {
      frequency:{
        cancelScheduledValues(){},
        setValueAtTime(){},
        linearRampToValueAtTime(){}
      },
      connect(){},
      start(){}
    };
  }
}

test('Audio caches repeated songs with bounded LRU storage', () => {
  const previousWindow = globalThis.window;
  globalThis.window = {AudioContext:FakeAudioContext};

  try {
    const audio = new Audio();
    const first = audio.getSong('q c');
    const second = audio.getSong('Q C');
    let stats = audio.getSongCacheStats();

    assert.strictEqual(first, second);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.notes), true);
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
    assert.equal(stats.entries, 1);

    for (let index = 0; index < stats.maxEntries + 1; index += 1) {
      audio.getSong('C' + ' '.repeat(index + 1));
    }

    stats = audio.getSongCacheStats();
    assert.equal(stats.entries, stats.maxEntries);
    assert.ok(stats.evictions > 0);
    assert.ok(stats.cachedNotes <= stats.maxNotes);

    const entriesBeforeOversizedSong = stats.entries;
    audio.getSong('C'.repeat(stats.maxNotes + 1));
    stats = audio.getSongCacheStats();
    assert.equal(stats.entries, entriesBeforeOversizedSong);
    assert.equal(stats.skipped, 1);

    const playbackAudio = new Audio();
    playbackAudio.playAfter('q c');
    playbackAudio.playAfter('Q C');
    stats = playbackAudio.getSongCacheStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
});
