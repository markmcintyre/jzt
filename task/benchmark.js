import { Board } from '../src/board.js';
import { Point } from '../src/basic.js';

const sizes = [10, 64, 256];
const warmupIterations = 10;
const measuredIterations = 100;

function createBoard(size) {
  const graphics = {
    TILE_SIZE: {x:16, y:32},
    getSprite() {
      return {};
    }
  };
  const game = {
    FPS:30,
    CYCLE_RATE:3,
    isEditor:true,
    state:1,
    context:{canvas:{width:800, height:640}},
    resources:{graphics},
    notifyListeners() {}
  };
  const board = new Board({
    name:'Benchmark',
    width:size,
    height:size,
    playerX:Math.floor(size / 2),
    playerY:Math.floor(size / 2),
    tiles:Array(size * size).fill(0),
    scripts:[]
  }, game);

  board.tiles = Array(size * size).fill(undefined);
  board.player = {
    type:'Player',
    point:new Point(Math.floor(size / 2), Math.floor(size / 2))
  };

  return board;
}

function benchmark(size) {
  const board = createBoard(size);
  const originalSlice = Array.prototype.slice;
  const originalCopy = board.copyTileSnapshot;
  let sliceCalls = 0;
  let snapshotCopies = 0;

  Array.prototype.slice = function (...args) {
    if (this === board.tiles) {
      sliceCalls += 1;
    }
    return originalSlice.apply(this, args);
  };
  board.copyTileSnapshot = function (snapshot) {
    snapshotCopies += 1;
    return originalCopy.call(this, snapshot);
  };

  try {
    for (let index = 0; index < warmupIterations; index += 1) {
      board.update();
    }
    if (global.gc) {
      global.gc();
    }

    const start = performance.now();
    for (let index = 0; index < measuredIterations; index += 1) {
      board.update();
    }
    const elapsed = performance.now() - start;

    return {
      size,
      updates:measuredIterations,
      elapsedMs:Number(elapsed.toFixed(3)),
      perUpdateMs:Number((elapsed / measuredIterations).toFixed(4)),
      snapshotCopies,
      tileSliceCalls:sliceCalls
    };
  } finally {
    Array.prototype.slice = originalSlice;
    board.copyTileSnapshot = originalCopy;
  }
}

for (const size of sizes) {
  console.log(JSON.stringify(benchmark(size)));
}
