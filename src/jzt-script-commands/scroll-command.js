import { getBoardMessage, CommandResult } from './shared.js';

export class ScrollCommand {
    constructor(text, bold, label) {
    this.text = text;
    this.bold = bold;
    this.label = label;
    this.modifiesScroll = true;

    }

    execute(owner) {
    var message = getBoardMessage(owner.board, this.text);
    owner.scriptContext.addScrollContent(message, this.bold, this.label);
    return CommandResult.CONTINUE;

    }
}
