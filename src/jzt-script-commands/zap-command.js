import { CommandResult } from './shared.js';

export class ZapCommand {
    constructor(label) {
    this.label = label;

    }

    execute(owner) {
    owner.scriptContext.zapLabel(this.label);
    return CommandResult.CONTINUE;

    }
}
