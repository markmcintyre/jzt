import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class SliderEw extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 29;
    this.background = undefined;
    this.foreground = Colors.BrightWhite;
  }
  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   */
  push(direction) {
    if (direction.equals(Direction.East) || direction.equals(Direction.West)) {
      if (this.move(direction)) {
        this.play('t--f', false, true);
      }
    }
  }

}


export { SliderEw };
