import { Colors } from '../graphics.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Passage extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 240;
    this.foreground = Colors.BrightWhite;
    this.background = Colors.Blue;
    this.targetBoard = undefined;
    this.passageId = 0;
    this.glow = true;
  }
  /**
   * Delivers a provided message to this Thing. If a TOUCH message is received,
   * then this Passage will move the player to a matching Passage on its target board.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    if (message === 'TOUCH') {
      this.play('tceg tc#fg# tdf#a td#ga# teg#+c');
      this.board.game.movePlayerToPassage(this.passageId, this.targetBoard);
    }
  }

  /**
   * Serializes this Passage to an Object.
   *
   * @return A serialized Passage
   */
  serialize() {
    var result = super.serialize();
    result.passageId = this.passageId;
    result.targetBoard = this.targetBoard;
    return result;
  }

  /**
   * Deserializes a provided data Object into a Passage.
   *
   * @param data A data object to be deserialized into a Passage.
   */
  deserialize(data) {
    super.deserialize(data);
    this.foreground = Colors.BrightWhite;
    if (!this.background) {
      this.background = Colors.Blue;
    }
    this.targetBoard = data.targetBoard;
    this.passageId = data.passageId;
  }



}

defineThing('Passage', Passage);
export { Passage };
