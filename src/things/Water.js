import { Colors } from '../graphics.js';
import { getMessage } from '../i18n.js';

import { Thing } from './Thing.js';


class Water extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 176;
    this.background = Colors.BrightWhite;
    this.foreground = Colors.BrightBlue;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = Colors.BrightWhite;
    this.foreground = Colors.BrightBlue;
  }

  /**
   * Returns whether or not this Water is surrenderable to a provided
   * sender. Water will return true if the sender is a bullet or ThrowingStar,
   * but false otherwise.
   */
  isSurrenderable(sender) {
    if (sender && (sender.type === 'Bullet' || sender.type === 'ThrowingStar')) {
      return true;
    }
  }

  /**
   * Sends a provided message to this Water. If a TOUCH message is received, then
   * a sound effect is played and a message indicating that players cannot
   * move through water is shown.
   *
   * @param message A message to be delivered to this Water.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.play('t+c+c');
      this.board.setDisplayMessage(getMessage('obstacles.water'), 1);
    }
  }
}


export { Water };
