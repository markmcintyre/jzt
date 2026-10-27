import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class GeoFence extends Thing {
  constructor(board) {
    super(board);
    this.foreground = Colors.Grey;
    this.background = undefined;
  }
  isSurrenderable(sender) {
    if (sender && GeoFence.restrictions.indexOf(sender.type) < 0) {
      return true;
    }
  }

  /**
   * Returns a sprite index to be used to represent this GeoFence.
   * If we detect that we are in a game editor, 176 will be used. Otherwise, 0.
   *
   * @return A sprite index.
   */
  getSpriteIndex() {
    return this.board.game.isEditor ? 176 : 0;
  }
}
GeoFence.restrictions = ['Scriptable', 'Lion', 'Tiger', 'Bear', 'Ruffian', 'Centipede', 'Spider', 'Snake'];



export { GeoFence };
