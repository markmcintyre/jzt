import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction} from '../src/basic.js';
import {Colors} from '../src/graphics.js';
import {Thing, things} from '../src/things.js';

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function pointValue(point) {
  return {x: point.x, y: point.y};
}

function fixture(initialCounters = {}) {
  const counters = {...initialCounters};
  const tiles = new Map();
  const calls = {
    deleteTile: [],
    replaceTile: [],
    getTile: [],
    moveTile: [],
    displayMessages: [],
    adjustCounter: [],
    setCounterValue: [],
    getCounterValue: [],
    oneTimeMessage: [],
    audio: [],
    playerMessages: []
  };
  const audio = {
    isPlaying() {
      return false;
    },
    play(notation, uninterruptable) {
      calls.audio.push({notation, uninterruptable});
    }
  };
  const game = {
    resources: {audio},
    CYCLE_TICKS: 1,
    oneTimeMessage(message) {
      calls.oneTimeMessage.push(message);
    },
    adjustCounter(counter, value) {
      calls.adjustCounter.push({counter, value});
      counters[counter] = (counters[counter] || 0) + value;
    },
    setCounterValue(counter, value) {
      calls.setCounterValue.push({counter, value});
      counters[counter] = value;
    },
    getCounterValue(counter) {
      calls.getCounterValue.push(counter);
      return counters[counter] || 0;
    }
  };
  const board = {
    game,
    dark: false,
    player: {
      sendMessage(message) {
        calls.playerMessages.push(message);
      }
    },
    deleteTile(point) {
      calls.deleteTile.push(pointValue(point));
      tiles.delete(pointKey(point));
    },
    replaceTile(point, tile) {
      calls.replaceTile.push({point: pointValue(point), tile});
      tile.point = point;
      tiles.set(pointKey(point), tile);
    },
    getTile(point) {
      calls.getTile.push(pointValue(point));
      return tiles.get(pointKey(point));
    },
    moveTile(from, to) {
      calls.moveTile.push({from: pointValue(from), to: pointValue(to)});
      const tile = tiles.get(pointKey(from));
      if (!tile) {
        return false;
      }
      tiles.delete(pointKey(from));
      tile.point = to;
      tiles.set(pointKey(to), tile);
      return true;
    },
    setDisplayMessage(message, priority) {
      calls.displayMessages.push({message, priority});
    }
  };

  return {board, calls, counters, tiles};
}

test('Ammo TOUCH awards five ammo, announces once, plays audio, and removes itself', () => {
  const {board, calls, counters} = fixture({AMMO: 2});
  const ammo = new things.Ammo(board);
  ammo.point = new Point(3, 4);

  ammo.sendMessage('TOUCH');

  assert.ok(ammo instanceof Thing);
  assert.equal(counters.AMMO, 7);
  assert.deepEqual(calls.adjustCounter, [{counter: 'AMMO', value: 5}]);
  assert.deepEqual(calls.oneTimeMessage, ['status.ammo']);
  assert.deepEqual(calls.audio, [{notation: 'tcc#d', uninterruptable: undefined}]);
  assert.deepEqual(calls.deleteTile, [{x: 3, y: 4}]);
  assert.equal(ammo.removed, true);
});

test('Gem TOUCH removes the gem and applies its health, gem, and score rewards', () => {
  const {board, calls, counters} = fixture({HEALTH: 3, GEMS: 1, SCORE: 20});
  const gem = new things.Gem(board);
  gem.point = new Point(1, 2);

  gem.sendMessage('TOUCH');

  assert.equal(counters.HEALTH, 4);
  assert.equal(counters.GEMS, 2);
  assert.equal(counters.SCORE, 30);
  assert.deepEqual(calls.adjustCounter, [
    {counter: 'HEALTH', value: 1},
    {counter: 'GEMS', value: 1},
    {counter: 'SCORE', value: 10}
  ]);
  assert.deepEqual(calls.oneTimeMessage, ['status.gem']);
  assert.deepEqual(calls.audio, [{notation: 't+c-gec', uninterruptable: undefined}]);
  assert.deepEqual(calls.deleteTile, [{x: 1, y: 2}]);
  assert.equal(gem.removed, true);
});

test('Gem SHOT and BOMBED remove it without applying collection counters', () => {
  for (const message of ['SHOT', 'BOMBED']) {
    const {board, calls, counters} = fixture({HEALTH: 3, GEMS: 1, SCORE: 20});
    const gem = new things.Gem(board);
    gem.point = new Point(1, 2);

    gem.sendMessage(message);

    assert.deepEqual(counters, {HEALTH: 3, GEMS: 1, SCORE: 20});
    assert.deepEqual(calls.adjustCounter, []);
    assert.deepEqual(calls.oneTimeMessage, []);
    assert.deepEqual(calls.audio, [{notation: 't-c', uninterruptable: undefined}]);
    assert.deepEqual(calls.deleteTile, [{x: 1, y: 2}]);
    assert.equal(gem.removed, true);
  }
});

test('Door TOUCH stays locked without its matching key and reports the locked door', () => {
  const {board, calls} = fixture();
  const door = new things.Door(board);
  door.point = new Point(4, 5);

  door.sendMessage('TOUCH');

  assert.deepEqual(calls.getCounterValue, ['KEY9']);
  assert.deepEqual(calls.displayMessages, [{message: 'The blue door is locked.', priority: undefined}]);
  assert.deepEqual(calls.audio, [{notation: 't--gc', uninterruptable: undefined}]);
  assert.deepEqual(calls.adjustCounter, []);
  assert.deepEqual(calls.deleteTile, []);
  assert.equal(door.removed, undefined);
});

test('Door TOUCH with its matching key opens, consumes one key, and removes the door', () => {
  const {board, calls, counters} = fixture({KEY9: 2});
  const door = new things.Door(board);
  door.point = new Point(4, 5);

  door.sendMessage('TOUCH');

  assert.equal(counters.KEY9, 1);
  assert.deepEqual(calls.getCounterValue, ['KEY9']);
  assert.deepEqual(calls.adjustCounter, [{counter: 'KEY9', value: -1}]);
  assert.deepEqual(calls.displayMessages, [{message: 'The blue door is now open.', priority: undefined}]);
  assert.deepEqual(calls.audio, [{notation: 'tcgbcgb+ic', uninterruptable: undefined}]);
  assert.deepEqual(calls.deleteTile, [{x: 4, y: 5}]);
  assert.equal(door.removed, true);
});

test('Bomb TOUCH creates an ActiveBomb with its radius and colors, then expiry creates an Explosion', () => {
  const {board, calls} = fixture();
  const bomb = new things.Bomb(board);
  bomb.point = new Point(2, 3);
  bomb.radius = 7;
  bomb.foreground = Colors.BrightRed;
  bomb.background = Colors.Blue;

  bomb.sendMessage('TOUCH');

  assert.equal(calls.replaceTile.length, 1);
  const activeBomb = calls.replaceTile[0].tile;
  assert.ok(activeBomb instanceof things.ActiveBomb);
  assert.equal(activeBomb.radius, 7);
  assert.equal(activeBomb.foreground, Colors.BrightRed);
  assert.equal(activeBomb.background, Colors.Blue);
  assert.equal(activeBomb.point.x, 2);
  assert.equal(activeBomb.point.y, 3);

  activeBomb.timeToLive = 0;
  activeBomb.doTick();

  assert.deepEqual(calls.audio, [
    {notation: 'tcf+cf+c', uninterruptable: undefined},
    {notation: '5', uninterruptable: undefined}
  ]);
  assert.equal(calls.replaceTile.length, 2);
  const explosion = calls.replaceTile[1].tile;
  assert.ok(explosion instanceof things.Explosion);
  assert.equal(explosion.radius, 7);
  assert.equal(explosion.point.x, 2);
  assert.equal(explosion.point.y, 3);
});

test('BreakableWall SHOT removes the wall and plays its break sound', () => {
  const {board, calls} = fixture();
  const wall = new things.BreakableWall(board);
  wall.point = new Point(6, 1);

  wall.sendMessage('SHOT');

  assert.equal(wall.removed, true);
  assert.deepEqual(calls.deleteTile, [{x: 6, y: 1}]);
  assert.deepEqual(calls.audio, [{notation: 't-c', uninterruptable: undefined}]);
  assert.deepEqual(calls.oneTimeMessage, []);
  assert.deepEqual(calls.adjustCounter, []);
});

test('BreakableWall BOMBED follows the same removal side effects as a shot', () => {
  const {board, calls} = fixture();
  const wall = new things.BreakableWall(board);
  wall.point = new Point(6, 1);

  wall.sendMessage('BOMBED');

  assert.equal(wall.removed, true);
  assert.deepEqual(calls.deleteTile, [{x: 6, y: 1}]);
  assert.deepEqual(calls.audio, [{notation: 't-c', uninterruptable: undefined}]);
  assert.deepEqual(calls.oneTimeMessage, []);
  assert.deepEqual(calls.adjustCounter, []);
});

test('Bullet TOUCH damages the player and removes the bullet without counter changes', () => {
  const {board, calls} = fixture();
  const bullet = new things.Bullet(board);
  bullet.point = new Point(7, 8);

  bullet.sendMessage('TOUCH');

  assert.deepEqual(calls.playerMessages, ['SHOT']);
  assert.deepEqual(calls.deleteTile, [{x: 7, y: 8}]);
  assert.equal(bullet.removed, true);
  assert.deepEqual(calls.adjustCounter, []);
  assert.deepEqual(calls.audio, []);
});

test('Water surrenders to bullets and throwing stars but not an ordinary Thing', () => {
  const {board} = fixture();
  const water = new things.Water(board);
  const bullet = new things.Bullet(board);
  const throwingStar = new things.ThrowingStar(board);
  const ordinaryThing = new Thing(board);

  assert.equal(water.isSurrenderable(bullet), true);
  assert.equal(water.isSurrenderable(throwingStar), true);
  assert.equal(water.isSurrenderable(ordinaryThing), undefined);
});

test('Water TOUCH displays its obstruction message and plays its splash sound', () => {
  const {board, calls} = fixture();
  const water = new things.Water(board);

  water.sendMessage('TOUCH');

  assert.deepEqual(calls.displayMessages, [{message: 'Your way is blocked by water.', priority: 1}]);
  assert.deepEqual(calls.audio, [{notation: 't+c+c', uninterruptable: undefined}]);
  assert.deepEqual(calls.deleteTile, []);
  assert.deepEqual(calls.adjustCounter, []);
});

test('Explosion BOMBED lifecycle sends one message to each tile in radius and then removes itself', () => {
  const {board, calls, tiles} = fixture();
  const explosion = new things.Explosion(board);
  explosion.point = new Point(4, 4);
  explosion.radius = 1;
  const affected = [new Point(4, 4), new Point(5, 4), new Point(4, 5)];
  const messages = new Map();
  for (const point of affected) {
    messages.set(pointKey(point), []);
    tiles.set(pointKey(point), {sendMessage(message) {
      messages.get(pointKey(point)).push(message);
    }});
  }

  explosion.doTick();

  assert.equal(explosion.timeToLive, things.Explosion.MAX_TTL - 1);
  assert.deepEqual([...messages.values()], [['BOMBED'], ['BOMBED'], ['BOMBED']]);
  assert.deepEqual(calls.deleteTile, []);

  for (let tick = 1; tick < things.Explosion.MAX_TTL; tick += 1) {
    explosion.doTick();
  }
  assert.equal(explosion.removed, true);
  assert.deepEqual(calls.deleteTile, [{x: 4, y: 4}]);
});

test('Player useTorch consumes one torch and sets the documented torch lifetime on a dark board', () => {
  const {board, calls, counters} = fixture({TORCHES: 1, TORCHLIFE: 0});
  board.dark = true;
  const player = new things.Player(board);
  player.game = board.game;

  player.useTorch();

  assert.equal(counters.TORCHES, 0);
  assert.deepEqual(calls.adjustCounter, [{counter: 'TORCHES', value: -1}]);
  assert.deepEqual(calls.setCounterValue, [{counter: 'TORCHLIFE', value: 60000}]);
  assert.equal(counters.TORCHLIFE, 60000);
});

test('River doTick pushes the conveyable tile at its position once', () => {
  const {board, tiles} = fixture();
  const river = new things.River(board);
  river.point = new Point(3, 3);
  const pushes = [];
  const tile = {
    conveyable: true,
    push(direction, pusher) {
      pushes.push({direction, pusher});
    }
  };
  tiles.set(pointKey(river.point), tile);

  river.doTick();

  assert.equal(pushes.length, 1);
  assert.equal(pushes[0].direction, Direction.North);
  assert.equal(pushes[0].pusher, river);
});
