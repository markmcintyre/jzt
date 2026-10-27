import test from 'node:test';
import assert from 'node:assert/strict';
import {JztScript} from '../src/jzt-script.js';
import {JztScriptContext} from '../src/jzt-script-context.js';

test('JztScript serializes, compiles commands and indexes labels', () => {
  const script = new JztScript('demo', ': start\nEND', true);
  assert.deepEqual(script.serialize(), {name:'demo', rawScript:': start\nEND'});
  assert.deepEqual(script.labelIndicies.START, [0]);
  assert.equal(script.commands.length, 1);
  assert.equal(typeof script.getCommand(0).execute, 'function');
});

test('JztScriptContext tracks default, stop, advance and labels', () => {
  const script = new JztScript('demo', ': start\nEND', true);
  const owner = {messageQueue: [], locked:false};
  const context = new JztScriptContext(script, owner);
  assert.equal(context.inDefaultState(), true); assert.equal(context.isRunning(), true);
  context.advanceLine(); assert.equal(context.commandIndex, 1); assert.equal(context.inDefaultState(), false);
  context.stop(); assert.equal(context.isRunning(), false);
  context.currentLabels.START = 2; context.heap.value = 1;
  const data = context.serialize(); const restored = new JztScriptContext(script, owner); restored.deserialize(data);
  assert.equal(restored.currentLabels.START, 2); assert.equal(restored.heap.value, 1);
});
