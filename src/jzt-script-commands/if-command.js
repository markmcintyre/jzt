import { CommandResult } from './shared.js';

export class IfCommand {
    constructor(label, expression) {
    this.label = label;
    this.expression = expression;

    }

    execute(owner) {
    if (this.expression.getResult(owner) && owner.scriptContext.jumpToLabel(this.label)) {
        return CommandResult.CONTINUE_AFTER_JUMP;
    }
    return CommandResult.CONTINUE;

    }
}
