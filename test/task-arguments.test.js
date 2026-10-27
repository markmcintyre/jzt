import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArguments as parseGenerate, parseWorld} from '../task/generate-site.js';
import {parseArguments as parsePackage, isInside} from '../task/package-itch.js';
import {parseArguments as parsePreview} from '../task/preview-itch.js';

test('site task argument parsers preserve defaults and validation', () => {
  const generated = parseGenerate(['--world', 'world.jzt']);
  assert.equal(generated.worldPath.endsWith('/world.jzt'), true);
  assert.equal(generated.templateName, 'index');
  assert.throws(() => parseGenerate([]), /A world file is required/);
  assert.throws(() => parseGenerate(['--world']), /--world requires a value/);
  assert.throws(() => parseGenerate(['--world','x','--template','bad']), /Unknown site template/);
  const packaged = parsePackage(['--world','world.jzt']);
  assert.equal(packaged.worldPath.endsWith('/world.jzt'), true);
  const preview = parsePreview(['--world','world.jzt','--port','8080']);
  assert.equal(preview.port, 8080);
  assert.throws(() => parsePreview(['--world','x','--port','0']), /--port must be an integer/);
});

test('world validation accepts required metadata and rejects incompatible data', () => {
  const world = parseWorld(JSON.stringify({version:'1.0.0', name:'Demo', author:'Author'}), 'demo.jzt');
  assert.equal(world.name, 'Demo');
  assert.throws(() => parseWorld('{}', 'demo.jzt'), /incompatible version/);
  assert.throws(() => parseWorld(JSON.stringify({version:'1.0.0', name:'', author:'A'}), 'demo.jzt'), /missing required metadata field "name"/);
  assert.throws(() => parseWorld('not-json', 'demo.jzt'), /not valid JSON or compressed JZT data/);
});

test('package containment helper distinguishes descendants', () => {
  assert.equal(isInside('/tmp/root', '/tmp/root/world.jzt'), true);
  assert.equal(isInside('/tmp/root', '/tmp/other/world.jzt'), false);
});
