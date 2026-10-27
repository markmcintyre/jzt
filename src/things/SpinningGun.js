import { Direction } from '../basic.js';
import { ThingFactory } from './thing-registry.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class SpinningGun extends UpdateableThing {
  constructor(board) {
    super(board);
    this.intelligence = 5;
    this.firingRate = 5;
    this.spriteIndex = 24;
    this.animationIndex = Math.floor(Math.random() * SpinningGun.animationFrames.length - 1);
    this.speed = 2;
  }
  /**
   * Serializes this SpinningGun instance into a data object.
   *
   * @return A serialized SpinningGun.
   */
  serialize() {
    var result = super.serialize();
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
  }

  /**
   * Deserializes a provided data object to configure this SpinningGun instance.
   *
   * @param data A serialized SpinningGun data object.
   */
  deserialize(data) {
    super.deserialize(data);
    this.intelligence = data.intelligence || 5;
    this.firingRate = data.firingRate || 5;
  }

  /**
   * Performs a single update tick of this SpinningGun instance.
   */
  doTick() {
    var me = this;
    function shoot(random) {
      if (Math.floor(Math.random() * 10) <= me.firingRate) {
        var direction = random ? Direction.random() : me.getPlayerDirection();
        ThingFactory.shoot(me.board, me.point.add(direction), direction);
      }
    }

    this.animationIndex += 1;
    if (this.animationIndex >= SpinningGun.animationFrames.length) {
      this.animationIndex = 0;
    }
    this.spriteIndex = SpinningGun.animationFrames[this.animationIndex];

    if (Math.floor(Math.random() * 9) <= this.intelligence) {
      if (this.isPlayerAligned(2)) {
        shoot();
      }
    } else {
      shoot(true);
    }
  }



}
SpinningGun.animationFrames = [24, 26, 25, 27];


defineThing('SpinningGun', SpinningGun);
export { SpinningGun };
