import test from 'node:test';
import assert from 'node:assert/strict';
import {KeyboardInput} from '../src/input.js';

test('KeyboardInput filters, timestamps and suppresses duplicate presses', () => {
  const original = Date.now; let now = 10;
  try {
    Date.now = () => now;
    const input = new KeyboardInput();
    const event = code => ({keyCode: code, prevented: false, preventDefault() { this.prevented = true; }});
    const left = event(input.LEFT); input.onKeyDown(left);
    assert.equal(left.prevented, true); assert.equal(input.pressed[input.LEFT], 10); assert.equal(input.pressedKeys, 1);
    now = 20; input.onKeyDown(left); assert.equal(input.pressedKeys, 1);
    now = 30; const up = event(input.UP); input.onKeyDown(up);
    assert.equal(input.getMostRecentPress(), input.UP);
    assert.equal(input.getMostRecentPress([input.LEFT]), input.LEFT);
    const unknown = event(999); input.onKeyDown(unknown); assert.equal(unknown.prevented, false);
    input.onKeyUp(up); assert.equal(input.isPressed(input.UP), undefined); assert.equal(up.prevented, true);
    input.cancelKey(input.LEFT); assert.equal(input.isAnyPressed(), false);
    input.onKeyDown(left); input.cancelInput(); assert.equal(input.isAnyPressed(), false);
  } finally { Date.now = original; }
});
