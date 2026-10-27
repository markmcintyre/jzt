import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class Torch extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 157;
    this.glow = true;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.Brown;
  }

  /**
   * Pushes this Torch in a provided direction on its owner Board.
   *
   * @param direction A direction in which to push this Torch
   */
  push(direction) {
    this.move(direction);
  }

  /**
   * Sends a provided message to this Torch instance. If a TOUCH message is received
   * then this Torch instance will be removed and increase the Game's 'torches' counter
   * by five units.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.oneTimeMessage('status.torch');
      this.play('tcase');
      this.adjustCounter('TORCHES', 1);
      this.remove();
    }
  }


}


export { Torch };
