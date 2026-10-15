/**
 * JZT Audio
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

/**
 * A static frequency table that maps indicies from 0 to 107 to notes on a traditional
 * scale, starting with 0 at C-0 to 107 at B-8.
 */
const frequencyTable = [
    //  0      1      2      3      4      5      6      7      8      9      10     11
    16.35,
    17.32,
    18.35,
    19.45,
    20.6,
    21.83,
    23.12,
    24.5,
    25.96,
    27.5,
    29.14,
    30.87, // 0
    32.7,
    34.65,
    36.71,
    38.89,
    41.2,
    43.65,
    46.25,
    49.0,
    51.91,
    55.0,
    58.27,
    61.74, // 12
    65.41,
    69.3,
    73.42,
    77.78,
    82.41,
    87.31,
    92.5,
    98.0,
    103.8,
    110.0,
    116.5,
    123.5, // 24
    130.8,
    138.6,
    146.8,
    155.6,
    164.8,
    174.6,
    185.0,
    196.0,
    207.7,
    220.0,
    233.1,
    246.9, // 36
    261.6,
    277.2,
    293.7,
    311.1,
    329.6,
    349.2,
    370.0,
    392.0,
    415.3,
    440.0,
    466.2,
    493.9, // 48
    523.3,
    554.4,
    587.3,
    622.3,
    659.3,
    698.5,
    740.0,
    784.0,
    830.6,
    880.0,
    932.3,
    987.8, // 60
    1047,
    1109,
    1175,
    1245,
    1319,
    1397,
    1480,
    1568,
    1661,
    1760,
    1865,
    1976, // 72
    2093,
    2217,
    2349,
    2489,
    2637,
    2794,
    2960,
    3136,
    3322,
    3520,
    3729,
    3951, // 84
    4186,
    4435,
    4699,
    4978,
    5274,
    5588,
    5920,
    6272,
    6645,
    7040,
    7459,
    7902, // 96
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
    bass: [],
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
    percussiveSounds.lowSnare.push((index % 2) * 880 + 880 + (index % 3) * 440);
  }

  // Tom
  for (index = 0; index < 14; ++index) {
    percussiveSounds.tom.push(700 - index * 12);
  }

  // Low Woodblock
  for (index = 0; index < 14; ++index) {
    percussiveSounds.lowWoodblock.push(index * 20 + 1200 - Math.random() * index * 40);
  }

  // Bass
  for (index = 0; index < 14; ++index) {
    percussiveSounds.bass.push(Math.random() * 440 + 220);
  }
}




initalizePercussiveSounds();
export { frequencyTable, percussiveSounds, SONG_BAR_LENGTH, initalizePercussiveSounds };
