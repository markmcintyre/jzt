import { CommandResult } from './shared.js';

export class LockCommand {
    constructor() {

    }

    execute(owner) {
    owner.locked = true;
    return CommandResult.CONTINUE;

    }
}
