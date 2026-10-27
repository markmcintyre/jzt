import { Colors } from '../graphics.js';
import { getMessage } from '../i18n.js';

import { Thing } from './Thing.js';


class Door extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 10;
    this.foreground = Colors.BrightWhite;
    this.background = Colors.Blue;
  }
  deserialize(data) {
    super.deserialize(data);
    this.foreground = Colors.BrightWhite;

    // Sanitize the color if necessary
    if (this.background) {
      if (this.background.isLight()) {
        this.background = this.background.darken();
      }

      if (this.background === Colors.Black) {
        this.background = Colors.White;
      }
    } else {
      this.background = Colors.Blue;
    }
  }

  /**
   * Delivers a provided message to this Thing. If a TOUCH message is received, then
   * this Door will vanish if an associated Key has been previously collected.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    var doorType, matchingKeyCode;

    if (message === 'TOUCH') {
      // Get a readable door description
      doorType = getMessage('doors.' + this.background.code);

      // Determine a matching key code
      matchingKeyCode = 'KEY' + this.background.lighten().code;

      if (this.getCounterValue(matchingKeyCode) > 0) {
        // The player has the right key type
        this.remove();
        this.adjustCounter(matchingKeyCode, -1);
        this.board.setDisplayMessage(getMessage('doors.open', doorType));
        this.play('tcgbcgb+ic');
      } else {
        // The Player does not have the correct key type
        this.board.setDisplayMessage(getMessage('doors.locked', doorType));
        this.play('t--gc');
      }
    }
  }
}


export { Door };
