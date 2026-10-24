import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';
import { ThingFactory } from './thing-registry.js';

import { UpdateableThing } from './UpdateableThing.js';


class Tiger extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 227;
    this.foreground = Colors.BrightCyan;
    this.background = undefined;
    this.intelligence = 5;
    this.firingRate = 5;
    this.speed = 2;
    this.conveyable = true;
  }

  /**
   * Serializes this Tiger into a data object.
   *
   * @return A data object representing a serialized Tiger.
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
  }

  /**
   * Deserializes a provided data object to configure this Tiger instance.
   *
   * @param data A data object representing a serialized Tiger.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightCyan;
    this.intelligence = data.intelligence === undefined ? 5 : data.intelligence;
    this.firingRate = data.firingRate === undefined ? 5 : data.firingRate;
  }

  /**
   * Delivers a provided message to this Thing. If a SHOT message is received,
   * then this Tiger will be deleted from the board. If a TOUCH message is
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
  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (!this.move(direction)) {
      this.play('t+c---c++++c--c');
      this.remove();
    }
  }

  /**
   * Returns whether or not this Tiger should seek the player during its next move.
   * The probability of a true result depends on this Tiger's intelligence
   * property.
   *
   * @return true if this Tiger should seek the player, false otherwise.
   */
  seekPlayer() {
    var randomValue = Math.floor(Math.random() * 10);
    return randomValue <= this.intelligence;
  }

  /**
   * Returns whether or not this Tiger should shoot the player during its next
   * move. The probability of a true result depends on this Tiger's firing rate
   * property.
   *
   * @return true if this Tiger should shoot the player, false otherwise.
   */
  shootPlayer() {
    var randomValue = Math.floor(Math.random() * 20);
    return randomValue <= this.firingRate;
  }

  /**
   * Performs a single update tick of this Tiger.
   */
  doTick() {
    var direction = this.seekPlayer() ? this.getPlayerDirection() : Direction.random(),
      thing = this.board.getTile(this.point.add(direction)),
      playerDirection;

    if (thing && thing.type === 'Player') {
      thing.sendMessage('SHOT');
      this.remove();
      return;
    }

    // Don't attempt to move in the direction of a river
    if (!(thing && thing.type === 'River' && thing.direction === Direction.opposite(direction))) {
      this.move(direction, true);
    }

    if (this.shootPlayer()) {
      playerDirection = this.getPlayerDirection();
      ThingFactory.shoot(this.board, this.point.add(playerDirection), playerDirection);
    }
  }
}


export { Tiger };
