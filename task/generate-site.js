const fs = require('fs');
const path = require('node:path');
const {Liquid} = require('liquidjs');
const LZString = require('lz-string');

function getWorldDetails(worldData, confirmedJson) {

  let result;

  try {
    result = JSON.parse(worldData);

    return {
      name: result.name,
      author: result.author
    }

  } catch(error) {
    if (!confirmedJson) {
      const uncompressedData = LZString.decompressFromBase64(worldData);
      return getWorldDetails(uncompressedData, true);
    }
    throw error;
  }

}

function generateSite(world) {

  const handleError = (error) => {
    if(error) {
      console.error(error);
    }
  }

  const buildDir = path.resolve(__dirname, '..', '..', 'build');
  const siteDir = path.resolve(__dirname, '..', 'src', 'site');
  const engine = new Liquid();

  const worldData = fs.readFileSync(world, 'utf8');

  engine.renderFile(path.resolve(sitedir, 'index.html.liquid'), {
    environment: 'production',
    filename: path.basename(world),
    world: getWorldDetails(worldData)
  }).then((result) => {
    const outputFile = path.resolve(buildDir, 'index.html');
    fs.writeFile(outputFile, result, handleError);
  });

  
  fs.copyFile(path.resolve(siteDir, 'script.js'), path.resolve(buildDir, 'script.js'), handleError);
  fs.copyFile(path.resolve(siteDir, 'style.css'), path.resolve(buildDir, 'style.css'), handleError);
  fs.copyFile(world, path.resolve(buildDir, path.basename(world)), handleError);

}

(function main() {

  const worldArg = process.argv.indexOf('--world');
  const worldValue = worldArg >= 0 ? process.argv[worldArg+1] : undefined;

  console.log(`WorldArg position: ${worldArg}`);
  console.log(`WorldArg Value: ${worldValue}`);

  if (!worldValue) {
    console.error('A .jzt file is required to generate a site.');
  } else {
  
    fs.stat(worldValue, (error, stats) => {
      if (error === null) {
        generateSite(worldValue);
      } else {
        console.error(`Could not open world ${worldValue}.`);
      }
    });
  
  }
})();