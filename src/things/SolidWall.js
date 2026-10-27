import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class SolidWall extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 219;
  }
}

defineThing('SolidWall', SolidWall);
export { SolidWall };
