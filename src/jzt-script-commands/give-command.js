import { CommandResult } from './shared.js';

export class GiveCommand {
    constructor(counter, amount) {
    this.counter = counter.toUpperCase();
    this.amount = amount;

    }

    execute(owner) {
    owner.board.game.adjustCounter(this.counter, this.amount);
    return CommandResult.CONTINUE;

    }
}
