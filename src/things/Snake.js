import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class Snake extends UpdateableThing {
  constructor(board) {
    super(board);
    this.spriteIndex = 235;
    this.background = undefined;
    this.foreground = Colors.Green;
    this.conveyable = true;
    this.speed = 3;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  /**
   * Attempts to push this Snake in a provided direction.
   */
  push(direction, pusher) {
    if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (!this.move(direction)) {
      this.play('t+c---c++++c--c');
      this.remove();
    }
  }

  /**
   * Sends a provided message to this Snake.
   *
   * @param message A message to be delivered to this Snake.
   */
  sendMessage(message) {
    if (message === 'SHOT' || message === 'BOMBED') {
      this.play('t+c---c++++c--c', true);
      this.adjustCounter('SCORE', 10);
      this.remove();
    } else if (message === 'TOUCH') {
      this.board.player.sendMessage('SHOT');
      this.remove();
    }
  }

  /**
   * Updates this Snake. This Snake will move itself along the board's current
   * smart path directly toward the player, going around walls and obstacles.
   * If there is no direct path to the player (including through bullets and
   * other baddies), then it will rest in place.
   */
  doTick() {
    var direction = this.getSmartDirection(),
      thing;

    if (direction) {
      this.foreground = Colors.BrightGreen;

      thing = this.board.getTile(this.point.add(direction));
      if (thing && thing.type === 'Player') {
        thing.sendMessage('SHOT');
        this.remove();
        return;
      }
      this.move(direction, true);
    } else {
      this.foreground = Colors.Green;
    }
  }
}


export { Snake };
