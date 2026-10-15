import { CommandResult } from './shared.js';

export class RestoreCommand {
    constructor(label) {
    this.label = label;

    }

    execute(owner) {
    owner.scriptContext.restoreLabel(this.label);
    return CommandResult.CONTINUE;

    }
}
