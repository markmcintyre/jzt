import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class Lion extends UpdateableThing {
  constructor(board) {
    super(board);
    this.intelligence = 3;
    this.spriteIndex = 234;
    this.foreground = Colors.BrightRed;
    this.background = undefined;
    this.speed = 2;
    this.conveyable = true;
  }

  /**
   * Serializes this Lion to an Object.
   *
   * @return A serialized Lion
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.intelligence = this.intelligence;
    return result;
  }

  /**
   * Deserializes this Lion from a provided data Object
   *
   * @param data A data Lion object to be deserialized.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightRed;
    this.intelligence = data.intelligence;
  }

  /**
   * Delivers a provided message to this Thing. If a SHOT message is received,
   * then this Lion will be deleted from the board. If a TOUCH message is
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
   * Returns whether or not this Lion should seek the player during its next move.
   * The probability of a true result depends on this Lion's intelligence
   * property.
   *
   * @return true if this Lion should seek the player, false otherwise.
   */
  seekPlayer() {
    var randomValue = Math.floor(Math.random() * 10);
    return randomValue <= this.intelligence;
  }

  /**
   * Updates this Lion for a provided timestamp. This Lion will move itself randomly
   * during updates. If a Player blocks its movement, then the player will be sent
   * a SHOT message and this Lion will be removed from its parent board.
   */
  doTick() {
    var direction = this.seekPlayer() ? this.getPlayerDirection() : Direction.random(),
      thing = this.board.getTile(this.point.add(direction));

    if (thing && thing.type === 'Player') {
      thing.sendMessage('SHOT');
      this.remove();
      return;
    }

    // Don't move in the direction of a River
    if (thing && thing.type === 'River' && thing.direction === Direction.opposite(direction)) {
      return;
    }

    this.move(direction, true);
  }
}


export { Lion };
