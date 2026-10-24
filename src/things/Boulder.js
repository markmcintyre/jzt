
import { Thing } from './Thing.js';


class Boulder extends Thing {
  constructor(board) {
    super(board);
    this.conveyable = true;
    this.spriteIndex = 254;
  }
  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   */
  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (this.move(direction)) {
      this.play('t--f', false, true);
    }
  }
}


export { Boulder };
