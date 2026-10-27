import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class BlinkWall extends Thing {
  constructor(board) {
    super(board);
    this.horizontal = false;
    this.background = undefined;
    this.foreground = Colors.Yellow;
  }
  serialize() {
    var result = super.serialize();
    if (this.horizontal) {
      result.horizontal = this.horizontal;
    }
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.horizontal = data.horizontal !== undefined ? data.horizontal : false;
  }

  getSpriteIndex() {
    return this.horizontal ? 205 : 186;
  }
}


export { BlinkWall };
