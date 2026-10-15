import { CommandResult } from './shared.js';

export class UnlockCommand {
    constructor() {

    }

    execute(owner) {
    owner.locked = false;
    return CommandResult.CONTINUE;

    }
}
