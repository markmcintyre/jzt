import { CommandResult } from './shared.js';

export class TakeCommand {
    constructor(counter, value, label) {
    this.counter = counter;
    this.value = value;
    this.label = label;

    }

    execute(owner) {

    // Depending on if there's enough counter available to take...
    if (owner.board.game.getCounterValue(this.counter) < this.value) {

        // There isn't enough counter, so if we've got a label...
        if (this.label) {

            // Jump!
            owner.scriptContext.jumpToLabel(this.label);
            return CommandResult.CONTINUE_AFTER_JUMP;

        }

    } else {

        // Take away our counter value
        owner.board.game.adjustCounter(this.counter, -1 * this.value);
        return CommandResult.CONTINUE;

    }

    }
}
