import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Lava extends Thing {
  constructor(board) {
    super(board);
    this.background = Colors.BrightRed;
    this.foreground = Colors.BrightRed;
    this.cycleCount = 0;
    this.cycleRate = board.game.CYCLE_RATE * 5;
    this.spriteIndex = 176;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = Colors.BrightRed;
    this.foreground = Colors.BrightRed;
  }

  updateWhileUnder() {
    var thing = this.board.getTile(this.point);

    // If there's nothing on us, there's nothing to do
    if (!thing) {
      return;
    }

    // If a player stepped on the lava...
    if (thing.type === 'Player') {
      // Damage the player every five cycles
      this.cycleCount += 1;
      if (this.cycleCount > this.cycleRate) {
        this.cycleCount = 0;
        thing.sendMessage('SHOT');
      }
    } else if (thing.type === 'Scriptable') {
      // Scriptables get sent a LAVA message
      thing.sendMessage('LAVA');
    } else if (!thing.lavaWalker) {
      // Anything else that's not a lava walker, gets
      // sent a SHOT message immediately.
      thing.sendMessage('SHOT');
    }
  }

  sendMessage(message) {
    if (message === 'TOUCH') {
      this.cycleCount = 0;
      this.board.player.sendMessage('SHOT');
    }
  }

  isSurrenderable() {
    return true;
  }
}

defineThing('Lava', Lava);
export { Lava };
