import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class Bullet extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 248;
    this.foreground = Colors.BrightWhite;
    this.background = undefined;
    this.direction = Direction.North;
    this.speed = 1;
  }

  /**
   * Serializes this Thing to an object and returns it.
   *
   * @return A serialized version of this Thing.
   */
  serialize() {
    var result = super.serialize() || {};
    delete result.color;
    result.direction = Direction.getShortName(this.direction);
    if (this.fromPlayer) {
      result.fromPlayer = true;
    }
    return result;
  }

  /**
   * Deserializes a given data object and update's this Thing's state to
   * that data.
   *
   * @param data An object to be deserialized into this Thing.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightWhite;
    this.direction = Direction.fromName(data.direction);
    if (data.fromPlayer) {
      this.fromPlayer = data.fromPlayer;
    }
  }

  /**
   * Sends a provided message to this Bullet instance. If a Touch message is
   * received then the player will be sent a shot message and this Bullet will
   * be removed from its owner Board.
   *
   * @param message A message to be delivered to this Bullet.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.board.player.sendMessage('SHOT');
      this.remove();
    }
  }

  /**
   * Retrieves whether or not this Bullet instance wishes to be updated on its owner Board's
   * reverse update cycle.
   */
  updateOnReverse() {
    return this.direction === Direction.South || this.direction === Direction.East;
  }

  influenceSmartPath() {
    var point, index;

    // If we are a player bullet...
    if (this.fromPlayer) {
      point = this.point;

      // Weight the ten spaces in front of our bullet as aversion points
      for (index = 0; index < 10; index += 1) {
        point = point.add(this.direction);
        this.board.adjustSmartPathWeight(point, 100 - index * 10);
      }
    }
  }

  /**
   * Updates this bullet, moving it one tile in its associated
   * direction.
   */
  doTick() {
    // If we are unable to move, attack our obstacle
    if (!this.move(this.direction, true)) {
      this.attack();
      this.react();
    }
  }

  /**
   * Attempts to Attack a Thing in this Bullet's path. If a player, Scriptable, or BreakableWall is in
   * its path, that Thing will be sent a SHOT message.
   */
  attack() {
    // See what was in our way.
    var thing = this.board.getTile(this.point.add(this.direction));

    /*
     * Send a SHOT message if the bullet was from the player
     * otherwise we only send the SHOT message to the player, Scriptables, and BreakableWalls.
     */
    if (
      thing &&
      (this.fromPlayer || thing.type === 'Player' || thing.type === 'Scriptable' || thing.type === 'BreakableWall')
    ) {
      thing.sendMessage('SHOT');
    }
  }

  /**
   * Make this Bullet react to its environment by looking for ricochet points or removing itself
   * from the board.
   */
  react() {
    // If we are still blocked (by a non-player), check if we should ricochet
    var thing = this.getAdjacentThing(this.direction);
    if (thing && thing.type !== 'Player') {
      // If there is a ricochet in our direction, reflect in the opposite direction if we're not blocked that way
      if (thing.type === 'Ricochet') {
        this.ricochet(Direction.opposite(this.direction));
        return;
      }

      // If there is a ricochet to our right, reflect to the left if we're not blocked that way
      thing = this.getAdjacentThing(Direction.clockwise(this.direction));
      if (thing && thing.type === 'Ricochet') {
        this.ricochet(Direction.counterClockwise(this.direction));
        return;
      }

      // If there is a ricochet to our left, reflect to our right if we're not blocked that way
      thing = this.getAdjacentThing(Direction.counterClockwise(this.direction));
      if (thing && thing.type === 'Ricochet') {
        this.ricochet(Direction.clockwise(this.direction));
        return;
      }
    }

    // Otherwise remove this bullet...
    this.remove();
  }

  /**
   * Change the direction of this bullet (with a ricochet sound) if we're capable of moving that way.
   *
   * @param A direction in which to ricochet
   */
  ricochet(direction) {
    // Change directions
    this.direction = direction;

    // If we're free to ricochet in the provided direction...
    if (this.move(direction, true)) {
      // Play our ricochet sound
      this.play('9', false, true);
    } else {
      // We're not free to move, so attack and remove ourselves
      this.attack();
      this.remove();
    }
  }

  /**
   * Attempts to push this Bullet.
   */
  push() {
    this.remove();
  }
}

defineThing('Bullet', Bullet);
export { Bullet };
