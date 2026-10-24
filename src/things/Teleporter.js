import { Direction } from '../basic.js';

import { UpdateableThing } from './UpdateableThing.js';


class Teleporter extends UpdateableThing {
  constructor(board) {
    super(board);
    this.orientation = Direction.East;
    this.animationFrame = 2;
    this.speed = 3;
  }
  /**
   * Serializes this Teleporter instance into a data object.
   *
   * @return A data object representing a serialized Teleporter.
   */
  serialize() {
    var result = super.serialize();
    result.orientation = Direction.getName(this.orientation);
    return result;
  }

  /**
   * Deserializes a provided data object to configure this Teleporter instance.
   *
   * @param data A data object representing a serialized Teleporter.
   */
  deserialize(data) {
    super.deserialize(data);
    if (data.orientation) {
      this.orientation = Direction.fromName(data.orientation);
    }
  }

  /**
   * Performs a single update tick of this Teleporter instance.
   */
  doTick() {
    this.animationFrame += 1;
    if (this.animationFrame >= Teleporter.animationFrames[Direction.getName(this.orientation)].length) {
      this.animationFrame = 0;
    }
  }

  /**
   * Retrieves a sprite index used to visually represent this Teleporter instance on
   * a rendered game Board.
   *
   * @return a sprite index.
   */
  getSpriteIndex() {
    return Teleporter.animationFrames[Direction.getName(this.orientation)][this.animationFrame];
  }

  /**
   * Attempts to push this Teleporter instance in a given direction. This teleporter, rather than
   * be pushed, may teleport the item being pushed to another location on its owner Board, based
   * on this Teleporter's orientation, and the location and orientation of other Teleporters on the board.
   *
   * @param direction A direction in which to push this Teleporter.
   */
  push(direction) {
    // We only teleport in our current direction
    if (!this.orientation.equals(direction)) {
      return;
    }

    var currentPoint = this.point.add(Direction.opposite(this.orientation)),
      destinationPoint = this.point.add(this.orientation),
      thing,
      tile = this.board.getTile(destinationPoint),
      success = tile && tile.type === 'Teleporter' ? false : this.board.moveTile(currentPoint, destinationPoint);

    // If we couldn't move the tile to the other side of this teleporter...
    if (!success) {
      // While we haven't reached the edge of the board...
      while (!this.board.isOutside(destinationPoint)) {
        // If we found a matching teleporter...
        thing = this.board.getTile(destinationPoint);
        if (thing && thing.type === 'Teleporter' && thing.orientation === Direction.opposite(this.orientation)) {
          // Move the tile to the matching teleporter's destination
          if (this.board.moveTile(currentPoint, destinationPoint.add(this.orientation))) {
            this.play('tc+d-e+f#-g#+a#c+d');
            return true;
          }
          break;
        }

        // Look at the next tile in the direction
        destinationPoint = destinationPoint.add(this.orientation);
      }
    } else {
      this.play('tc+d-e+f#-g#+a#c+d');
      return true;
    }
  }





}
Teleporter.animationFrames = {
  North: [196, 126, 94, 126],
  East: [179, 41, 62, 41],
  South: [196, 126, 118, 126],
  West: [179, 40, 60, 40]
};



export { Teleporter };
