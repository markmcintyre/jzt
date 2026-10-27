import test from 'node:test';
import assert from 'node:assert/strict';
import {Point} from '../src/basic.js';
import {BoardRenderer} from '../src/board-renderer.js';

const graphics = {
  TILE_SIZE:{x:8, y:8},
  getSprite(){
    return {
      drawAt(...args) {
        args[0].drawCalls.push(args.slice(1));
      }
    };
  },
  fillTileAt(context, ...args) {
    context.tileFills.push(args);
  },
  drawString(context, ...args) {
    context.textCalls.push(args);
  }
};

const game = {
  isEditor:false,
  context:{canvas:{width:32, height:32}},
  resources:{graphics}
};

test('BoardRenderer clamps the viewport and traverses visible tiles', () => {
  const board = {width:10, height:10, tiles:Array(100).fill(undefined)};
  const renderer = new BoardRenderer(board, game);
  renderer.initializeWindow();
  renderer.focusPoint = new Point(5, 5);
  renderer.updateWindowPosition();

  const seen = [];
  renderer.eachDisplayable((tile, point) => {
    seen.push([point.x, point.y, tile]);
  });

  assert.deepEqual(renderer.windowOrigin, new Point(3, 3));
  assert.deepEqual(seen.map(value => value.slice(0, 2)), [
    [3, 3], [4, 3], [5, 3], [6, 3],
    [3, 4], [4, 4], [5, 4], [6, 4],
    [3, 5], [4, 5], [5, 5], [6, 5],
    [3, 6], [4, 6], [5, 6], [6, 6]
  ]);
});

test('BoardRenderer draws tiles and custom renderables through the Canvas boundary', () => {
  const tile = {
    hidden:false,
    foreground:undefined,
    background:undefined,
    getSpriteIndex(){return 1;}
  };
  const board = {
    width:10,
    height:10,
    dark:false,
    tiles:Array(100).fill(undefined),
    isLit(){return true;},
    displayMessage:undefined
  };
  board.tiles[4 + 3 * 10] = tile;
  const renderer = new BoardRenderer(board, game);
  const context = {drawCalls:[], tileFills:[], textCalls:[], fillRect() {}};
  let customRenders = 0;

  renderer.initializeWindow();
  renderer.focusPoint = new Point(5, 5);
  renderer.updateWindowPosition();
  renderer.addCustomRenderable({render(){customRenders += 1;}});
  renderer.render(context);

  assert.equal(context.drawCalls.length, 1);
  assert.deepEqual(context.drawCalls[0].slice(0, 2), [1, 0]);
  assert.equal(customRenders, 1);
});
