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
