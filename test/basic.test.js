import test from 'node:test';
import assert from 'node:assert/strict';
import {Point, Direction, DelayedEventScheduler, NotificationListener} from '../src/basic.js';

test('Point arithmetic, equality, adjacency and directions', () => {
  const p = new Point(3, 4);
  assert.deepEqual(p.clone(), p);
  assert.deepEqual(p.add(new Point(2, -1)), new Point(5, 3));
  assert.deepEqual(p.subtract(new Point(2, 6)), new Point(1, -2));
  assert.equal(p.equals(new Point(3, 4)), true);
  assert.equal(p.adjacent(new Point(4, 5)), true);
  assert.equal(p.adjacent(new Point(5, 4)), false);
  assert.equal(p.directionTo(new Point(3, 1), 'y'), Direction.North);
  assert.equal(p.directionTo(new Point(6, 4), 'x'), Direction.East);
  assert.equal(Direction.fromName('W'), Direction.West);
});

test('DelayedEventScheduler accepts, rejects while delayed, and cancels', () => {
  const original = Date.now;
  try {
    Date.now = () => 1000;
    const scheduler = new DelayedEventScheduler(100, 50);
    scheduler.scheduleEvent(1000, 'first');
    scheduler.scheduleEvent(1000, 'ignored');
    assert.equal(scheduler.takeEvent(), 'first');
    Date.now = () => 1200;
    scheduler.scheduleEvent(1200, 'second');
    scheduler.cancelEvent();
    assert.equal(scheduler.takeEvent(), 'second');
  } finally { Date.now = original; }
});

test('NotificationListener stores stable notification shape and timestamp', () => {
  const original = Date.now;
  try {
    Date.now = () => 42;
    const listener = new NotificationListener();
    listener.addNotification('info', 'hello');
    assert.deepEqual(listener.notifications, [{type: 'info', message: 'hello', timestamp: 42}]);
  } finally { Date.now = original; }
});
