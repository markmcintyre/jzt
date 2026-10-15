import { Point, utilities, Direction } from '../basic.js';
import { Colors, ColorUtilities } from '../graphics.js';
import { ThingFactory } from './thing-registry.js';

class Thing {
  constructor(board) {
    this.spriteIndex = 63;
    this.board = board;
    this.point = new Point(0, 0);
    this.foreground = Colors.Yellow;
    this.background = undefined;
    this.type = this.constructor.type;
  }

  /**
   * Serializes this Thing to an object and returns it.
   *
   * @return A serialized version of this Thing.
   */
  serialize() {
    var result = {};
    result.type = this.constructor.type;
    result.color = ColorUtilities.serialize(this.background, this.foreground);
    if (this.under) {
      result.under = this.under.serialize();
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
    if (data.color) {
      this.foreground = ColorUtilities.deserializeForeground(data.color);
      this.background = ColorUtilities.deserializeBackground(data.color);
    } else {
      if (!this.foreground) {
        this.foreground = Colors.Yellow;
      }
      this.background = undefined;
    }

    if (data.under) {
      this.under = ThingFactory.deserialize(data.under, this.board);
    }
  }

  /**
   * Plays a given audio notation. This function is a convenient shorthand
   * for a full call chain.
   *
   * @param notation An audio notation to play.
   * @param uninterruptable Whether or not this notation can be interrupted by another.
   * @param defer If set, we do not even schedule our notation if another is already playing.
   */
  play(notation, uninterruptable, defer) {
    /*
     * Deferring audio means we don't even attempt to play something if another
     * is already playing. This not only saves wasted time scheduling audio
     * that will be cancelled by a future sound, but also allows previously
     * triggered sounds to take priority even if that sound wasn't declared
     * uninterruptable.
     */
    if (!defer || !this.board.game.resources.audio.isPlaying()) {
      this.board.game.resources.audio.play(notation, uninterruptable);
    }
  }

  /**
   * Adjusts a game counter by a provided value offset. This offset may be
   * positive (to increase the counter), or negative (to decrease it).
   *
   * @param counter A name of a counter
   * @param value A value by which to adjust a counter
   */
  adjustCounter(counter, value) {
    this.board.game.adjustCounter(counter, value);
  }

  setCounterValue(counter, value) {
    this.board.game.setCounterValue(counter, value);
  }

  getCounterValue(counter) {
    return this.board.game.getCounterValue(counter);
  }

  /**
   * Delivers a provided message to this Thing.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage() {
    return undefined;
  }

  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   * @param pusher A Thing that is requesting the push.
   * @return true if the push resulted in a teleportation, undefined otherwise.
   */
  push() {
    return undefined;
  }

  /**
   * Returns whether or not this Thing declares itself to be surrenderable to
   * a given sender.
   *
   * A Thing that is surrenderable will allow another Thing to occupy its
   * space on a board and will agree to be 'under' that Thing.
   *
   * @param sender A Thing requesting a surrender
   * @return true if this Thing agrees to surrender, false otherwise.
   */
  isSurrenderable() {
    return false;
  }

  /**
   * Retrieves whether or not this Thing instance is blocked in a given direction.
   * A Thing is defined as blocked if a tile appears at that direction that is occupied
   * and is not willing to surrender its position to another tile.
   *
   * @param direction A direction in which to test if this Thing is blocked
   * @return true if this Thing is blocked, false otherwise.
   */
  isBlocked(direction) {
    var newPoint = this.point.add(direction),
      obstacle;

    if (this.board.isFree(newPoint)) {
      return false;
    }

    if (this.board.isOutside(newPoint)) {
      return true;
    }

    obstacle = this.board.getTile(newPoint);
    if (obstacle) {
      return !obstacle.isSurrenderable(this);
    }
  }

  /**
   * Retrieves whether or not this Thing has a line of sight to a Player within a provided
   * distance. A line of sight may be broken by any Thing, in which case this function
   * returns false.
   *
   * @param distance a number of tiles determining the visibility distance
   * @return true if there is an uninterrupted straight line between this thing and a player.
   */
  isPlayerVisible(distance) {
    var line = utilities.generateLineData(this.point, this.board.player.point),
      me = this,
      currentPoint = this.point,
      result = true;

    function isBlocked(point) {
      var tile = me.board.getTile(point);
      return tile && tile !== me && tile.type !== 'Player';
    }

    if (line.points.length > distance) {
      return false;
    }

    line.forEach(function (point) {
      // If we're doing a diagnoal step, test both paths to that step
      if (currentPoint.x !== point.x && currentPoint.y !== point.y) {
        if (isBlocked(new Point(currentPoint.x, point.y)) || isBlocked(new Point(point.x, currentPoint.y))) {
          result = false;
        }
      }

      if (isBlocked(point)) {
        result = false;
      }

      currentPoint = point;
    });

    return result;
  }

  /**
   * Retrieves whether or not this Thing instance is directly adjacent to a Player Thing in
   * a provided direction.
   *
   * @param direction A direction in which to test if this Thing is player adjacent
   * @return true if a Player thing is directly adjacent in a given direction, false otherwise.
   */
  isPlayerAdjacent(direction) {
    var me = this,
      result = false;

    function testDirection(directionToTest) {
      var tile = me.board.getTile(me.point.add(directionToTest));
      if (tile && tile.type === 'Player') {
        result = true;
      }
    }

    if (direction) {
      testDirection(direction);
    } else {
      Direction.each(testDirection);
    }

    return result;
  }

  /**
   * Returns whether or not this Thing is aligned to the player
   * with a certain spread.
   *
   * @return true if player is aligned, false otherwise.
   */
  isPlayerAligned(spread, direction) {
    return this.point.aligned(this.board.player.point, spread, direction);
  }

  /**
   * Moves this Thing in a provided Direction and returns its success.
   *
   * @param direction A Direction in which to move this Thing.
   * @param weak If true, we will move weakly.
   * @return true if the move was successful, false otherwise.
   */
  move(direction, weak) {
    return this.board.moveTile(this.point, this.point.add(direction), weak);
  }

  /**
   * Removes this Thing from its owner board.
   */
  remove() {
    this.removed = true;
    this.board.deleteTile(this.point);
  }

  /**
   * Retrieves a sprite index to be used to represent this Thing.
   *
   * @return A sprite index.
   */
  getSpriteIndex() {
    return this.spriteIndex;
  }

  /**
   * Retrieves a Thing that is directly adjacent to this Thing in a given direction.
   *
   * @param direction A direction to retrieve another Thing.
   * @return a Thing, or undefined if no such Thing exists.
   */
  getAdjacentThing(direction) {
    return this.board.getTile(this.point.add(direction));
  }

  /**
   * Retrieves whether or not this Thing has the same type and color as provided.
   *
   * @param type a case-insensitive serializable type name
   * @param color An optional color
   * @return true if this Thing has a matching serializable type and color (if provided)
   */
  equals(template) {
    var type = template.type.toUpperCase(),
      color = template.color ? ColorUtilities.deserializeForeground(template.color) : undefined;

    if (this.constructor.type.toUpperCase() === type) {
      return color === undefined ? true : color === this.foreground;
    }

    return false;
  }

  /**
   * Displays a short, localizable message exactly once.
   *
   * @param messageKey A localization key for a message to display.
   */
  oneTimeMessage(messageKey) {
    this.board.game.oneTimeMessage(messageKey);
  }

  /**
   * Returns a new Thing instance with the same properties as this Thing.
   * This clone function works by serializing the current Thing and deserializing
   * the data as a new Thing, and should work for any serializable Thing.
   *
   * @return A clone of this Thing.
   */
  clone() {
    var clone = this.serialize();
    return ThingFactory.deserialize(clone, this.board);
  }
}

export { Thing };
