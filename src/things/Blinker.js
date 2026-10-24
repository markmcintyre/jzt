import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';
import { things } from './thing-registry.js';

import { UpdateableThing } from './UpdateableThing.js';


class Blinker extends UpdateableThing {
  constructor(board) {
    super(board);
    this.direction = Direction.North;
    this.period = 3;
    this.delay = 0;
    this.currentTick = 0;
    this.spriteIndex = 206;
    this.background = undefined;
    this.foreground = Colors.Yellow;
    this.blinkState = false;
  }
  serialize() {
    var result = super.serialize();
    result.period = this.period;
    result.delay = this.delay;
    result.direction = Direction.getShortName(this.direction);
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.cycleCount = 0;
    this.period = data.period || 3;
    this.delay = data.delay || 0;
    this.currentTick = this.period - this.delay - 1;
    this.direction = data.direction ? Direction.fromName(data.direction) : Direction.North;
  }

  doTick() {
    this.currentTick += 1;
    if (this.currentTick >= this.period) {
      this.currentTick = 0;
      this.blinkState = !this.blinkState;
      this.blink();
    }
  }

  blink() {
    var point = this.point,
      tile,
      moved;

    while (true) {
      // Increment our point of interest
      point = point.add(this.direction);

      // If it's off the board, stop immediately
      if (this.board.isOutside(point)) {
        break;
      }

      // Grab our tile of interest
      tile = this.board.getTile(point);

      // If we actually found a tile...
      if (tile) {
        if (!this.blinkState && tile.type === 'BlinkWall') {
          // We're not blinking, so remove the BlinkWall tile
          tile.remove();
        } else if (tile.type === 'Player') {
          // Harm the player
          tile.sendMessage('SHOT');

          // Shove the player out of the way if possible
          if (!tile.isBlocked(Direction.clockwise(this.direction))) {
            moved = tile.move(Direction.clockwise(this.direction));
          } else if (!tile.isBlocked(Direction.counterClockwise(this.direction))) {
            moved = tile.move(Direction.counterClockwise(this.direction));
          }

          // If we weren't able to move our player
          if (!moved) {
            break;
          }
        } else {
          // All other tiles aren't affected
          break;
        }
      }

      // If we are blinking...
      if (this.blinkState) {
        // Add a blinkwall
        this.board.addThing(point, this.createBlinkWall());
      }
    }
  }

  createBlinkWall() {
    var blinkWall = new things.BlinkWall(this.board);
    blinkWall.horizontal = this.direction === Direction.North || this.direction === Direction.South ? false : true;
    blinkWall.foreground = this.foreground;
    return blinkWall;
  }
}


export { Blinker };
