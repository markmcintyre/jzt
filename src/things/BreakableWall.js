import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class BreakableWall extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 177;
    this.background = Colors.Black;
    this.foreground = Colors.BrightCyan;
  }
  /**
   * Sends a provided message to this BreakableWall. If a SHOT message
   * is received, then this BreakableWall will vanish.
   *
   * @param message A message to receive.
   */
  sendMessage(message) {
    if (message === 'SHOT' || message === 'BOMBED') {
      this.play('t-c');
      this.remove();
    } else if (message === 'TOUCH') {
      this.oneTimeMessage('status.breakable');
    }
  }
}

defineThing('BreakableWall', BreakableWall);
export { BreakableWall };
