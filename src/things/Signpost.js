import { Colors } from '../graphics.js';
import { GameState } from '../game-state.js';
import { getBoardMessage, getMessage } from '../i18n.js';
import { defineThing } from './thing-registry.js';
import { Thing } from './Thing.js';


class Signpost extends Thing {
  constructor(board) {
    super(board);
    this.spriteIndex = 209;
    this.background = undefined;
    this.foreground = Colors.Brown;
    this.text = undefined;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.text = this.text;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.Brown;
    this.text = data.text;
  }

  sendMessage(message) {
    var lines, index, text;

    if (message === 'TOUCH') {
      this.board.game.scroll.setTitle(getMessage('obstacles.signpost'));
      this.board.game.scroll.clearLines();

      if (!this.text) {
        this.text = getMessage('obstacles.signpostmessage');
      }

      lines = this.text.split('\n');
      for (index = 0; index < lines.length; index += 1) {
        text = getBoardMessage(this.board, lines[index]);
        this.board.game.scroll.addLine(text);
      }

      this.play('tc-c+d-d+e-e+f-f+g-g');
      this.board.game.setState(GameState.Reading);
    }
  }
}

defineThing('Signpost', Signpost);
export { Signpost };
