import { Direction } from '../basic.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class Pusher extends UpdateableThing {
  constructor(board) {
    super(board);
    this.orientation = Direction.South;
    this.speed = 3;
    this.initializeSprite();
  }
  /**
   * Initializes a spriteIndex for this Pusher based on its defined
   * direction.
   */
  initializeSprite() {
    if (this.orientation === Direction.North) {
      this.spriteIndex = 30;
    } else if (this.orientation === Direction.East) {
      this.spriteIndex = 16;
    } else if (this.orientation === Direction.South) {
      this.spriteIndex = 31;
    } else if (this.orientation === Direction.West) {
      this.spriteIndex = 17;
    }
  }

  /**
   * Serializes this Pusher instance to an object.
   *
   * @return A serialized Pusher
   */
  serialize() {
    var result = super.serialize();
    result.orientation = Direction.getName(this.orientation);
    return result;
  }

  /**
   * Deserializes a provided data object into a Pusher instance.
   *
   * @param data Serializes Pusher data to be deserialized.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    if (data.orientation) {
      this.orientation = Direction.fromName(data.orientation);
    }
    this.initializeSprite();
  }

  /**
   * Performs a tick update of this Pusher.
   */
  doTick() {
    if (this.move(this.orientation)) {
      this.play('t--f', false, true);
    }
  }




}

defineThing('Pusher', Pusher);
export { Pusher };
