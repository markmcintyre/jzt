import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const entryDefinitions = {
  game: {entry: 'src/jzt.js', output: 'build/jzt.min.js', globalName: 'jzt'},
  editor: {entry: 'src/ux/ux-editor.js', output: 'build/jzt-editor.min.js', globalName: 'jztEditor'},
  player: {entry: 'src/ux/ux-editor-play.js', output: 'build/jzt-editor-play.min.js', globalName: 'jztPlayer'},
  dev: {entry: 'src/site/dev.js', output: 'build/dev.js'}
};

function banner() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    '/*',
    ' * JZT — A DOS-Era Adventure Game for the Web',
    ` * Copyright © ${new Date().getFullYear()} Mark McIntyre`,
    ' * Created by Mark McIntyre',
    ' * All rights reserved.',
    ' *',
    ` * Version : ${packageJson.version}`,
    ` * Released: ${today}`,
    ' */'
  ].join('\n');
}

/** Build the selected browser artifacts. */
async function build({development = false, entries = ['game', 'editor', 'player']} = {}) {
  const selected = entries.map((entry) => typeof entry === 'string' ? entryDefinitions[entry] : entry).filter(Boolean);
  fs.mkdirSync(path.join(rootDir, 'build'), {recursive: true});
  await Promise.all(selected.map((definition) => esbuild.build({
    absWorkingDir: rootDir,
    entryPoints: [definition.entry],
    outfile: definition.output,
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    format: 'iife',
    ...(definition.globalName ? {globalName: definition.globalName} : {}),
    minify: !development,
    sourcemap: development,
    banner: {js: banner()}
  })));
}

function cliEntries(mode) {
  if (mode === 'game') return ['game'];
  if (mode === 'editor') return ['editor', 'player'];
  if (mode === 'dev') return ['dev'];
  return ['game', 'editor', 'player', ...(mode === 'all' ? ['dev'] : [])];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const development = args.includes('--development') || args.includes('--dev');
  const mode = args.find((arg) => !arg.startsWith('-')) || 'all';
  build({development, entries: cliEntries(mode)}).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export {build};
