import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Wall extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 178;
  }
}

defineThing('Wall', Wall);
export { Wall };
