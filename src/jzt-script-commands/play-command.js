import { CommandResult } from './shared.js';

export class PlayCommand {
    constructor(sequence) {
    this.sequence = sequence;

    }

    execute(owner) {
    owner.play(this.sequence, true);
    return CommandResult.CONTINUE;

    }
}
