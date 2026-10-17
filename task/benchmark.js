import { Board } from '../src/board.js';
import { Point } from '../src/basic.js';

const sizes = [10, 64, 256];
const warmupIterations = 10;
const measuredIterations = 100;

function createBoard(size, requestedThingCount) {
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

  const thingCount = requestedThingCount === undefined ? Math.min(32, Math.max(1, Math.floor(size / 8))) : requestedThingCount;
  for (let index = 0; index < thingCount; index += 1) {
    const thing = {
      type:'Fixture',
      point:new Point(index % size, Math.floor(index / size)),
      update(){},
      updateOnReverse(){return false;}
    };
    board.setTile(thing.point, thing);
  }
  board.benchmarkFixtureCount = thingCount;

  return board;
}


function createLightingBoard(size, sourceCount) {
  const board = new Board({
    name:'Lighting Benchmark',
    width:size,
    height:size,
    dark:true,
    playerX:Math.floor(size / 2),
    playerY:Math.floor(size / 2),
    tiles:Array(size * size).fill(0),
    scripts:[]
  }, {
    FPS:30,
    CYCLE_RATE:3,
    isEditor:false,
    state:1,
    context:{canvas:{width:800, height:640}},
    resources:{graphics:{
      TILE_SIZE:{x:16, y:32},
      getSprite(){return {};}
    }},
    notifyListeners(){}
  });

  board.tiles = Array(size * size).fill(undefined);
  board.player = {
    type:'Player',
    point:new Point(Math.floor(size / 2), Math.floor(size / 2))
  };

  for (let index = 0; index < sourceCount; index += 1) {
    const source = {
      type:'TorchSource',
      point:new Point(index % size, Math.floor(index / size)),
      getTorch(){return {radius:4};}
    };
    board.setTile(source.point, source);
    board.updateLightSource(source);
  }

  board.update();
  return board;
}

function benchmarkLighting(size) {
  const sourceCount = Math.min(32, Math.max(4, Math.floor(size / 4)));
  const board = createLightingBoard(size, sourceCount);
  const originalRebuild = board.rebuildLightMask;
  let rebuilds = 0;
  let lookups = 0;

  board.rebuildLightMask = function () {
    rebuilds += 1;
    return originalRebuild.call(this);
  };

  const start = performance.now();
  for (let iteration = 0; iteration < measuredIterations; iteration += 1) {
    board.update();
    for (let index = 0; index < size * size; index += 1) {
      board.isLit({x:index % size, y:Math.floor(index / size)});
      lookups += 1;
    }
  }

  const elapsed = performance.now() - start;
  return {
    size,
    sources:sourceCount,
    updates:measuredIterations,
    lightingElapsedMs:Number(elapsed.toFixed(3)),
    lightingPerUpdateMs:Number((elapsed / measuredIterations).toFixed(4)),
    lightingLookups:lookups,
    lightingMaskRebuilds:rebuilds,
    lightingGeometryCacheEntries:Object.keys(board.lightGeometryCache).length
  };
}
function benchmark(size) {
  const board = createBoard(size);
  const originalCopy = board.copyTileSnapshot;
  const originalUpdateSmartPath = board.updateSmartPath;
  const originalEachSnapshot = board.eachSnapshot;
  let tileSnapshotCopies = 0;
  let pathRebuilds = 0;
  let boardCellScans = 0;

  board.updateSmartPath = function (targetPoint) {
    pathRebuilds += 1;
    return originalUpdateSmartPath.call(this, targetPoint);
  };
  board.copyTileSnapshot = function (snapshot) {
    tileSnapshotCopies += 1;
    return originalCopy.call(this, snapshot);
  };
  board.eachSnapshot = function (callback, values, reverse) {
    boardCellScans += this.width * this.height;
    return originalEachSnapshot.call(this, callback, values, reverse);
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

    const rebuildIterations = 10;
    const rebuildStart = performance.now();
    for (let index = 0; index < rebuildIterations; index += 1) {
      board.updateSmartPath(board.player.point);
    }
    const rebuildElapsed = performance.now() - rebuildStart;
    return {
      size,
      updates:measuredIterations,
      elapsedMs:Number(elapsed.toFixed(3)),
      perUpdateMs:Number((elapsed / measuredIterations).toFixed(4)),
      forcedPathRebuilds:rebuildIterations,
      forcedPathMs:Number(rebuildElapsed.toFixed(3)),
      forcedPathPerUpdateMs:Number((rebuildElapsed / rebuildIterations).toFixed(4)),
      tileSnapshotCopies,
      pathRebuilds,
      boardCellScans,
      fixtureThings:board.benchmarkFixtureCount,
      playerBulletThings:board.playerBulletThings.length
    };
  } finally {
    board.copyTileSnapshot = originalCopy;
    board.updateSmartPath = originalUpdateSmartPath;
    board.eachSnapshot = originalEachSnapshot;
  }
}

for (const size of sizes) {
  console.log(JSON.stringify(benchmark(size)));
  console.log(JSON.stringify(benchmarkLighting(size)));
}
