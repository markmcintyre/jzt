import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction} from '../src/basic.js';
import {things} from '../src/things.js';

function key(point) {
  return `${point.x},${point.y}`;
}

function boardFixture() {
  const tiles = new Map();
  const calls = {audio: [], moves: [], passageMoves: []};
  const board = {
    game: {
      resources: {
        audio: {
          isPlaying: () => false,
          play: (notation, uninterruptable) => calls.audio.push({notation, uninterruptable})
        }
      },
      movePlayerToPassage: (passageId, targetBoard) => {
        calls.passageMoves.push({passageId, targetBoard});
      }
    },
    getTile(point) {
      return tiles.get(key(point));
    },
    isOutside(point) {
      return point.x < 0 || point.x > 9 || point.y < 0 || point.y > 9;
    },
    moveTile(from, to) {
      calls.moves.push({from: {x: from.x, y: from.y}, to: {x: to.x, y: to.y}});
      const tile = tiles.get(key(from));
      if (tiles.has(key(to))) {
        return false;
      }
      if (!tile) {
        return false;
      }
      tiles.delete(key(from));
      tile.point = to;
      tiles.set(key(to), tile);
      return true;
    }
  };
  return {board, tiles, calls};
}

test('Passage TOUCH moves the player to its configured target board and passage', () => {
  const {board, calls} = boardFixture();
  const targetBoard = {name: 'next-board'};
  const passage = new things.Passage(board);
  passage.passageId = 7;
  passage.targetBoard = targetBoard;

  passage.sendMessage('TOUCH');

  assert.deepEqual(calls.passageMoves, [{passageId: 7, targetBoard}]);
  assert.deepEqual(calls.audio, [{notation: 'tceg tc#fg# tdf#a td#ga# teg#+c', uninterruptable: undefined}]);
});

test('Passage serialization preserves the destination used for travel', () => {
  const {board} = boardFixture();
  const targetBoard = {name: 'serialized-target'};
  const passage = new things.Passage(board);
  passage.passageId = 3;
  passage.targetBoard = targetBoard;

  const data = passage.serialize();
  const restored = new things.Passage(board);
  restored.deserialize(data);

  assert.equal(data.type, 'Passage');
  assert.equal(restored.passageId, 3);
  assert.equal(restored.targetBoard, targetBoard);
});

test('Teleporter push finds the opposite teleporter and moves the tile beyond it', () => {
  const {board, tiles, calls} = boardFixture();
  const teleporter = new things.Teleporter(board);
  teleporter.point = new Point(2, 2);
  teleporter.orientation = Direction.East;
  const opposite = new things.Teleporter(board);
  opposite.point = new Point(4, 2);
  opposite.orientation = Direction.West;
  const player = {type: 'Player', point: new Point(1, 2)};
  tiles.set(key(teleporter.point), teleporter);
  tiles.set('3,2', {type: 'SolidWall', point: new Point(3, 2)});
  tiles.set(key(opposite.point), opposite);
  tiles.set(key(player.point), player);

  const result = teleporter.push(Direction.East);

  assert.equal(result, true);
  assert.deepEqual(calls.moves, [
    {from: {x: 1, y: 2}, to: {x: 3, y: 2}},
    {from: {x: 1, y: 2}, to: {x: 5, y: 2}}
  ]);
  assert.equal(player.point.equals(new Point(5, 2)), true);
  assert.deepEqual(calls.audio, [{notation: 'tc+d-e+f#-g#+a#c+d', uninterruptable: undefined}]);
});

test('Teleporter serialization preserves orientation that controls its push direction', () => {
  const {board} = boardFixture();
  const teleporter = new things.Teleporter(board);
  teleporter.orientation = Direction.North;

  const restored = new things.Teleporter(board);
  restored.deserialize(teleporter.serialize());

  assert.equal(teleporter.serialize().orientation, 'North');
  assert.equal(restored.orientation.equals(Direction.North), true);
});
