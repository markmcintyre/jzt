import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class Bear extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 153;
    this.background = undefined;
    this.foreground = Colors.Brown;
    this.sensitivity = 9;
    this.speed = 3;
    this.conveyable = true;
  }

  /**
   * Serializes this Bear to an Object.
   *
   * @return A serialized Bear
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.sensitivity = this.sensitivity;
    return result;
  }

  /**
   * Deserializes this Bear from a provided data Object
   *
   * @param data A data Bear object to be deserialized.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.Brown;
    this.sensitivity = data.sensitivity || 9;
  }

  /**
   * Pushes this Bear in a given direction. If this Bear cannot be pushed,
   * it will be squished and removed from its owner Board.
   *
   * @param direction A direction in which to push this Bear.
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
   * Delivers a provided message to this Thing. If a SHOT message is received,
   * then this Bear will be deleted from the board. If a TOUCH message is
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
   * Updates this Bear for a provided timestamp. This Bear will move itself randomly
   * during updates. If a Player blocks its movement, then the player will be sent
   * a SHOT message and this Bear will be removed from its parent board.
   */
  doTick() {
    var thing, direction;

    if (this.isPlayerAligned(10 - this.sensitivity)) {
      // X-Axis always gets priority
      direction = this.getPlayerDirection('x');

      // If we are already aligned with the player...
      if (direction === undefined) {
        direction = this.getPlayerDirection('y');
      }

      thing = this.board.getTile(this.point.add(direction));
      if (thing && (thing.type === 'BreakableWall' || thing.type === 'Player')) {
        thing.sendMessage('SHOT');
        this.remove();
        return;
      }

      // Don't attempt to move in the direction of a river
      if (thing && thing.type === 'River' && thing.direction === Direction.opposite(direction)) {
        return;
      }

      this.move(direction, true);
    }
  }
}


export { Bear };
