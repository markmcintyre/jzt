import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class FakeWall extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 178;
    this.foreground = Colors.Yellow;
    this.background = Colors.Black;
  }

  /**
   * Returns whether or not this FakeWall is surrenderable to another thing.
   *
   * @param sender Another Thing that is requesting this Thing to surrender
   * @return true if this Thing is willing to surrender its position.
   */
  isSurrenderable() {
    return true;
  }

  /**
   * Retrieves a sprite index used to represent this FakeWall on a rendered
   * Board. If this FakeWall's owner board's game is in debug mode, then a visible
   * representation will be used.
   */
  getSpriteIndex() {
    return this.board.game.isEditor ? 176 : 178;
  }
}


export { FakeWall };
