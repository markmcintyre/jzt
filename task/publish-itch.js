const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {packageSite} = require('./package-itch');

const repositoryRoot = path.resolve(__dirname, '..');
const defaultOutputDirectory = path.join(repositoryRoot, 'build');
const channel = 'html5';

function parseArguments(argumentsList) {
  const options = {};

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--world' || argument === '--target' || argument === '--output' || argument === '--version') {
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
  if (!options.target) {
    throw new Error('An itch target is required. Use --target <user/game>.');
  }
  if (!/^\S+\/\S+$/.test(options.target) || options.target.includes(':')) {
    throw new Error('The itch target must have the form <user/game>.');
  }

  return {
    worldPath: path.resolve(process.cwd(), options.world),
    target: options.target,
    outputDirectory: path.resolve(process.cwd(), options.output || defaultOutputDirectory),
    version: options.version
  };
}

function requireButler() {
  try {
    execFileSync('butler', ['--version'], {stdio: 'ignore'});
  } catch (error) {
    throw new Error('Butler is required. Install it from https://itch.io/docs/butler/ and run "butler login" first.');
  }
}

function publishSite(worldPath, target, outputDirectory, version) {
  requireButler();
  packageSite(worldPath, outputDirectory);

  const butlerArguments = ['push', outputDirectory, `${target}:${channel}`];
  if (version) {
    butlerArguments.push('--userversion', version);
  }

  execFileSync('butler', butlerArguments, {
    cwd: repositoryRoot,
    stdio: 'inherit'
  });
}

function main() {
  const {worldPath, target, outputDirectory, version} = parseArguments(process.argv.slice(2));
  publishSite(worldPath, target, outputDirectory, version);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {channel, parseArguments, publishSite, requireButler};
