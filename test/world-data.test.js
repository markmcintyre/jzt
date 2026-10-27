import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../src/board.js';
import {ThingFactory} from '../src/things.js';
import {Editor} from '../src/editor.js';

const game = {
  FPS:60,
  context:{canvas:{width:800, height:640}},
  resources:{graphics:{TILE_SIZE:{x:8, y:8}, getSprite(){return {};}}},
  notifyListeners() {}
};

const data = (overrides = {}) => ({
  name:'Malformed Data Fixture',
  width:10,
  height:10,
  playerX:1,
  playerY:1,
  tiles:Array(100).fill(0),
  scripts:[],
  ...overrides
});

test('ThingFactory rejects non-string types without calling string methods', () => {
  assert.equal(ThingFactory.deserialize({type:42}, {}), undefined);
  assert.equal(ThingFactory.isKnownThing(null), false);
  assert.equal(ThingFactory.isKnownThing({}), false);
});

test('Board rejects tile arrays with missing records', () => {
  assert.throws(
    () => new Board(data({tiles:Array(99).fill(0)}), game),
    error => error instanceof Error && error.message === 'Invalid board data.'
  );
});

test('Board rejects invalid dimensions before loading tiles', () => {
  assert.throws(
    () => new Board(data({width:10.5}), game),
    error => error instanceof Error && error.message === 'Invalid board data.'
  );
});

test('Board reports malformed serialized tile records with index and type', () => {
  const nonStringType = Array(100).fill(0);
  nonStringType[3] = {type:42};
  assert.throws(
    () => new Board(data({tiles:nonStringType}), game),
    error => error instanceof Error && /index 3/.test(error.message) && /42/.test(error.message)
  );

  const unknownType = Array(100).fill(0);
  unknownType[7] = {type:'MissingThing'};
  assert.throws(
    () => new Board(data({tiles:unknownType}), game),
    error => error instanceof Error && /index 7/.test(error.message) && /MissingThing/.test(error.message)
  );
});

test('Board rejects malformed scripts with their index', () => {
  assert.throws(
    () => new Board(data({scripts:[{name:'broken'}]}), game),
    error => error instanceof Error && /script at index 0/.test(error.message)
  );
});

test('Editor reports incompatible world data with an Error', () => {
  assert.throws(
    () => Editor.prototype.deserialize.call({formatVersion:'1.0.0'}, {version:'0.9.0'}),
    error => error instanceof Error && error.message === 'Incompatible version'
  );
});
