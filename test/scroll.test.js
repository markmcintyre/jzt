import test from 'node:test';
import assert from 'node:assert/strict';
import {Scroll} from '../src/scroll.js';

const createScroll = () => new Scroll({
  resources: {graphics: {TILE_SIZE: {x: 16, y: 32}, getSprite: () => ({})}},
  context: {canvas: {height: 640}},
  screenWidth: 50,
  screenHeight: 20,
  CYCLE_TICKS: 2
});

const scrollDown = (scroll) => {
  scroll.eventScheduler.event = Scroll.ScrollAction.Down;
  scroll.doTick();
};

test('Scroll handles down navigation across labeled lines', () => {
  const scroll = createScroll();
  scroll.setHeight(8);
  scroll.lines = Array.from({length: 10}, (_, index) => index === 0 || index === 3 || index === 6 || index === 9 ? {label: `label-${index}`} : []);
  scroll.labels = [0, 3, 6, 9];
  scroll.cursor = 0;

  scrollDown(scroll);
  assert.equal(scroll.cursor, 3);
  assert.equal(scroll.position, 0);
  scrollDown(scroll);
  assert.equal(scroll.cursor, 3);
  assert.equal(scroll.position, 1);
  scrollDown(scroll);
  assert.equal(scroll.cursor, 6);
});

test('Scroll moves down through unlabeled content without throwing', () => {
  const scroll = createScroll();
  scroll.setHeight(8);
  scroll.lines = Array.from({length: 10}, () => []);
  scroll.labels = [];
  scroll.cursor = -1;

  scrollDown(scroll);
  assert.equal(scroll.position, 1);
  assert.equal(scroll.cursor, -1);
});
