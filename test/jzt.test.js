import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/jzt.js';
import {GameState} from '../src/game-state.js';
import {Point} from '../src/basic.js';
import {Board} from '../src/board.js';

function createPlayingGame() {
  const timings = [];
  const game = {
    SIMULATION_STEP:1000 / 30,
    state:GameState.Playing,
    resources:{graphics:{update(){}}},
    currentBoard:{
      update(delta){timings.push(['board', delta]);},
      focusPoint:undefined
    },
    checkCounters(delta){timings.push(['counters', delta]);},
    player:{point:{x:1, y:1}, update(){}},
    keyboard:{isPressed(){return false;}},
    adjustCounter(counter, delta){timings.push([counter, delta]);}
  };

  return {game, timings};
}

test('Game.update advances gameplay by one fixed step after a delayed frame', () => {
  const {game, timings} = createPlayingGame();
  const fixedStep = game.SIMULATION_STEP;

  Game.prototype.update.call(game, 500);

  assert.deepEqual(timings, [
    ['board', fixedStep],
    ['counters', fixedStep],
    ['<PLAYTIME>', fixedStep]
  ]);
});

test('Game.update uses the fixed step while reading', () => {
  const {game, timings} = createPlayingGame();
  game.state = GameState.Reading;
  game.scroll = {update(){}};

  Game.prototype.update.call(game, 500);

  assert.deepEqual(timings, [['<PLAYTIME>', game.SIMULATION_STEP]]);
});

test('Game.loop performs one fixed update after a wall-clock stall', () => {
  const {game, timings} = createPlayingGame();
  const originalDateNow = Date.now;
  const originalAnimationFrame = globalThis.requestAnimationFrame;

  game.FPS_INTERVAL = game.SIMULATION_STEP;
  game.then = 0;
  game.boundLoop = () => {};
  game.update = Game.prototype.update.bind(game);
  game.draw = () => {};
  game.catestrophicError = error => { throw error; };

  Date.now = () => 500;
  globalThis.requestAnimationFrame = () => 1;

  try {
    Game.prototype.loop.call(game);
  } finally {
    Date.now = originalDateNow;
    if (originalAnimationFrame === undefined) {
      delete globalThis.requestAnimationFrame;
    } else {
      globalThis.requestAnimationFrame = originalAnimationFrame;
    }
  }

  assert.deepEqual(timings, [
    ['board', game.SIMULATION_STEP],
    ['counters', game.SIMULATION_STEP],
    ['<PLAYTIME>', game.SIMULATION_STEP]
  ]);
});

test('Game.update advances a real Board loaded from serialized world data', () => {
  let playerUpdates = 0;
  const boardGame = {
    FPS:30,
    isEditor:false,
    context:{canvas:{width:800, height:640}},
    resources:{graphics:{TILE_SIZE:{x:8, y:8}, getSprite(){return {};}}},
    notifyListeners() {}
  };
  const board = new Board({
    name:'Integration',
    width:10,
    height:10,
    playerX:5,
    playerY:5,
    tiles:Array(100).fill(0),
    scripts:[]
  }, boardGame);
  const player = {
    point:new Point(5, 5),
    update(){playerUpdates += 1;}
  };
  board.player = player;
  const game = {
    SIMULATION_STEP:1000 / 30,
    state:GameState.Playing,
    resources:{graphics:{update(){}}, audio:{play(){}}},
    currentBoard:board,
    player,
    keyboard:{isPressed(){return false;}},
    checkCounters(){},
    adjustCounter(){}
  };

  Game.prototype.update.call(game);

  assert.equal(playerUpdates, 1);
  assert.equal(board.getSmartValue(player.point), 0);
  assert.strictEqual(board.focusPoint, player.point);
});
