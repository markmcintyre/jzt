/** Registry and factory boundary for Things. */
const things = Object.create(null);
let registryFrozen = false;

function defineThing(name, ThingClass) {
  if (registryFrozen) {
    throw new Error('Thing registry is frozen.');
  }

  things[name] = ThingClass;
  ThingClass.type = name;
  if (ThingFactory.thingMap !== undefined) {
    delete ThingFactory.thingMap;
  }
}

function freezeThingRegistry() {
  registryFrozen = true;
  Object.freeze(things);
  if (ThingFactory.thingMap !== undefined) {
    Object.freeze(ThingFactory.thingMap);
  }
}

const ThingFactory = {
  deserialize(data, board) {
    if (data && data.type) {
      const ThingClass = this.getThingMap()[data.type.toUpperCase()];
      if (ThingClass) {
        const result = new ThingClass(board);
        result.deserialize(data);
        return result;
      }
    }
  },

  isKnownThing(thingName) {
    return this.getThingMap()[thingName.toUpperCase()] !== undefined;
  },

  getThingMap() {
    if (this.thingMap === undefined) {
      const map = Object.create(null);
      for (const thing in things) {
        if (Object.prototype.hasOwnProperty.call(things, thing) && things[thing].type) {
          map[thing.toUpperCase()] = things[thing];
        }
      }
      this.thingMap = Object.freeze(map);
    }
    return this.thingMap;
  },

  shoot(board, point, direction, fromPlayer, throwingStar) {
    const tile = board.getTile(point);
    const bullet = throwingStar ? new things.ThrowingStar(board) : new things.Bullet(board);

    bullet.direction = direction;
    if (fromPlayer) {
      bullet.fromPlayer = fromPlayer;
    }

    if (tile === undefined || tile.isSurrenderable(bullet)) {
      board.addThing(point, bullet, true);
      if (fromPlayer) {
        board.game.resources.audio.play('t+c-c-c');
      }
    } else if (fromPlayer && tile && tile.type === 'Ricochet') {
      board.player.sendMessage('SHOT');
    } else if (
      fromPlayer ||
      (tile && (tile.type === 'Player' || tile.type === 'Scriptable' || tile.type === 'BreakableWall'))
    ) {
      if (fromPlayer) {
        board.game.resources.audio.play('t+c-c-c');
      }
      tile.sendMessage('SHOT');
    }
  }
};

export {things, defineThing, freezeThingRegistry, ThingFactory};
