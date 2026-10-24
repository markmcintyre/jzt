import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';
import { Thing } from './Thing.js';


class River extends Thing {
  constructor(board) {
    super(board);
    this.direction = Direction.North;
    this.background = Colors.Blue;
    this.foreground = Colors.BrightBlue;
    this.speed = 1;
    this.initialize();
  }
  initialize() {
    switch (Direction.getShortName(this.direction)) {
      case 'N':
        this.spriteIndex = 30;
        break;
      case 'E':
        this.spriteIndex = 16;
        break;
      case 'S':
        this.spriteIndex = 31;
        break;
      case 'W':
        this.spriteIndex = 17;
        break;
    }
  }

  updateWhileUnder() {
    UpdateableThing.prototype.update.call(this);
  }

  doTick() {
    var thing = this.board.getTile(this.point);

    if (thing.conveyable) {
      thing.push(this.direction, this);
    }
  }

  isSurrenderable() {
    return true;
  }

  serialize() {
    var result = UpdateableThing.prototype.serialize.call(this);
    delete result.color;
    delete result.speed;
    result.direction = Direction.getShortName(this.direction);
    return result;
  }

  deserialize(data) {
    UpdateableThing.prototype.deserialize.call(this, data);
    this.background = Colors.Blue;
    this.foreground = Colors.BrightBlue;
    if (data.direction) {
      this.direction = Direction.fromName(data.direction);
    }
    this.initialize();
  }
}


export { River };
