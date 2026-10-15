import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Ammo extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 132;
    this.background = undefined;
    this.foreground = Colors.Cyan;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.Cyan;
  }

  /**
   * Pushes this Ammo in a provided direction on its owner Board.
   *
   * @param direction A direction in which to push this Ammo
   */
  push(direction) {
    this.move(direction);
  }

  /**
   * Sends a provided message to this Ammo instance. If a TOUCH message is received
   * then this Ammo instance will be removed and increase the Game's 'ammo' counter
   * by five units.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.oneTimeMessage('status.ammo');
      this.play('tcc#d');
      this.adjustCounter('AMMO', 5);
      this.remove();
    }
  }
}

defineThing('Ammo', Ammo);
export { Ammo };
