import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class LineWall extends Thing {
  constructor(board) {
    super(board);
    this.foreground = Colors.BrightBlue;
    this.spriteIndex = undefined;
  }
  /**
   * Retrieves a sprite index to be used when visually representing this LineWall on a rendered
   * game Board. The sprite index of this LineWall will depend on its surroundings, altering
   * its image when connecting LineWalls are found.
   */
  getSpriteIndex() {
    if (this.spriteIndex !== undefined && !this.board.game.isEditor) {
      return this.spriteIndex;
    }

    function isLineAdjacent(source, direction) {
      var tile = source.board.getTile(source.point.add(direction));
      return tile && tile.type === 'LineWall';
    }

    var surroundingPattern = '';
    surroundingPattern += isLineAdjacent(this, Direction.North) ? 'N' : '';
    surroundingPattern += isLineAdjacent(this, Direction.East) ? 'E' : '';
    surroundingPattern += isLineAdjacent(this, Direction.South) ? 'S' : '';
    surroundingPattern += isLineAdjacent(this, Direction.West) ? 'W' : '';

    this.spriteIndex = LineWall.lineMap[surroundingPattern];
    return this.spriteIndex;
  }

}
LineWall.lineMap = {
  '': 249,
  N: 208,
  E: 198,
  S: 210,
  W: 181,
  NE: 200,
  NS: 186,
  NW: 188,
  ES: 201,
  EW: 205,
  SW: 187,
  NES: 204,
  NEW: 202,
  NSW: 185,
  ESW: 203,
  NESW: 206
};



export { LineWall };
