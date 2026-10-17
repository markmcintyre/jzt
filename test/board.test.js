import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction} from '../src/basic.js';
import {Board} from '../src/board.js';
import {JztScript} from '../src/jzt-script.js';

const data = (overrides = {}) => ({name:'Demo', width:10, height:10, dark:false, reenter:false, playerX:1, playerY:1, tiles:Array(100).fill(0), scripts:[], ...overrides});

const game = {
  FPS:60,
  context:{canvas:{width:800,height:640}},
  resources:{graphics:{TILE_SIZE:{x:8,y:8}, getSprite: () => ({})}},
  setState(){}
};

test('Board validates data, defaults dimensions and accesses boundaries', () => {
  const board = new Board(data(), game);
  assert.equal(board.width, 10); assert.equal(board.height, 10); assert.equal(board.maxPlayerBullets, Infinity);
  assert.equal(board.getTile(new Point(0, 0)), undefined); assert.equal(board.getTile(new Point(-1, 0)), undefined);
  assert.equal(board.isOutside(new Point(10, 0)), true); assert.equal(board.isFree(new Point(0, 0)), true);
  assert.throws(() => new Board({...data(), width:9}, game), e => e === 'Invalid board data.');
});

test('eachDisplayable visits only the clamped visible window', () => {
  const board = new Board(data(), game);
  board.windowOrigin = new Point(-2, 8);
  board.windowSize = new Point(4, 4);
  const seen = [];

  board.eachDisplayable((tile, point) => {
    seen.push([point.x, point.y, tile]);
  });

  assert.deepEqual(seen.map(value => value.slice(0, 2)), [[0, 8], [1, 8], [0, 9], [1, 9]]);
});

test('updatePathWeights visits active player bullets without a board scan', () => {
  const board = new Board(data(), game);
  let calls = 0;
  const influencer = {
    type:'Bullet',
    fromPlayer:true,
    influenceSmartPath(){calls += 1;}
  };

  board.setTile(new Point(2, 3), influencer);
  board.updatePathWeights();

  assert.equal(calls, 1);
});

test('smart paths are reused until the target or topology changes', () => {
  const board = new Board(data(), game);
  board.player = {type:'Player', point:new Point(5, 5)};

  board.updateSmartPath(board.player.point);
  board.smartPath[0] = 1234;
  board.update();
  assert.equal(board.smartPath[0], 1234);

  board.player.point = new Point(6, 5);
  board.update();
  assert.equal(board.getSmartValue(new Point(6, 5)), 0);
});

test('blocking tile mutations invalidate smart paths', () => {
  const board = new Board(data(), game);
  board.player = {type:'Player', point:new Point(5, 5)};

  board.updateSmartPath(board.player.point);
  assert.equal(board.getSmartValue(new Point(4, 5)), 1);

  board.setTile(new Point(4, 5), {type:'Wall'});
  board.update();

  assert.equal(board.getSmartValue(new Point(4, 5)), Infinity);
});

test('player bullet path influence is reapplied and removed with the bullet', () => {
  const board = new Board(data(), game);
  board.player = {type:'Player', point:new Point(5, 5)};
  const bullet = {
    type:'Bullet',
    fromPlayer:true,
    influenceSmartPath(){
      board.adjustSmartPathWeight(new Point(4, 5), 100);
    }
  };

  board.setTile(new Point(3, 5), bullet);
  board.updateSmartPath(board.player.point);
  assert.equal(board.getSmartValue(new Point(4, 5)), 101);

  board.deleteTile(new Point(3, 5));
  board.update();
  assert.equal(board.getSmartValue(new Point(4, 5)), 1);
});

test('Board updates east-moving convoys from the leading edge', () => {
  const board = new Board(data(), {...game, CYCLE_RATE:1});
  board.player = {type:'Player', point:new Point(5, 5)};
  const calls = [];
  const leading = {
    type:'Mover',
    updateOnReverse(){return true;},
    update(){
      calls.push(this.point.x);
      board.moveTile(this.point, this.point.add(Direction.East), true);
    }
  };
  const trailing = {
    type:'Mover',
    updateOnReverse(){return true;},
    update(){
      calls.push(this.point.x);
      board.moveTile(this.point, this.point.add(Direction.East), true);
    }
  };

  board.setTile(new Point(1, 1), trailing);
  board.setTile(new Point(2, 1), leading);
  board.update();

  assert.deepEqual(calls, [2, 1]);
  assert.equal(board.getTile(new Point(2, 1)), trailing);
  assert.equal(board.getTile(new Point(3, 1)), leading);
});

test('Board updates west-moving convoys from the leading edge', () => {
  const board = new Board(data(), {...game, CYCLE_RATE:1});
  board.player = {type:'Player', point:new Point(5, 5)};
  const calls = [];
  const leading = {
    type:'Mover',
    updateOnReverse(){return false;},
    update(){
      calls.push(this.point.x);
      board.moveTile(this.point, this.point.add(Direction.West), true);
    }
  };
  const trailing = {
    type:'Mover',
    updateOnReverse(){return false;},
    update(){
      calls.push(this.point.x);
      board.moveTile(this.point, this.point.add(Direction.West), true);
    }
  };

  board.setTile(new Point(2, 1), leading);
  board.setTile(new Point(3, 1), trailing);
  board.update();

  assert.deepEqual(calls, [2, 3]);
  assert.equal(board.getTile(new Point(1, 1)), leading);
  assert.equal(board.getTile(new Point(2, 1)), trailing);
});

test('Board serializes and moves an unblocked tile within bounds', () => {
  const board = new Board(data(), game);
  const tile = {point:new Point(1,1), type:'Fixture', serialize(){return {type:'Fixture'};}};
  board.setTile(tile.point, tile);
  assert.equal(board.moveTile(new Point(1,1), new Point(2,1)), true);
  assert.equal(board.getTile(new Point(1,1)), undefined); assert.equal(board.getTile(new Point(2,1)), tile);
  assert.equal(board.moveTile(new Point(2,1), new Point(10,1)), false);
  const saved = board.serialize(); assert.equal(saved.width, 10); assert.equal(saved.tiles[2 + 1 * 10].type, 'Fixture');
});

test('initializePlayer preserves the underlying tile and only enters Scriptables at runtime', () => {
  const underlying = {type:'Floor', serialize(){return {type:'Floor'};}};
  const scriptable = {type:'Scriptable', name:'door', messages:[], sendMessage(message){this.messages.push(message);}};
  const player = {type:'Avatar', point:new Point(2, 2), getTorch(){return undefined;}};
  const board = new Board(data(), game);
  board.setTile(underlying.point = new Point(2, 2), underlying);
  board.setTile(new Point(3, 2), scriptable);

  board.initializePlayer(player);
  assert.equal(player.under, underlying);
  assert.equal(board.getTile(new Point(2, 2)), player);
  assert.deepEqual(scriptable.messages, ['ENTER']);

  const editorGame = {...game, isEditor:true};
  const editorBoard = new Board(data(), editorGame);
  const editorUnderlying = {type:'Floor', serialize(){return {type:'Floor'};}};
  const editorScriptable = {type:'Scriptable', name:'door', messages:[], sendMessage(message){this.messages.push(message);}};
  editorBoard.setTile(new Point(2, 2), editorUnderlying);
  editorBoard.setTile(new Point(3, 2), editorScriptable);
  const editorPlayer = {type:'Avatar', point:new Point(2, 2), getTorch(){return undefined;}};
  editorBoard.initializePlayer(editorPlayer);
  assert.equal(editorPlayer.under, editorUnderlying);
  assert.deepEqual(editorScriptable.messages, []);
});

test('Board serialization preserves navigation, entry point, filtered i18n, and script representations', () => {
  const scriptData = {name:'demo', rawScript:': start\nEND'};
  const runtime = new Board(data({
    north:'North', east:'East', south:'South', west:'West',
    northOffset:3, eastOffset:-2, southOffset:5, westOffset:-6,
    i18n:{en:{hello:'Hello', number:42}, english:{ignored:'yes'}, fr:{bye:'Au revoir'}},
    entryPointX:7, entryPointY:8,
    scripts:[scriptData]
  }), game);
  const runtimeSaved = runtime.serialize();
  assert.equal(runtimeSaved.north, 'North');
  assert.equal(runtimeSaved.east, 'East');
  assert.equal(runtimeSaved.south, 'South');
  assert.equal(runtimeSaved.west, 'West');
  assert.equal(runtimeSaved.northOffset, 3);
  assert.equal(runtimeSaved.eastOffset, -2);
  assert.equal(runtimeSaved.southOffset, 5);
  assert.equal(runtimeSaved.westOffset, -6);
  assert.equal(runtimeSaved.entryPointX, 7);
  assert.equal(runtimeSaved.entryPointY, 8);
  assert.deepEqual(runtimeSaved.i18n, {en:{hello:'Hello'}, fr:{bye:'Au revoir'}});
  assert.deepEqual(runtimeSaved.scripts, [scriptData]);
  assert.ok(runtime.scripts[0] instanceof JztScript);

  const editor = new Board(data({...data(), scripts:[{name:'draft', rawScript:': label\nEND', compiled:'discarded'}]}), {...game, isEditor:true});
  const editorSaved = editor.serialize();
  assert.deepEqual(editorSaved.scripts, [{name:'draft', rawScript:': label\nEND'}]);
  assert.equal(editor.scripts[0].compiled, 'discarded');
});

test('moveTile surrenders an occupied destination but rejects a non-surrenderable obstacle', () => {
  const board = new Board(data(), game);
  const mover = {type:'Mover', under:undefined, isSurrenderable(){return false;}};
  const surrenderable = {type:'Surrenderable', under:undefined, isSurrenderable(){return true;}, push(){return false;}};
  board.setTile(new Point(1, 1), mover);
  board.setTile(new Point(2, 1), surrenderable);
  assert.equal(board.moveTile(new Point(1, 1), new Point(2, 1)), true);
  assert.equal(board.getTile(new Point(2, 1)), mover);
  assert.equal(mover.under, surrenderable);
  assert.equal(board.getTile(new Point(1, 1)), undefined);

  const blocker = {type:'Blocker', under:undefined, isSurrenderable(){return false;}, push(){return false;}};
  board.setTile(new Point(3, 1), blocker);
  assert.equal(board.moveTile(new Point(2, 1), new Point(3, 1)), false);
  assert.equal(board.getTile(new Point(2, 1)), mover);
  assert.equal(board.getTile(new Point(3, 1)), blocker);
});

test('dark-board lighting keeps current and previous masks for moved sources', () => {
  const board = new Board(data({...data(), dark:true}), game);
  let radius = 1;
  const source = {
    type:'TorchSource',
    point:new Point(4, 4),
    getTorch(){return radius > 0 ? {radius} : undefined;}
  };

  board.player = {point:new Point(1, 1)};
  board.setTile(source.point, source);
  board.updateLightSource(source);
  board.update();

  assert.equal(board.isLit(new Point(4, 4)), true);
  assert.equal(board.isLit(new Point(0, 0)), false);

  board.moveTile(source.point, new Point(7, 7));
  board.update();

  assert.equal(board.isLit(new Point(7, 7)), true);
  assert.equal(board.isLit(new Point(4, 4)), false);
  assert.equal(board.isLit(new Point(4, 4), undefined, true), true);

  radius = 2;
  board.update();
  assert.equal(board.isLit(new Point(5, 7)), true);

  board.deleteTile(source.point);
  board.update();
  assert.equal(board.isLit(new Point(7, 7)), false);
});

test('player bullet collection tracks movement, removal, and stale membership', () => {
  const board = new Board(data(), game);
  const bullet = {
    type:'Bullet',
    fromPlayer:true,
    point:new Point(3, 1)
  };

  board.setTile(bullet.point, bullet);
  assert.deepEqual(board.playerBulletThings, [bullet]);
  assert.equal(board.assertCollectionConsistency(), true);

  board.moveTile(bullet.point, new Point(4, 1));
  assert.deepEqual(board.playerBulletThings, [bullet]);
  assert.equal(board.assertCollectionConsistency(), true);

  board.deleteTile(bullet.point);
  assert.deepEqual(board.playerBulletThings, []);
  assert.equal(board.assertCollectionConsistency(), true);

  board.playerBulletThings.push(bullet);
  assert.throws(() => board.assertCollectionConsistency(), /playerBulletThings collection is stale/);

  const debugBoard = new Board(data(), {...game, debugCollections:true});
  debugBoard.player = {point:new Point(1, 1)};
  assert.doesNotThrow(() => debugBoard.update());
});

test('rare custom renderers are tracked without an update-time render set', () => {
  const calls = [];
  const renderGame = {
    ...game,
    isEditor:true,
    context:{canvas:{width:80,height:80}},
    resources:{
      graphics:{
        TILE_SIZE:{x:8,y:8},
        getSprite:() => ({drawAt(){}})
      }
    }
  };
  const board = new Board(data(), renderGame);
  const custom = {
    type:'CustomRenderer',
    point:new Point(2, 2),
    getSpriteIndex(){return 0;},
    render(){calls.push('render');}
  };
  const context = {fillRect(){}};

  board.setTile(custom.point, custom);
  assert.equal(board.customRenderCount, 1);
  board.render(context);
  assert.deepEqual(calls, ['render']);

  board.deleteTile(custom.point);
  assert.equal(board.customRenderCount, 0);
  board.render(context);
  assert.deepEqual(calls, ['render']);
});
