import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class SpiderWeb extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = undefined;
    this.foreground = Colors.Grey;
    this.background = undefined;
  }

  /**
   * Retrieves a sprite index to be used as a visual representation of this SpiderWeb.
   * The index returned depends on the surrounings of this SpiderWeb, which will appear
   * to connect with adjacent spider webs.
   */
  getSpriteIndex() {
    if (this.spriteIndex !== undefined && !this.board.game.isEditor) {
      return this.spriteIndex;
    }

    function isLineAdjacent(source, direction) {
      var tile = source.board.getTile(source.point.add(direction));
      return tile && (tile.type === 'SpiderWeb' || (tile.under && tile.under.type === 'SpiderWeb'));
    }

    var surroundingPattern = '';
    surroundingPattern += isLineAdjacent(this, Direction.North) ? 'N' : '';
    surroundingPattern += isLineAdjacent(this, Direction.East) ? 'E' : '';
    surroundingPattern += isLineAdjacent(this, Direction.South) ? 'S' : '';
    surroundingPattern += isLineAdjacent(this, Direction.West) ? 'W' : '';

    this.spriteIndex = SpiderWeb.lineMap[surroundingPattern];
    return this.spriteIndex;
  }

  /**
   * Returns whether or not this SpiderWeb is surrenderable to another thing.
   *
   * @param sender Another Thing that is requesting this Thing to surrender
   * @return true if this Thing is willing to surrender its position.
   */
  isSurrenderable() {
    return true;
  }
}
SpiderWeb.lineMap = {
  '': 249,
  N: 179,
  E: 196,
  S: 179,
  W: 196,
  NE: 192,
  NS: 179,
  NW: 217,
  ES: 218,
  EW: 196,
  SW: 191,
  NES: 195,
  NEW: 193,
  NSW: 180,
  ESW: 194,
  NESW: 197
};


defineThing('SpiderWeb', SpiderWeb);
export { SpiderWeb };
