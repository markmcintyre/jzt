const fs = require('node:fs/promises');
const path = require('node:path');
const {Liquid} = require('liquidjs');
const LZString = require('lz-string');

const repositoryRoot = path.resolve(__dirname, '..');
const defaultOutputDirectory = path.resolve(__dirname, '..', 'build');
const siteDir = path.resolve(__dirname, '..', 'src', 'site');

function parseArguments(argumentsList) {
  const options = {};

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--world' || argument === '--output' || argument === '--template') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument !== '--') {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.world) {
    throw new Error('A world file is required. Use --world <path>.');
  }
  const templateName = options.template || 'index';
  if (!['index', 'itch'].includes(templateName)) {
    throw new Error(`Unknown site template "${templateName}". Use "index" or "itch".`);
  }

  return {
    worldPath: path.resolve(process.cwd(), options.world),
    outputDirectory: path.resolve(process.cwd(), options.output || defaultOutputDirectory),
    templateName
  };
}

function parseWorld(worldData, worldPath) {
  const jsonText = Buffer.isBuffer(worldData) ? worldData.toString('utf8') : worldData;
  let world;

  try {
    world = JSON.parse(jsonText);
  } catch (jsonError) {
    let decompressed;
    if (Buffer.isBuffer(worldData)) {
      decompressed = LZString.decompressFromUint8Array(new Uint8Array(worldData));
    }
    if (!decompressed) {
      decompressed = LZString.decompressFromBase64(jsonText.trim());
    }
    if (!decompressed) {
      throw new Error(`World "${worldPath}" is not valid JSON or compressed JZT data.`);
    }
    try {
      world = JSON.parse(decompressed);
    } catch (decompressedJsonError) {
      throw new Error(`World "${worldPath}" is not valid JSON or compressed JZT data.`);
    }
  }

  if (!world || typeof world !== 'object' || Array.isArray(world)) {
    throw new Error(`World "${worldPath}" must contain a JSON object.`);
  }
  if (world.version !== '1.0.0') {
    throw new Error(`World "${worldPath}" has incompatible version "${world.version || 'missing'}"; expected 1.0.0.`);
  }
  for (const field of ['name', 'author']) {
    if (typeof world[field] !== 'string' || world[field].trim() === '') {
      throw new Error(`World "${worldPath}" is missing required metadata field "${field}".`);
    }
  }

  return world;
}

async function generateSite(worldPath, outputDirectory = defaultOutputDirectory, templateName = 'index') {
  const worldData = await fs.readFile(worldPath);
  const world = parseWorld(worldData, worldPath);


  const filename = path.basename(worldPath);
  const outputFile = path.join(outputDirectory, filename);
  const engine = new Liquid({root: siteDir});

  await fs.mkdir(outputDirectory, {recursive: true});
  const renderedPage = await engine.renderFile(path.join(siteDir, `${templateName}.html.liquid`), {
    environment: 'production',
    filename,
    world
  });

  await Promise.all([
    fs.writeFile(path.join(outputDirectory, 'index.html'), renderedPage),
    fs.copyFile(path.join(siteDir, 'script.js'), path.join(outputDirectory, 'script.js')),
    fs.copyFile(path.join(siteDir, 'style.css'), path.join(outputDirectory, 'style.css')),
    fs.writeFile(outputFile, JSON.stringify(world)),
    fs.copyFile(path.join(repositoryRoot, 'license.md'), path.join(outputDirectory, 'license.md'))
  ]);

  const runtimeSource = path.join(defaultOutputDirectory, 'jzt.min.js');
  if (path.resolve(runtimeSource) !== path.resolve(path.join(outputDirectory, 'jzt.min.js'))) {
    await fs.copyFile(runtimeSource, path.join(outputDirectory, 'jzt.min.js'));
  }

  return {filename, name: world.name, author: world.author};
}

async function main() {
  const {worldPath, outputDirectory, templateName} = parseArguments(process.argv.slice(2));
  await generateSite(worldPath, outputDirectory, templateName);
  console.log(`Generated player site in ${outputDirectory}.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {generateSite, parseArguments, parseWorld};