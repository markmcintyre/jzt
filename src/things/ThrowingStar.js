import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class ThrowingStar extends UpdateableThing {
  constructor(board) {
    super(board);
    this.speed = 1;
    this.spriteIndex = 179;
    this.animationIndex = Math.floor(Math.random() * ThrowingStar.animationFrames.length - 1);
    this.foreground = Colors.Cycle;
    this.timeToLive = 255;
    this.nextMove = Math.floor(Math.random() * 2);
  }
  /**
   * Serializes this ThrowingStar into a data object.
   *
   * @return A data object representing a serialized ThrowingStar.
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.timeToLive = this.timeToLive;
    return result;
  }

  /**
   * Deserializes a provided data object to configure this ThrowingStar instance.
   *
   * @param A data object representing a serialized ThrowingStar.
   */
  deserialize(data) {
    super.deserialize(data);
    this.foreground = Colors.Cycle;
    this.background = undefined;
    this.timeToLive = data.timeToLive || 100;
  }

  /**
   * Sends a provided message to this ThrowingStar instance.
   *
   * @param message A message to send to this ThrowingStar.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.board.player.sendMessage('SHOT');
      this.remove();
    }
  }

  /**
   * Performs a single update tick of this ThrowingStar instance.
   */
  doTick() {
    var direction, thing;

    this.timeToLive -= 1;
    if (this.timeToLive <= 0) {
      this.remove();
      return;
    }

    this.animationIndex += 1;
    if (this.animationIndex >= ThrowingStar.animationFrames.length) {
      this.animationIndex = 0;
    }
    this.spriteIndex = ThrowingStar.animationFrames[this.animationIndex];

    this.nextMove -= 1;
    if (this.nextMove <= 0) {
      this.nextMove = 2;

      direction = this.getPlayerDirection();
      thing = this.board.getTile(this.point.add(direction));
      if (thing && (thing.type === 'BreakableWall' || thing.type === 'Player')) {
        thing.sendMessage('SHOT');
        this.remove();
        return;
      }
      this.move(this.getPlayerDirection());
    }
  }




}
ThrowingStar.animationFrames = [179, 47, 196, 92];



export { ThrowingStar };
