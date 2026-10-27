import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class Gem extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 4;
    this.background = undefined;
    this.foreground = Colors.BrightMagenta;
    this.conveyable = true;
  }
  /**
   * Delivers a provided message to this Thing. If a TOUCH message is received,
   * then the game's Gems counter will increase by 1, the health counter will increase
   * by 1, and the score counter will inrease by 10.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.oneTimeMessage('status.gem');
      this.remove();
      this.adjustCounter('HEALTH', 1);
      this.adjustCounter('GEMS', 1);
      this.adjustCounter('SCORE', 10);
      this.play('t+c-gec');
    } else if (message === 'SHOT' || message === 'BOMBED') {
      this.remove();
      this.play('t-c');
    }
  }

  /**
   * Pushes this Gem in a provided direction. If this Gem cannot be pushed,
   * then it will be squished and removed from its owner Board.
   *
   * @param direction A direction in which to push this Gem.
   */
  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (!this.move(direction)) {
      this.remove();
    }
  }
}


export { Gem };
