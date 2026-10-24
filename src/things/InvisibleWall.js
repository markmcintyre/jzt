import { Colors } from '../graphics.js';
import { things } from './thing-registry.js';

import { Thing } from './Thing.js';


class InvisibleWall extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 0;
    this.foreground = Colors.BrightGreen;
  }
  /**
   * Delivers a provided message to this Thing. If a TOUCH message is received,
   * then this Thing will turn into a Wall Thing.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    var replacement;

    if (message === 'TOUCH') {
      replacement = new things.Wall(this.board);
      replacement.foreground = this.foreground;
      replacement.background = this.background;
      this.oneTimeMessage('status.invisible');
      this.board.replaceTile(this.point, replacement);
      this.play('t--dc');
    }
  }

  /**
   * Returns a sprite index to be used to represent this InvisibleWall.
   * If we detect that we are in a game editor, 176 will be used. Otherwise, 0.
   *
   * @return A sprite index.
   */
  getSpriteIndex() {
    return this.board.game.isEditor ? 176 : 0;
  }
}


export { InvisibleWall };
