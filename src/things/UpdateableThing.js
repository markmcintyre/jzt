import { Direction } from '../basic.js';
import { GameState } from '../game-state.js';
import { Thing } from './Thing.js';

class UpdateableThing extends Thing {
  constructor(board) {
    super(board);
    this.cycleCount = 0;
    this.speed = 3;
  }

  /**
   * Serializes this Thing to an object and returns it.
   *
   * @return A serialized version of this Thing.
   */
  serialize() {
    var result = super.serialize() || {};
    result.speed = this.speed;
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
    if (data.speed) {
      this.speed = data.speed;
    }
    this.cycleCount = Math.floor(Math.random() * this.speed);
  }

  /**
   * Retrieves a Direction toward this UpdateableThing's Board's Player.
   *
   * @return a Direction toward a Player.
   */
  getPlayerDirection(axis) {
    return this.point.directionTo(this.board.player.point, axis);
  }

  getSmartDirection() {
    return this.board.getSmartDirection(this.point);
  }

  influenceSmartPath() {
    return undefined;
  }

  /**
   * Returns whether or not a position in a provided direction is attackable
   * by this UpdateableThing. Attackable positions are defined as free spots
   * or spots occupied by a player.
   *
   * return true if a provided direction is attackable, false otherwise
   */
  isAttackable(direction) {
    return !this.isBlocked(direction) || this.isPlayerAdjacent(direction);
  }

  /**
   * Retrieves an Array of Directions in which this UpdateableThing can attack.
   * An attackable direction is defined as any direction that is free, or is
   * occupied by the player.
   *
   * @return An array of Directions
   */
  getAttackableDirections() {
    var result = [],
      instance = this;
    Direction.each(function (direction) {
      if (instance.isAttackable(direction)) {
        result.push(direction);
      }
    });
    return result;
  }

  /**
   * Retrievs an Array of Directions in which this UpdateableThing is
   * free to move on its owner Board.
   *
   * @return An array of Directions.
   */
  getFreeDirections() {
    var result = [],
      instance = this;

    Direction.each(function (direction) {
      if (!instance.isBlocked(direction)) {
        result.push(direction);
      }
    });

    return result;
  }

  /**
   * Retrieves an Array of Directions in which this UpdateableThing is not free
   * to move on its owner Board.
   *
   * @return An array of Directions.
   */
  getBlockedDirections() {
    var result = [],
      instance = this;

    Direction.each(function (direction) {
      if (instance.isBlocked(direction)) {
        result.push(direction);
      }
    });

    return result;
  }

  /**
   * Updates this UpdateableThing for a single execution cycle.
   */
  update() {
    // Ensure that we haven't been removed already
    if (this.removed) {
      return;
    }

    if (this.board.game.state === GameState.GameOver) {
      this.doTick();
      return;
    }

    this.cycleCount += 1;

    if (this.cycleCount >= this.speed * this.board.game.CYCLE_RATE) {
      this.cycleCount = 0;
      this.doTick();
    }
  }

  updateOnReverse() {
    return false;
  }

  /**
   * Updates this UpdateableThing on its tick update cycle.
   */
  doTick() {
    return undefined;
  }
}

export { UpdateableThing };
