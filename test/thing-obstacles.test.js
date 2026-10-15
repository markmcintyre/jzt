import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction} from '../src/basic.js';
import {Colors} from '../src/graphics.js';
import {GameState} from '../src/game-state.js';
import {setLanguage} from '../src/i18n.js';
import {Thing, things, ThingFactory} from '../src/things.js';

function fixture(initialCounters = {}) {
  const counters = {...initialCounters};
  const tiles = new Map();
  const calls = {
    deleteTile: [], replaceTile: [], moveTile: [], audio: [], oneTime: [],
    adjustCounter: [], display: [], state: [], scroll: [], playerMessages: []
  };
  const key = point => `${point.x},${point.y}`;
  const audio = {
    isPlaying: () => false,
    play: (notation, uninterruptable) => calls.audio.push({notation, uninterruptable})
  };
  const game = {
    CYCLE_RATE: 1,
    resources: {audio},
    isEditor: false,
    oneTimeMessage: message => calls.oneTime.push(message),
    adjustCounter(counter, value) {
      calls.adjustCounter.push({counter, value});
      counters[counter] = (counters[counter] || 0) + value;
    },
    setCounterValue(counter, value) {
      counters[counter] = value;
    },
    getCounterValue: counter => counters[counter] || 0,
    setState: state => calls.state.push(state),
    scroll: {
      setTitle: title => calls.scroll.push({method: 'title', value: title}),
      clearLines: () => calls.scroll.push({method: 'clear'}),
      addLine: line => calls.scroll.push({method: 'line', value: line})
    }
  };
  const board = {
    game,
    tiles,
    player: {sendMessage: message => calls.playerMessages.push(message)},
    getTile: point => tiles.get(key(point)),
    deleteTile(point) {
      calls.deleteTile.push({x: point.x, y: point.y});
      tiles.delete(key(point));
    },
    replaceTile(point, tile) {
      calls.replaceTile.push({point: {x: point.x, y: point.y}, tile});
      tile.point = point;
      tiles.set(key(point), tile);
    },
    moveTile(from, to, weak) {
      calls.moveTile.push({from: {x: from.x, y: from.y}, to: {x: to.x, y: to.y}, weak});
      const tile = tiles.get(key(from));
      if (!tile) return false;
      tiles.delete(key(from));
      tile.point = to;
      tiles.set(key(to), tile);
      return true;
    },
    setDisplayMessage: (message, priority) => calls.display.push({message, priority}),
    getMessage: keyName => ({notice: 'Localized board notice'}[keyName] || keyName),
    isFree: point => !tiles.has(key(point)),
    isOutside: () => false
  };
  return {board, game, calls, counters, tiles, key};
}

function place(board, thing, x = 2, y = 2) {
  thing.point = new Point(x, y);
  board.tiles.set(`${x},${y}`, thing);
  return thing;
}

test('BlinkWall selects vertical and horizontal orientation sprites', () => {
  const {board} = fixture();
  const wall = new things.BlinkWall(board);
  assert.equal(wall.getSpriteIndex(), 186);
  wall.horizontal = true;
  assert.equal(wall.getSpriteIndex(), 205);
  assert.deepEqual(wall.serialize(), {type: 'BlinkWall', color: '*E', horizontal: true});
});

test('Boulder pushes normally with sound and uses weak river movement', () => {
  const normal = fixture();
  const boulder = place(normal.board, new things.Boulder(normal.board));
  boulder.push(Direction.East);
  assert.deepEqual(normal.calls.moveTile[0], {from: {x: 2, y: 2}, to: {x: 3, y: 2}, weak: undefined});
  assert.deepEqual(normal.calls.audio, [{notation: 't--f', uninterruptable: false}]);

  const river = fixture();
  const riverBoulder = place(river.board, new things.Boulder(river.board));
  riverBoulder.push(Direction.South, {type: 'River'});
  assert.equal(river.calls.moveTile[0].weak, true);
  assert.deepEqual(river.calls.audio, []);
});

test('FakeWall is surrenderable and exposes editor debug sprite', () => {
  const {board} = fixture();
  const wall = new things.FakeWall(board);
  assert.equal(wall.isSurrenderable(new Thing(board)), true);
  assert.equal(wall.getSpriteIndex(), 178);
  board.game.isEditor = true;
  assert.equal(wall.getSpriteIndex(), 176);
});

test('Forest TOUCH announces, cycles its note, and deletes the forest', () => {
  const {board, calls} = fixture();
  const forest = place(board, new things.Forest(board), 4, 5);
  const oldIndex = things.Forest.noteIndex;
  things.Forest.noteIndex = 0;
  try {
    forest.sendMessage('TOUCH');
    assert.deepEqual(calls.oneTime, ['status.forest']);
    assert.deepEqual(calls.audio, [{notation: 'e', uninterruptable: undefined}]);
    assert.deepEqual(calls.deleteTile, [{x: 4, y: 5}]);
    assert.equal(things.Forest.noteIndex, 1);
    assert.equal(forest.removed, undefined);
  } finally {
    things.Forest.noteIndex = oldIndex;
  }
});

test('GeoFence allows ordinary things but blocks restricted types', () => {
  const {board} = fixture();
  const fence = new things.GeoFence(board);
  assert.equal(fence.isSurrenderable({type: 'Player'}), true);
  assert.equal(fence.isSurrenderable({type: 'Lion'}), undefined);
  assert.equal(fence.isSurrenderable({type: 'Scriptable'}), undefined);
});

test('Heart TOUCH removes itself and applies health and score rewards', () => {
  const {board, calls, counters} = fixture({HEALTH_MAX: 10, HEALTH: 4, SCORE: 20});
  const heart = place(board, new things.Heart(board), 1, 3);
  heart.sendMessage('TOUCH');
  assert.equal(heart.removed, true);
  assert.deepEqual(calls.deleteTile, [{x: 1, y: 3}]);
  assert.deepEqual(calls.audio, [{notation: 'tcefg+ceg', uninterruptable: undefined}]);
  assert.deepEqual(calls.adjustCounter, [
    {counter: 'HEALTH_MAX', value: 10},
    {counter: 'HEALTH', value: 10},
    {counter: 'SCORE', value: 500}
  ]);
  assert.deepEqual(calls.display, [{message: 'Maximum health increased by 10!', priority: undefined}]);
  assert.deepEqual(counters, {HEALTH_MAX: 20, HEALTH: 14, SCORE: 520});
});

test('InvisibleWall TOUCH replaces itself with a colored Wall', () => {
  const {board, calls} = fixture();
  const invisible = place(board, new things.InvisibleWall(board), 3, 4);
  invisible.foreground = Colors.BrightRed;
  invisible.background = Colors.Blue;
  invisible.sendMessage('TOUCH');
  const replacement = calls.replaceTile[0].tile;
  assert.ok(replacement instanceof things.Wall);
  assert.equal(replacement.foreground, Colors.BrightRed);
  assert.equal(replacement.background, Colors.Blue);
  assert.deepEqual(calls.oneTime, ['status.invisible']);
  assert.deepEqual(calls.audio, [{notation: 't--dc', uninterruptable: undefined}]);
  assert.deepEqual({x: replacement.point.x, y: replacement.point.y}, {x: 3, y: 4});
});

test('Key deserialization sanitizes non-bright colors and collection increments matching key', () => {
  const {board} = fixture();
  const grey = new things.Key(board);
  grey.deserialize({type: 'Key', color: '08'});
  assert.equal(grey.foreground, Colors.BrightWhite);
  assert.equal(grey.background, undefined);

  const collected = fixture();
  const key = place(collected.board, new things.Key(collected.board), 6, 2);
  key.sendMessage('TOUCH');
  assert.equal(collected.counters.KEY9, 1);
  assert.equal(key.removed, true);
  assert.deepEqual(collected.calls.deleteTile, [{x: 6, y: 2}]);
  assert.deepEqual(collected.calls.display, [{message: 'You now have the blue key.', priority: undefined}]);
  assert.deepEqual(collected.calls.audio, [{notation: 't+cegcegceg+sc', uninterruptable: undefined}]);
});

test('Lava damages players, messages scriptables, and shoots ordinary things', () => {
  const playerFixture = fixture();
  const lava = place(playerFixture.board, new things.Lava(playerFixture.board));
  const player = {type: 'Player', sendMessage: message => playerFixture.calls.playerMessages.push(`under:${message}`)};
  playerFixture.tiles.set('2,2', player);
  lava.cycleCount = lava.cycleRate;
  lava.updateWhileUnder();
  assert.deepEqual(playerFixture.calls.playerMessages, ['under:SHOT']);
  assert.equal(lava.cycleCount, 0);

  const scriptFixture = fixture();
  const scriptable = {type: 'Scriptable', messages: [], sendMessage(message) { this.messages.push(message); }};
  const scriptLava = place(scriptFixture.board, new things.Lava(scriptFixture.board));
  scriptFixture.board.getTile = () => scriptable;
  scriptLava.updateWhileUnder();
  assert.deepEqual(scriptable.messages, ['LAVA']);

  const ordinaryFixture = fixture();
  const ordinary = {type: 'Gem', messages: [], sendMessage(message) { this.messages.push(message); }};
  const ordinaryLava = place(ordinaryFixture.board, new things.Lava(ordinaryFixture.board));
  ordinaryFixture.board.getTile = () => ordinary;
  ordinaryLava.updateWhileUnder();
  assert.deepEqual(ordinary.messages, ['SHOT']);
});

test('Lava TOUCH sends SHOT to the board player', () => {
  const {board, calls} = fixture();
  const lava = new things.Lava(board);
  lava.sendMessage('TOUCH');
  assert.deepEqual(calls.playerMessages, ['SHOT']);
  assert.equal(lava.cycleCount, 0);
});

test('LineWall chooses its sprite from adjacent line walls', () => {
  const {board} = fixture();
  const center = place(board, new things.LineWall(board));
  place(board, new things.LineWall(board), 2, 1);
  place(board, new things.LineWall(board), 2, 3);
  assert.equal(center.getSpriteIndex(), 186);
  board.game.isEditor = true;
  board.tiles.delete('2,1');
  board.tiles.delete('2,3');
  place(board, new things.LineWall(board), 3, 2);
  assert.equal(center.getSpriteIndex(), 198);
});

test('Ricochet serialization omits mutable colors and deserialization restores its state', () => {
  const {board} = fixture();
  const ricochet = new things.Ricochet(board);
  ricochet.foreground = Colors.Red;
  ricochet.background = Colors.Blue;
  assert.deepEqual(ricochet.serialize(), {type: 'Ricochet'});
  const restored = ThingFactory.deserialize({type: 'Ricochet', color: '4F'}, board);
  assert.ok(restored instanceof things.Ricochet);
  assert.equal(restored.foreground, Colors.BrightGreen);
  assert.equal(restored.background, undefined);
});

test('Signpost TOUCH writes localized scroll lines and enters reading state', () => {
  const {board, calls} = fixture();
  const signpost = new things.Signpost(board);
  signpost.text = 'First\ni18n:notice';
  signpost.sendMessage('TOUCH');
  assert.deepEqual(calls.scroll, [
    {method: 'title', value: 'Signpost'},
    {method: 'clear'},
    {method: 'line', value: 'First'},
    {method: 'line', value: 'Localized board notice'}
  ]);
  assert.deepEqual(calls.audio, [{notation: 'tc-c+d-d+e-e+f-f+g-g', uninterruptable: undefined}]);
  assert.deepEqual(calls.state, [GameState.Reading]);
});

test('SliderEw and SliderNs gate movement to their named axes', () => {
  const ew = fixture();
  const horizontal = place(ew.board, new things.SliderEw(ew.board));
  horizontal.push(Direction.North);
  assert.equal(ew.calls.moveTile.length, 0);
  horizontal.push(Direction.West);
  assert.equal(ew.calls.moveTile.length, 1);
  assert.deepEqual(ew.calls.audio, [{notation: 't--f', uninterruptable: false}]);

  const ns = fixture();
  const vertical = place(ns.board, new things.SliderNs(ns.board));
  vertical.push(Direction.East);
  assert.equal(ns.calls.moveTile.length, 0);
  vertical.push(Direction.South);
  assert.equal(ns.calls.moveTile.length, 1);
  assert.deepEqual(ns.calls.audio, [{notation: 't--f', uninterruptable: false}]);
});

test('SolidWall and Wall retain inherited non-surrenderable obstacle behavior', () => {
  const {board} = fixture();
  for (const [ThingType, sprite] of [[things.SolidWall, 219], [things.Wall, 178]]) {
    const wall = new ThingType(board);
    assert.equal(wall.getSpriteIndex(), sprite);
    assert.equal(wall.isSurrenderable({type: 'Player'}), false);
    assert.equal(wall.push(Direction.East), undefined);
  }
});

test('Text selects the locale-specific sprite and falls back to English', () => {
  const {board} = fixture();
  const text = new things.Text(board);
  text.i18n = {en: 12, fr: 34};
  try {
    setLanguage('fr');
    assert.equal(text.getSpriteIndex(), 34);
    setLanguage('de');
    assert.equal(text.getSpriteIndex(), 12);
  } finally {
    setLanguage('en');
  }
});

test('Torch TOUCH announces, awards a torch, plays audio, and removes itself', () => {
  const {board, calls, counters} = fixture({TORCHES: 2});
  const torch = place(board, new things.Torch(board), 8, 1);
  torch.sendMessage('TOUCH');
  assert.equal(counters.TORCHES, 3);
  assert.deepEqual(calls.adjustCounter, [{counter: 'TORCHES', value: 1}]);
  assert.equal(torch.removed, true);
  assert.deepEqual(calls.audio, [{notation: 'tcase', uninterruptable: undefined}]);
  assert.deepEqual(calls.deleteTile, [{x: 8, y: 1}]);
});
