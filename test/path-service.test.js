import test from 'node:test';
import assert from 'node:assert/strict';
import {Point} from '../src/basic.js';
import {PathService} from '../src/path-service.js';

test('PathService computes bounded paths around blocking tiles', () => {
  const service = new PathService(5, 5);
  const tiles = Array(25).fill(undefined);
  tiles[1 + 0 * 5] = {type:'Wall'};

  assert.equal(service.needsUpdate(new Point(0, 0)), true);
  service.update(new Point(0, 0), tiles, []);

  assert.equal(service.getValue(new Point(0, 0)), 0);
  assert.equal(service.getValue(new Point(1, 0)), Infinity);
  assert.equal(service.getValue(new Point(0, 1)), 1);
  assert.equal(service.needsUpdate(new Point(0, 0)), false);
  assert.equal(service.getValue(new Point(-1, 0)), Infinity);
});

test('PathService reapplies bullet weights after rebuilding', () => {
  const service = new PathService(5, 5);
  const tiles = Array(25).fill(undefined);
  const bullet = {
    removed:false,
    influenceSmartPath() {
      service.adjustWeight(new Point(1, 0), 100);
    }
  };

  service.update(new Point(0, 0), tiles, [bullet]);
  assert.equal(service.getValue(new Point(1, 0)), 101);

  service.markDirty();
  assert.equal(service.needsUpdate(new Point(0, 0)), true);
});
