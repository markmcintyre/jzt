import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction} from '../src/basic.js';
import {Colors} from '../src/graphics.js';
import {things} from '../src/things.js';

function key(point) {
  return `${point.x},${point.y}`;
}

function fixture({width = 9, height = 9, counters = {}} = {}) {
  const tiles = new Map();
  const calls = {audio: [], deletes: [], adds: [], moves: [], playerMessages: [], counters: []};
  const values = {...counters};
  const game = {
    state: 'playing',
    CYCLE_RATE: 1,
    isEditor: false,
    resources: {
      audio: {
        isPlaying: () => false,
        play(notation, uninterruptable) {
          calls.audio.push({notation, uninterruptable});
        }
      }
    },
    adjustCounter(name, value) {
      values[name] = (values[name] || 0) + value;
      calls.counters.push({name, value});
    },
    getCounterValue(name) {
      return values[name] || 0;
    },
    setCounterValue(name, value) {
      values[name] = value;
    },
    oneTimeMessage() {}
  };
  const board = {
    game,
    tiles,
    calls,
    player: {type: 'Player', point: new Point(5, 1), sendMessage(message) {
      calls.playerMessages.push(message);
    }},
    isOutside(point) {
      return point.x < 0 || point.y < 0 || point.x >= width || point.y >= height;
    },
    getTile(point) {
      return tiles.get(key(point));
    },
    isFree(point) {
      return !this.isOutside(point) && !tiles.has(key(point));
    },
    isFreeOrSurrenderable(point) {
      if (this.isOutside(point)) return false;
      const tile = this.getTile(point);
      return !tile || tile.isSurrenderable();
    },
    addThing(point, thing) {
      thing.board = this;
      thing.point = point.clone();
      tiles.set(key(point), thing);
      calls.adds.push({point: point.clone(), thing});
    },
    deleteTile(point) {
      tiles.delete(key(point));
      calls.deletes.push(point.clone());
    },
    replaceTile(point, thing) {
      this.addThing(point, thing);
    },
    moveTile(from, to) {
      calls.moves.push({from: from.clone(), to: to.clone()});
      if (this.isOutside(to)) return false;
      const thing = tiles.get(key(from));
      if (!thing) return false;
      const obstacle = tiles.get(key(to));
      if (obstacle && !obstacle.isSurrenderable(thing)) return false;
      if (obstacle) thing.under = obstacle;
      tiles.delete(key(from));
      tiles.set(key(to), thing);
      thing.point = to.clone();
      return true;
    },
    getSmartDirection() {
      return this.smartDirection;
    },
    setDisplayMessage() {}
  };
  return {board, calls, values, tiles};
}

function place(board, point, thing) {
  board.addThing(point, thing);
  return thing;
}

function withRandom(values, callback) {
  const original = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)];
  try {
    return callback();
  } finally {
    Math.random = original;
  }
}

test('Bear attacks on TOUCH and awards score/removes on SHOT', () => {
  const {board, calls, values} = fixture({counters: {SCORE: 4}});
  const bear = place(board, new Point(1, 1), new things.Bear(board));
  bear.sendMessage('TOUCH');
  assert.deepEqual(calls.playerMessages, ['SHOT']);
  assert.equal(bear.removed, true);

  const second = place(board, new Point(2, 1), new things.Bear(board));
  second.sendMessage('SHOT');
  assert.equal(values.SCORE, 14);
  assert.equal(second.removed, true);
});

test('Blinker toggles state and creates then removes its blink wall', () => {
  const {board, tiles} = fixture();
  const blinker = place(board, new Point(3, 3), new things.Blinker(board));
  blinker.direction = Direction.North;
  blinker.period = 1;
  blinker.doTick();
  assert.equal(blinker.blinkState, true);
  assert.equal(board.getTile(new Point(3, 2)).type, 'BlinkWall');
  blinker.doTick();
  assert.equal(blinker.blinkState, false);
  assert.equal(tiles.has(key(new Point(3, 2))), false);
});

test('Centipede links an adjacent unlinked segment', () => {
  const {board} = fixture();
  const head = place(board, new Point(3, 3), new things.Centipede(board));
  const segment = place(board, new Point(4, 3), new things.Centipede(board));
  head.head = true;
  head.linkSegments();
  assert.equal(head.follower, segment);
  assert.equal(segment.leader, head);
  assert.equal(segment.linked, true);
  assert.equal(head.orientation, Direction.West);
});

test('Conveyor pushes a conveyable tile and leaves it blocked when the path is obstructed', () => {
  const first = fixture();
  const conveyor = place(first.board, new Point(1, 1), new things.Conveyor(first.board));
  const item = new things.Bear(first.board);
  place(first.board, new Point(0, 0), item);
  conveyor.doTick();
  assert.equal(item.point.equals(new Point(1, 0)), true);
  assert.equal(first.board.getTile(new Point(1, 0)), item);

  const second = fixture();
  const blockedConveyor = place(second.board, new Point(1, 1), new things.Conveyor(second.board));
  const blockedItem = place(second.board, new Point(0, 0), new things.Bear(second.board));
  place(second.board, new Point(1, 0), new things.SolidWall(second.board));
  blockedConveyor.doTick();
  assert.equal(blockedItem.point.equals(new Point(0, 0)), true);
  assert.equal(second.board.getTile(new Point(1, 0)).type, 'SolidWall');
});

test('Duplicator clones its source at the threshold when the target is free and fails when blocked', () => {
  const success = fixture();
  const duplicator = place(success.board, new Point(2, 2), new things.Duplicator(success.board));
  place(success.board, new Point(3, 2), new things.SolidWall(success.board));
  duplicator.currentStep = duplicator.MAX_STEPS - 1;
  duplicator.doTick();
  const clone = success.board.getTile(new Point(1, 2));
  assert.ok(clone instanceof things.SolidWall);
  assert.notEqual(clone, success.board.getTile(new Point(3, 2)));

  const failure = fixture();
  const blocked = place(failure.board, new Point(2, 2), new things.Duplicator(failure.board));
  place(failure.board, new Point(3, 2), new things.SolidWall(failure.board));
  const target = place(failure.board, new Point(1, 2), new things.SolidWall(failure.board));
  blocked.currentStep = blocked.MAX_STEPS - 1;
  blocked.doTick();
  assert.equal(failure.board.getTile(new Point(1, 2)), target);
});

test('Lion TOUCH sends a player attack and SHOT advances score before removal', () => {
  const {board, calls, values} = fixture({counters: {SCORE: 2}});
  const lion = place(board, new Point(1, 1), new things.Lion(board));
  lion.sendMessage('TOUCH');
  assert.deepEqual(calls.playerMessages, ['SHOT']);
  assert.equal(lion.removed, true);
  const second = place(board, new Point(2, 1), new things.Lion(board));
  second.sendMessage('SHOT');
  assert.equal(values.SCORE, 12);
  assert.equal(second.removed, true);
});

test('Pusher tick moves in its configured direction', () => {
  const {board, calls} = fixture();
  const pusher = place(board, new Point(2, 2), new things.Pusher(board));
  pusher.orientation = Direction.East;
  pusher.doTick();
  assert.equal(pusher.point.equals(new Point(3, 2)), true);
  assert.deepEqual(calls.audio, [{notation: 't--f', uninterruptable: false}]);
});

test('Ruffian starts a burst and tracks its remaining movement time', () => {
  const {board} = fixture();
  board.player.point = new Point(5, 1);
  const ruffian = place(board, new Point(1, 1), new things.Ruffian(board));
  ruffian.timeLeft = 1;
  ruffian.moving = false;
  ruffian.intelligence = 10;
  withRandom([0, 0.4], () => ruffian.doTick());
  assert.equal(ruffian.moving, true);
  assert.equal(ruffian.orientation, Direction.East);
  assert.equal(ruffian.timeLeft, 4);
  assert.equal(ruffian.point.equals(new Point(2, 1)), true);
});

test('Snake follows the board smart path and changes to its seeking color', () => {
  const {board} = fixture();
  board.smartDirection = Direction.East;
  const snake = place(board, new Point(1, 1), new things.Snake(board));
  snake.doTick();
  assert.equal(snake.point.equals(new Point(2, 1)), true);
  assert.equal(snake.foreground, Colors.BrightGreen);
});

test('Spider moves only onto an adjacent SpiderWeb', () => {
  const {board} = fixture();
  const spider = place(board, new Point(2, 2), new things.Spider(board));
  place(board, new Point(3, 2), new things.SpiderWeb(board));
  spider.seekPlayer = () => false;
  spider.doTick();
  assert.equal(spider.point.equals(new Point(3, 2)), true);
  assert.equal(board.getTile(new Point(3, 2)), spider);
});

test('SpiderWeb maps adjacency to a connected sprite and is surrenderable', () => {
  const {board} = fixture();
  const web = place(board, new Point(2, 2), new things.SpiderWeb(board));
  place(board, new Point(3, 2), new things.SpiderWeb(board));
  assert.equal(web.getSpriteIndex(), 196);
  assert.equal(web.isSurrenderable(), true);
});

test('SpinningGun advances its animation and deterministically shoots toward an aligned player', () => {
  const {board} = fixture();
  board.player.point = new Point(4, 2);
  const gun = withRandom([0], () => new things.SpinningGun(board));
  place(board, new Point(2, 2), gun);
  gun.animationIndex = 0;
  withRandom([0, 0], () => gun.doTick());
  assert.equal(gun.spriteIndex, 26);
  const bullet = board.getTile(new Point(3, 2));
  assert.ok(bullet instanceof things.Bullet);
  assert.equal(bullet.direction, Direction.East);
});

test('Tiger SHOT increments score and removes the tiger', () => {
  const {board, values} = fixture({counters: {SCORE: 9}});
  const tiger = place(board, new Point(2, 2), new things.Tiger(board));
  tiger.sendMessage('SHOT');
  assert.equal(values.SCORE, 19);
  assert.equal(tiger.removed, true);
});

test('ThrowingStar expires at zero lifetime and is removed', () => {
  const {board, calls} = fixture();
  const star = withRandom([0], () => new things.ThrowingStar(board));
  place(board, new Point(2, 2), star);
  star.timeToLive = 1;
  star.doTick();
  assert.equal(star.removed, true);
  assert.deepEqual(calls.deletes.map((point) => pointValue(point)), [{x: 2, y: 2}]);
});

function pointValue(point) {
  return {x: point.x, y: point.y};
}
