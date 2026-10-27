import { getBoardMessage, CommandResult } from './shared.js';

export class SayCommand {
    constructor(text) {
    this.text = text;

    }

    execute(owner) {
    var message = getBoardMessage(owner.board, this.text);
    owner.board.setDisplayMessage(message);
    return CommandResult.CONTINUE;

    }
}
