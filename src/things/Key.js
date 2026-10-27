import { Colors } from '../graphics.js';
import { getMessage } from '../i18n.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Key extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 12;
    this.background = undefined;
    this.foreground = Colors.BrightBlue;
    this.conveyable = true;
  }
  deserialize(data) {
    super.deserialize(data);

    // Keys can only be bright colors
    this.foreground = this.foreground.lighten();

    // Grey and flashing keys don't exist either, so assume white
    if (this.foreground.cycles || this.foreground === Colors.Grey) {
      this.foreground = Colors.BrightWhite;
    }

    this.background = undefined;
  }

  /**
   * Delivers a provided message to this Thing. If a TOUCH message is
   * received, then this Key will be collected, if an existing Key of this
   * type has not already been collected.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    var keyType;

    if (message === 'TOUCH') {
      // Get a readable description of this key type
      keyType = getMessage('keys.' + this.foreground.code);

      // Determine if the player has the key already
      if (this.getCounterValue('KEY' + this.foreground.code) > 0) {
        // The player already has this key type
        this.board.setDisplayMessage(getMessage('keys.toomany', keyType));
        this.play('sc-c');
      } else {
        // The player doesn't yet have the right key type
        this.remove();
        this.adjustCounter('KEY' + this.foreground.code, 1);
        this.board.setDisplayMessage(getMessage('keys.collect', keyType));
        this.play('t+cegcegceg+sc');
      }
    }
  }

  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   */
  push(direction, pusher) {
    if (pusher && pusher.type === 'Player') {
      return;
    } else if (pusher && pusher.type === 'River') {
      this.move(direction, true);
    } else if (this.move(direction)) {
      this.play('t--f', false, true);
    }
  }


}

defineThing('Key', Key);
export { Key };
