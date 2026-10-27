import test from 'node:test';
import assert from 'node:assert/strict';
import {Point} from '../src/basic.js';
import {LightingService} from '../src/lighting-service.js';

test('LightingService preserves current and previous masks across source movement', () => {
  const service = new LightingService(10, 10);
  const source = {
    point:new Point(4, 4),
    getTorch(){return {radius:1};}
  };

  service.beginUpdate();
  service.finishUpdate();
  service.updateLightSource(source);
  service.beginUpdate();
  service.updateLightSource(source);
  service.finishUpdate();

  assert.equal(service.isLit(new Point(4, 4), false), true);
  assert.equal(service.isLit(new Point(4, 4), true), false);

  source.point = new Point(7, 7);
  service.beginUpdate();
  service.updateLightSource(source);
  service.finishUpdate();

  assert.equal(service.isLit(new Point(7, 7), false), true);
  assert.equal(service.isLit(new Point(4, 4), false), false);
  assert.equal(service.isLit(new Point(4, 4), true), true);
});

test('LightingService caches geometry and invalidates changed sources', () => {
  const service = new LightingService(10, 10);
  const source = {
    point:new Point(4, 4),
    getTorch(){return {radius:2};}
  };
  const firstGeometry = service.getLightGeometry(2);

  service.updateLightSource(source);
  service.ensureLightMask();
  service.lightMaskDirty = false;
  service.invalidateLightSource(source);

  assert.equal(service.getLightGeometry(2), firstGeometry);
  assert.equal(service.lightMaskDirty, true);
});
