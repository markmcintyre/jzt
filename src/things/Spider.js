import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class Spider extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 15;
    this.foreground = Colors.BrightRed;
    this.background = undefined;
    this.intelligence = 5;
    this.speed = 1;
  }

  /**
   * Serializes this Spider instance into a data object.
   *
   * @return A serialized Spider
   */
  serialize() {
    var result = super.serialize();
    result.intelligence = this.intelligence;
    return result;
  }

  /**
   * Deserializes a data object and configure this Spider instance.
   *
   * @param data A data object to be deserialized into a Spider.
   */
  deserialize(data) {
    super.deserialize(data);
    this.intelligence = data.intelligence;
  }

  /**
   * Returns whether or not this Spider instance should seek the player
   * for an attack, or choose a random direction. This decision is weighted
   * based on this Spider's intelligence property.
   *
   * @return true if this Spider should seek the player, false otherwise
   */
  seekPlayer() {
    var randomValue = Math.floor(Math.random() * 10);
    return randomValue <= this.intelligence;
  }

  /**
   * Returns whether or not a position in a provided direction is attackable
   * by this Spider. Attackable positions are defined as spider webs
   * or spots occupied by a player.
   *
   * return true if a provided direction is attackable, false otherwise
   */
  isAttackable(direction) {
    var thing = this.board.getTile(this.point.add(direction));
    return thing && (thing.type === 'SpiderWeb' || thing.type === 'Player');
  }

  /**
   * Delivers a provided message to this Thing. If a SHOT message is received,
   * then this Spider will be deleted from the board. If a TOUCH message is
   * received, then the player will be sent a SHOT message.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    if (message === 'SHOT' || message === 'BOMBED') {
      this.play('t+c---c++++c--c', true);
      this.adjustCounter('SCORE', 10);
      this.remove();
    } else if (message === 'TOUCH') {
      this.board.player.sendMessage('SHOT');
      this.remove();
    }
  }

  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   */
  push(direction) {
    if (!this.move(direction)) {
      this.play('t+c---c++++c--c');
      this.remove();
    }
  }

  /**
   * Performs an update tick for this Spider instance.
   */
  doTick() {
    // Get a direction based on our intelligence
    var direction = this.seekPlayer() ? this.getPlayerDirection() : Direction.random(this.getAttackableDirections()),
      thing;

    // If a direction was decided upon...
    if (direction !== undefined) {
      // Determine any obstacle in our way
      thing = this.board.getTile(this.point.add(direction));

      // If it's a player, attack it
      if (thing && thing.type === 'Player') {
        thing.sendMessage('SHOT');
        this.remove();
        return;
      }

      // Move along spider webs
      if (thing && thing.type === 'SpiderWeb') {
        this.move(direction, true);
      }
    }
  }
}

defineThing('Spider', Spider);
export { Spider };
