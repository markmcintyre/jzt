const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const defaultOutputDirectory = path.join(repositoryRoot, 'build');

function parseArguments(argumentsList) {
  const options = {};

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--world' || argument === '--output') {
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

  return {
    worldPath: path.resolve(process.cwd(), options.world),
    outputDirectory: path.resolve(process.cwd(), options.output || defaultOutputDirectory)
  };
}

function isInside(parentPath, childPath) {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function runNpmScript(scriptName) {
  execFileSync('npm', ['run', scriptName], {
    cwd: repositoryRoot,
    stdio: 'inherit'
  });
}

function packageSite(worldPath, outputDirectory) {
  if (!fs.existsSync(worldPath)) {
    throw new Error(`Could not open world ${worldPath}.`);
  }

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'jzt-world-'));
  let stagedWorldPath = worldPath;
 
  try {
    if (isInside(outputDirectory, worldPath)) {
      stagedWorldPath = path.join(temporaryDirectory, path.basename(worldPath));
      fs.copyFileSync(worldPath, stagedWorldPath);
    }

    if (outputDirectory !== defaultOutputDirectory) {
      fs.rmSync(outputDirectory, {recursive: true, force: true});
      fs.mkdirSync(outputDirectory, {recursive: true});
    }

    runNpmScript('prebuild');
    runNpmScript('build:game');
    execFileSync(process.execPath, [
      path.join(repositoryRoot, 'task', 'generate-site.js'),
      '--world',
      stagedWorldPath,
      '--output',
      outputDirectory
    ], {cwd: repositoryRoot, stdio: 'inherit'});
    runNpmScript('postbuild');

    const outputEntries = fs.readdirSync(outputDirectory);
    const archiveBase = path.basename(worldPath).replace(/\.[^.]+$/, '') || 'jzt-world';
    const safeArchiveBase = archiveBase.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'jzt-world';
    const archivePath = path.join('/tmp', `${safeArchiveBase}-html5.zip`);
    fs.rmSync(archivePath, {force: true});
    execFileSync('zip', ['-qr', archivePath, ...outputEntries], {
      cwd: outputDirectory,
      stdio: 'inherit'
    });

    console.log(`Created ${archivePath}.`);
    return archivePath;
  } finally {
    fs.rmSync(temporaryDirectory, {recursive: true, force: true});
  }
}

function main() {
  const {worldPath, outputDirectory} = parseArguments(process.argv.slice(2));
  packageSite(worldPath, outputDirectory);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {isInside, packageSite, parseArguments};
