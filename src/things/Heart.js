import { Colors } from '../graphics.js';
import { getMessage } from '../i18n.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Heart extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 3;
    this.foreground = Colors.BrightRed;
    this.background = undefined;
    this.conveyable = true;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.foreground = Colors.BrightRed;
    this.background = undefined;
  }

  sendMessage(message) {
    if (message === 'TOUCH') {
      this.remove();
      this.play('tcefg+ceg');
      this.adjustCounter('HEALTH_MAX', 10);
      this.adjustCounter('HEALTH', 10);
      this.adjustCounter('SCORE', 500);
      this.board.setDisplayMessage(getMessage('status.heart'));
    }
  }

  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else {
      this.move(direction);
    }
  }
}

defineThing('Heart', Heart);
export { Heart };
