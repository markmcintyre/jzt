import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class Ruffian extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 5;
    this.background = undefined;
    this.foreground = Colors.BrightMagenta;
    this.intelligence = 5;
    this.restingTime = 5;
    this.moving = false;
    this.timeLeft = 0;
    this.speed = 1;
    this.orientation = Direction.North;
    this.conveyable = true;
  }

  /**
   * Serializes this Ruffian to a data object.
   *
   * @return A serialized Ruffian.
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.intelligence = this.intelligence;
    result.restingTime = this.restingTime;
    return result;
  }

  /**
   * Deserializes a provided data object, configuring this Ruffian.
   *
   * @param data A data object to be deserialized into a Ruffian.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightMagenta;
    this.intelligence = data.intelligence || 5;
    this.restingTime = data.restingTime || 5;
  }

  /**
   * Pushes this Ruffian instance in a given direction. If this Ruffian
   * cannot be pushed, it will be squished and removed from its owner Board.
   *
   * @param direction A direction in which to push this Ruffian.
   */
  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (!this.move(direction)) {
      this.remove();
      this.play('t+c---c++++c--c');
    }
  }

  /**
   * Sends a provided message to this Ruffian.
   *
   * @param message A message to be delivered to this Ruffian.
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
   * Returns whether or not this Ruffian should seek the player during its next move.
   * The probability of a true result depends on this Ruffian's intelligence
   * property.
   *
   * @return true if this Ruffian should seek the player, false otherwise.
   */
  seekPlayer() {
    var randomValue = Math.floor(Math.random() * 10);
    return randomValue <= this.intelligence;
  }

  /**
   * Performs an update tick for this Ruffian instance.
   */
  doTick() {
    // Decrement our remaining time and check if it has elapsed...
    this.timeLeft -= 1;
    if (this.timeLeft <= 0) {
      // Toggle our movement status
      this.moving = !this.moving;

      // If we're about to move, choose a direction and duration
      if (this.moving) {
        this.orientation = this.seekPlayer() ? this.getPlayerDirection() : Direction.random();
        this.timeLeft = Math.floor(Math.random() * 10);
      } else {
        this.timeLeft = Math.floor(Math.random() * 10) - (10 - this.restingTime);
      }
    }

    // If we're moving...
    if (this.moving) {
      // Determine what's in our way
      var thing = this.board.getTile(this.point.add(this.orientation));

      // If it's the player, attack it
      if (thing && thing.type === 'Player') {
        thing.sendMessage('SHOT');
        this.remove();
        return;
      }

      // Don't move in the direction of a River
      if (thing && thing.type === 'River' && thing.direction === Direction.opposite(this.orientation)) {
        return;
      }

      // Otherwise just move
      this.move(this.orientation, true);
    }
  }
}


export { Ruffian };
