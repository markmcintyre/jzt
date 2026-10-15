import { things } from './thing-registry.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Bomb extends Thing {
  constructor(board) {
    super(board);
    this.radius = 4;
    this.spriteIndex = 11;
    this.conveyable = true;
  }
  deserialize(data) {
    super.deserialize(data);
    this.radius = data.radius || 4;
  }

  serialize() {
    var result = super.serialize();
    result.radius = this.radius;
    return result;
  }

  push(direction) {
    this.move(direction);
  }

  sendMessage(message) {
    var bomb;
    if (message === 'TOUCH') {
      this.play('tcf+cf+c');
      bomb = new things.ActiveBomb(this.board);
      bomb.radius = this.radius;
      bomb.foreground = this.foreground;
      bomb.background = this.background;
      this.board.replaceTile(this.point, bomb);
    }
  }
}

defineThing('Bomb', Bomb);
export { Bomb };
