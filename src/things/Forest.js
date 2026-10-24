import { Colors } from '../graphics.js';

import { Thing } from './Thing.js';


class Forest extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 176;
    this.foreground = Colors.Black;
    this.background = Colors.Green;
  }

  /**
   * Serializes this Forest into a data object.
   */
  serialize() {
    var result = super.serialize();
    delete result.color;
    return result;
  }

  /**
   * Deserializes a provided data Object into Forest.
   *
   * @param data A data object to be deserialized into Forest.
   */
  deserialize(data) {
    super.deserialize(data);
    this.background = Colors.Green;
    this.foreground = Colors.Black;
  }

  /**
   * Delivers a provided message to this Thing. If a TOUCH message is received,
   * then this Forest will be deleted from the board, allowing movement onto its
   * space.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.oneTimeMessage('status.forest');

      this.play(Forest.noteCycle[Forest.noteIndex]);

      Forest.noteIndex += 1;

      if (Forest.noteIndex >= Forest.noteCycle.length) {
        Forest.noteIndex = 0;
      }

      this.board.deleteTile(this.point);
    }
  }
}
Forest.noteCycle = ['e', '-b', 'f#', 'b', 'f', 'c', 'g', '+c'];
Forest.noteIndex = 0;



export { Forest };
