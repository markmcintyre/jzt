import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';

class Centipede extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 79;
    this.foreground = Colors.BrightBlue;
    this.background = undefined;
    this.speed = 3;
    this.follower = undefined;
    this.head = false;
    this.leader = undefined;
    this.linked = false;
    this.firstTick = true;
    this.orientation = undefined;
    this.deviance = 0;
    this.intelligence = 0;
  }

  /**
   * Serializes this Thing to an object and returns it.
   *
   * @return A serialized version of this Thing.
   */
  serialize() {
    var result = super.serialize();
    result.head = this.head;
    result.deviance = this.deviance;
    result.intelligence = this.intelligence;
    if (this.orientation) {
      result.orientation = Direction.getShortName(this.orientation);
    }
    if (this.follower) {
      result.nextSegment = Direction.getShortName(this.point.directionTo(this.follower.point));
    } else {
      result.nextSegment = 'X';
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
    this.head = data.head;
    this.intelligence = data.intelligence;
    this.deviance = data.deviance;
    if (data.orientation) {
      this.orientation = Direction.fromName(data.orientation);
    }
    if (data.nextSegment) {
      if (data.nextSegment === 'X') {
        // End of the centipede
        this.nextSegment = undefined;
      } else {
        // Direction of the next segment
        this.nextSegment = Direction.fromName(data.nextSegment);
      }
    }
    if (this.deviance > 10) {
      this.deviance = 10;
    }
    if (this.intelligence > 10) {
      this.intelligence = 10;
    }
    if (this.head) {
      this.spriteIndex = 233;
    }
    this.cycleCount = 0;
  }

  /**
   * Retrieves an unlinked, non-head, adjacent Centipede segment.
   *
   * @return An unlineked, non-head, adjacent Centipede segment.
   */
  getAdjacentSegment() {
    /**
     * Returns true if a provided candidate Thing is a Centipede, is
     * unlinked, and is not a head.
     *
     * @param candidate a Thing
     * @return true if a candidate is an unlinked, non-head Centipede
     */
    function isUnlinkedSegment(candidate) {
      return (
        candidate && candidate.type === 'Centipede' && !candidate.linked && !candidate.nextSegment && !candidate.head
      );
    }

    var result;

    // If a next segment direction was explicitly defined...
    if (this.hasOwnProperty('nextSegment')) {
      // Undefined means it's the end of the centipede, but
      // if it's not undefined, it's a direction pointing to the next
      if (this.nextSegment) {
        result = this.board.getTile(this.point.add(this.nextSegment));
      }

      // We no longer need the properly
      delete this.nextSegment;

      // If our result is actually a segment, return it
      if (result && result.type === 'Centipede' && !result.head) {
        return result;
      }

      return undefined;
    }

    // Try North
    result = this.board.getTile(this.point.add(Direction.North));
    if (isUnlinkedSegment(result)) {
      return result;
    }

    // East
    result = this.board.getTile(this.point.add(Direction.East));
    if (isUnlinkedSegment(result)) {
      return result;
    }

    // South
    result = this.board.getTile(this.point.add(Direction.South));
    if (isUnlinkedSegment(result)) {
      return result;
    }

    // West
    result = this.board.getTile(this.point.add(Direction.West));
    if (isUnlinkedSegment(result)) {
      return result;
    }

    return undefined;
  }

  /**
   * Recursively links adjacent segments to a provided Centipede.
   *
   * @param leader a Centipede
   */
  linkSegments(leader) {
    this.linked = true;
    this.leader = leader;

    if (this.leader) {
      this.deviance = leader.deviance;
      this.intelligence = leader.intelligence;
      this.cycleCount = leader.cycleCount;
      this.speed = leader.speed;
    }

    this.follower = this.getAdjacentSegment();

    if (this.follower) {
      if (this.head) {
        // Choose a natural initial orientation
        this.orientation = this.follower.point.directionTo(this.point);
      }

      this.follower.linkSegments(this);
    }
  }

  /**
   * Reverses the follower/leader relationship of this Centipede
   * and its followers.
   */
  reverse() {
    var nextSegment = this.follower,
      oldLeader = this.leader;

    if (this.head) {
      this.head = false;
      this.spriteIndex = 79;
    }

    this.leader = this.follower;
    this.follower = oldLeader;

    if (nextSegment) {
      nextSegment.reverse();
    } else {
      this.becomeHead();
    }
  }

  /**
   * Turns this Centipede into a head segment.
   */
  becomeHead() {
    this.head = true;
    this.spriteIndex = 233;

    this.cycleCount = Math.floor(Math.random() * this.speed);
  }

  /**
   * Moves this Centipede in a given direction. If a Player is
   * located in that direction, this Centipede will be deleted
   * and the player will be sent a SHOT message, otherwise this
   * Centipede and its followers will move one step.
   *
   * @param direction A direction in which to move. This direction
   * is expected to be free for movement, but may contain a Player.
   */
  move(direction) {
    var myPlace = this.point.clone();

    // If we've already moved, there's a circular reference and we can stop
    if (this.moved) {
      return;
    }

    // If we're a head, check to see if we're attacking the player
    if (this.head && this.isPlayerAdjacent(direction)) {
      this.board.player.sendMessage('SHOT');
      this.remove();
      return;
    }

    this.board.moveTile(this.point, this.point.add(direction), true);

    if (this.follower) {
      // We've got a follower, so note that we've already moved.
      this.moved = true;

      // Move our follower to our old location
      direction = this.follower.point.directionTo(myPlace);
      this.follower.move(direction);

      // Clear the flag that we've moved
      this.moved = false;
    }
  }

  /**
   * Requests that this Centipede be pushed in a given direction. Since
   * Centipedes can't be pushed, the Centipede will be deleted instead.
   *
   * @param direction A given direction to push this Centipede.
   */
  push() {
    this.play('t+c---c++++c--c');
    this.remove();
  }

  /**
   * Deletes this Centipede from its Board. Any leader and follower
   * Centipedes will be updates to no longer contain this Centipede
   * as well.
   */
  remove() {
    if (this.leader) {
      this.leader.follower = undefined;
    }
    if (this.follower) {
      this.follower.leader = undefined;
    }

    super.remove();
  }

  /**
   * Sends a provided message to this Centipede. If a SHOT message
   * is received, then this Centipede will be deleted from its board.
   * If a TOUCH message is received, then the board's player will be
   * sent a SHOT message and this Centipede will be deleted.
   *
   * @param message A message to be sent to this Centipede.
   */
  sendMessage(message) {
    if (message === 'SHOT' || message === 'BOMBED') {
      this.play('t+c---c++++c--c', true);
      this.adjustCounter('SCORE', 10);
      this.remove();
    }
    if (message === 'TOUCH') {
      this.board.player.sendMessage('SHOT');
      this.remove();
    }
  }

  /**
   * Returns whether or not this Centipede should deviate from
   * its orientation. This is a probability based on this
   * Centipedes deviance property.
   *
   * @return true if this Centipede should deviate now, false otherwise.
   */
  deviate() {
    if (this.deviance <= 0) {
      return false;
    }

    var randomValue = Math.floor(Math.random() * 20);
    return randomValue <= this.deviance;
  }

  /**
   * Returns whether or not this Centipede should seek the player
   * at this moment, or if it should move randomly. This is a
   * probability based on this Centipede's intelligence property.
   */
  seekPlayer() {
    if (this.intelligence <= 0) {
      return false;
    }

    if (this.isPlayerAligned()) {
      var randomValue = Math.floor(Math.random() * 10);
      return randomValue <= this.intelligence;
    }

    return false;
  }

  /**
   * Performs a tick.
   */
  doTick() {
    var direction, availableDirections;

    if (this.firstTick) {
      this.firstTick = false;
    } else {
      // If we aren't a head and don't have a leader, become one
      if (!this.head && this.leader === undefined) {
        this.becomeHead();
      }
    }

    // Centipedes only update if they are a head
    if (!this.head) {
      return;
    }

    // If we haven't initialized our segments, do it now
    if (!this.linked) {
      this.linkSegments();
    }

    // If we're to see the player now...
    if (this.seekPlayer()) {
      // Set our orientation toward the player
      this.orientation = this.getPlayerDirection();
    }

    // If we've got an orientation and it's attackable, move there
    if (this.orientation && this.isAttackable(this.orientation) && !this.deviate()) {
      this.move(this.orientation);
    } else {
      // Find all attackable directions
      availableDirections = this.getAttackableDirections();

      // If directions are available...
      if (availableDirections.length > 0) {
        // Pick one and remember it as our orientation
        direction = Direction.random(availableDirections);
        this.orientation = direction;
        this.move(direction);
      } else {
        this.reverse();
      }
    }
  }
}


export { Centipede };
