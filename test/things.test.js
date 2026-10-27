import test from 'node:test';
import assert from 'node:assert/strict';
import {Colors} from '../src/graphics.js';
import {Direction} from '../src/basic.js';
import {GameState} from '../src/game-state.js';
import {JztScript} from '../src/jzt-script.js';
import {Thing, UpdateableThing, ThingFactory, things} from '../src/things.js';
import {ThingFactory as RegistryThingFactory, defineThing} from '../src/things/thing-registry.js';
import {initializeThingDefinitions} from '../src/things/thing-definitions.js';
import {ThingFactory as CommandThingFactory} from '../src/jzt-script-commands/shared.js';

function scriptBoard(script) {
  return {
    game: {state: GameState.Playing, CYCLE_RATE: 2},
    getScript(name) {
      return name === script.name ? script : undefined;
    }
  };
}

test('thing bases initialize, serialize colors and nested under things', () => {
  const board = {game:{}};
  const thing = new Thing(board); thing.foreground = Colors.Red; thing.background = Colors.Blue;
  thing.under = new things.Wall(board);
  const data = thing.serialize();
  assert.equal(data.type, undefined); assert.equal(data.color, '14'); assert.equal(data.under.type, 'Wall');
  const restored = new Thing(board); restored.deserialize({type:'Wall', color:'14', under:{type:'Wall', color:'0E'}});
  assert.equal(restored.foreground, Colors.Red); assert.equal(restored.background, Colors.Blue);
  assert.ok(restored.under instanceof Thing);
  assert.ok(new UpdateableThing(board) instanceof Thing);
});

test('Scriptable suppresses adjacent duplicate messages and resumes after unlocking', () => {
  const script = new JztScript('messages', ': start\nEND', true);
  const thing = new things.Scriptable(scriptBoard(script));

  thing.sendMessage('HELLO');
  thing.sendMessage('HELLO');
  assert.deepEqual(thing.messageQueue, ['HELLO']);

  thing.sendMessage('WORLD');
  assert.deepEqual(thing.messageQueue, ['HELLO', 'WORLD']);

  thing.locked = true;
  thing.sendMessage('LOCKED');
  assert.deepEqual(thing.messageQueue, ['HELLO', 'WORLD']);

  thing.locked = false;
  thing.sendMessage('LOCKED');
  assert.deepEqual(thing.messageQueue, ['HELLO', 'WORLD', 'LOCKED']);
});

test('Scriptable round-trips script state, queued messages and directions', () => {
  const script = new JztScript('movement', ': start\nEND', true);
  const board = scriptBoard(script);
  const data = {
    type: 'Scriptable',
    name: 'Guard',
    script: 'movement',
    spriteIndex: 9,
    speed: 4,
    walkDirection: 'East',
    orientation: 'South',
    locked: true,
    messageQueue: ['OPEN'],
    scriptContext: {commandIndex: 1, currentLabels: {START: 0}, heap: {counter: 2}}
  };
  const restored = ThingFactory.deserialize(data, board);

  assert.ok(restored instanceof things.Scriptable);
  assert.equal(restored.name, 'Guard');
  assert.equal(restored.speed, 4);
  assert.equal(restored.walkDirection, Direction.East);
  assert.equal(restored.orientation, Direction.South);
  assert.equal(restored.locked, true);
  assert.deepEqual(restored.messageQueue, ['OPEN']);
  assert.equal(restored.scriptContext.script, script);
  assert.equal(restored.scriptContext.commandIndex, 1);
  assert.deepEqual(restored.scriptContext.heap, {counter: 2});

  assert.deepEqual(restored.serialize(), {
    type: 'Scriptable',
    color: '*E',
    name: 'Guard',
    spriteIndex: 9,
    script: 'movement',
    speed: 4,
    scriptContext: {
      commandIndex: 1,
      currentLabels: {},
      heap: {counter: 2}
    },
    messageQueue: ['OPEN'],
    walkDirection: 'East',
    locked: true,
    orientation: 'South'
  });
});

test('UpdateableThing ticks at its cycle threshold and resets cycleCount', () => {
  class TickingThing extends UpdateableThing {
    doTick() {
      this.tickCount = (this.tickCount || 0) + 1;
    }
  }
  const board = {game: {state: GameState.Playing, CYCLE_RATE: 2}};
  const thing = new TickingThing(board);
  thing.speed = 3;
  thing.cycleCount = 5;

  thing.update();
  assert.equal(thing.cycleCount, 0);
  assert.equal(thing.tickCount, 1);
});

test('ThingFactory exposes one initialized registry boundary', () => {
  const board = {game:{}};

  assert.strictEqual(ThingFactory, RegistryThingFactory);
  assert.strictEqual(ThingFactory, CommandThingFactory);
  assert.equal(ThingFactory.isKnownThing('wall'), true);
  assert.equal(Object.getPrototypeOf(things), null);
  assert.equal(Object.isFrozen(things), true);

  const map = ThingFactory.getThingMap();
  const mapAgain = ThingFactory.getThingMap();
  assert.strictEqual(map, mapAgain);
  assert.equal(Object.getPrototypeOf(map), null);
  assert.equal(Object.isFrozen(map), true);
  assert.equal(Object.keys(map).length, 46);
  assert.equal(map.CENTIPEDE, things.Centipede);
  assert.equal(map.WALL.type, 'Wall');
  const wall = ThingFactory.deserialize({type:'Wall', color:'*F'}, board);
  assert.ok(wall instanceof Thing);
  assert.equal(wall.serialize().type, 'Wall');
  assert.equal(ThingFactory.deserialize({type:'missing'}, board), undefined);
  assert.equal(typeof things.Wall, 'function');

  initializeThingDefinitions();
  assert.strictEqual(ThingFactory.getThingMap(), map);
  assert.throws(() => defineThing('LateThing', class {}), /Thing registry is frozen/);
});
