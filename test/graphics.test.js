import test from 'node:test';
import assert from 'node:assert/strict';
import {Point} from '../src/basic.js';
import {Colors, Color, ColorUtilities, SpriteGrid} from '../src/graphics.js';
import {SPRITE_DATA} from '../src/graphics/sprite-data.js';

test('sprite data is a complete PNG data URL', () => {
  assert.equal(SPRITE_DATA.startsWith('data:image/png;base64,'), true);
  const bytes = Buffer.from(SPRITE_DATA.slice('data:image/png;base64,'.length), 'base64');
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.length > 0, true);
});

test('Colors lighten, darken and stay bounded', () => {
  assert.equal(Colors.Blue.lighten(), Colors.BrightBlue);
  assert.equal(Colors.BrightWhite.lighten(), Colors.BrightWhite);
  assert.equal(Colors.Black.darken(), Colors.Black);
  assert.equal(Colors.BrightBlue.isLight(), true);
  assert.equal(Colors.Blue.isDark(), true);
  assert.equal(ColorUtilities.getColor('E'), Colors.Yellow);
  assert.equal(ColorUtilities.deserializeForeground('1F'), Colors.BrightWhite);
  assert.equal(ColorUtilities.deserializeBackground('10'), Colors.Blue);
  assert.equal(ColorUtilities.serialize(Colors.Blue, Colors.BrightWhite), '1F');
});

test('SpriteGrid stores tiles, colors and text using focused graphics fake', () => {
  const graphics = {
    getSprite(index) { return {index}; },
    textToSprites(text) { return [...text].map(char => ({char})); },
    convertSpecialCharacter(char) { return char; }
  };
  const grid = new SpriteGrid(4, 2, graphics);
  grid.setTile(new Point(1, 0), 7, Colors.Red, Colors.Blue);
  assert.deepEqual(grid.getTile(new Point(1, 0)), {sprite:{index:7}, foreground:Colors.Red, background:Colors.Blue});
  grid.setColor(new Point(1, 0), Colors.Green);
  assert.equal(grid.getTile(new Point(1, 0)).foreground, Colors.Green);
  grid.addText(new Point(0, 1), 'ab', Colors.White);
  assert.equal(grid.getTile(new Point(0, 1)).sprite.char, 'a');
  assert.equal(grid.getTile(new Point(1, 1)).sprite.char, 'b');
  grid.clear(); assert.equal(grid.getTile(new Point(1, 0)), undefined);
});

test('Color can be constructed with RGB values', () => {
  assert.equal(new Color('x', 'custom', 1, 1, 2, 15).rgbValue, '#01020f');
});
