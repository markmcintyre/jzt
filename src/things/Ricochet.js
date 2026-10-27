import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Ricochet extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 42;
    this.background = undefined;
    this.foreground = Colors.BrightGreen;
  }
  /**
   * Serializes this Ricochet to a data object.
   */

  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  /**
   * Deserializes this Ricochet from a data object.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightGreen;
  }

}

defineThing('Ricochet', Ricochet);
export { Ricochet };
