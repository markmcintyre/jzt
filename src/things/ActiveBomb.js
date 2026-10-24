import { things } from './thing-registry.js';

import { UpdateableThing } from './UpdateableThing.js';


class ActiveBomb extends UpdateableThing {
  constructor(board) {
    super(board);
    this.timeToLive = 9;
    this.speed = 6;
    this.spriteIndex = 57;
    this.radius = 4;
    this.conveyable = true;
  }
  serialize() {
    var result = super.serialize();
    result.timeToLive = this.timeToLive;
    result.radius = this.radius;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.timeToLive = data.timeToLive || 9;
    this.radius = data.radius || 4;
  }

  push(direction) {
    this.move(direction);
  }

  getSpriteIndex() {
    return 57 - (9 - this.timeToLive);
  }

  doTick() {
    var explosion;
    this.play(this.timeToLive % 2 ? '8' : '5');

    this.timeToLive -= 1;
    if (this.timeToLive < 0) {
      explosion = new things.Explosion(this.board);
      explosion.radius = this.radius;
      this.board.replaceTile(this.point, explosion);
    }
  }
}


export { ActiveBomb };
