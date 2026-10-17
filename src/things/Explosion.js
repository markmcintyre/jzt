import { utilities } from '../basic.js';
import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class Explosion extends UpdateableThing {
  constructor(board) {
    super(board);
    this.radius = 4;
    this.timeToLive = Explosion.MAX_TTL;
    this.speed = 1;
    this.spriteIndex = 0;
  }
  deserialize(data) {
    super.deserialize(data);
    this.radius = data.radius || 4;
    this.timeToLive = data.timeToLive || Explosion.MAX_TTL;
  }

  serialize() {
    var result = super.serialize();
    result.radius = this.radius;
    result.timeToLive = this.timeToLive;
    return result;
  }

  doTick() {
    var points, index, tile;

    // If we're at the start of our explosion, send a BOMBED message to all affected Things
    if (this.timeToLive === Explosion.MAX_TTL) {
      this.play('t+++c-c-c-c-c-c', true);

      points = utilities.pointsInCircle(this.point, this.radius);

      for (index = 0; index < points.length; index += 1) {
        tile = this.board.getTile(points[index]);
        if (tile) {
          tile.sendMessage('BOMBED');
        }
      }
    }

    // After our time to live, remove ourselves
    this.timeToLive -= 1;
    if (this.timeToLive <= 0) {
      this.remove();
    }
  }

  getTorch() {
    return {
      radius:Math.round((this.radius * this.timeToLive) / (Explosion.MAX_TTL - 1)) + 2
    };
  }

  render(context) {
    var points,
      index,
      sprite = this.board.game.resources.graphics.getSprite(
        176 + Math.round((2 * this.timeToLive) / Explosion.MAX_TTL),
      ),
      radius;

    if (this.timeToLive === Explosion.MAX_TTL) {
      radius = Math.round(this.radius / 2);
    } else {
      radius = Math.round((this.radius * this.timeToLive) / (Explosion.MAX_TTL - 1));
    }

    points = utilities.pointsInCircle(this.point, radius);

    for (index = 0; index < points.length; index += 1) {
      sprite.draw(context, points[index].subtract(this.board.windowOrigin), Colors.Yellow, Colors.Red);
    }
  }
}
Explosion.MAX_TTL = 5;


defineThing('Explosion', Explosion);
export { Explosion };
