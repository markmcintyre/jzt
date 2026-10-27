import { CommandResult } from './shared.js';

export class ChangeCommand {
    constructor(fromTemplate, toTemplate) {

    this.fromTemplate = fromTemplate;
    this.toTemplate = toTemplate;

    }

    execute(owner) {
    owner.board.changeTiles(this.fromTemplate, this.toTemplate);
    return CommandResult.CONTINUE;

    }
}
