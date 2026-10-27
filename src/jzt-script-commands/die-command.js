import { BasicDirection } from './shared.js';

export class DieCommand {
    constructor(magnetically) {
    this.magnetically = magnetically;

    }

    execute(owner) {
    owner.remove();
    if (this.magnetically) {
        owner.board.player.push(BasicDirection.opposite(owner.getPlayerDirection()));
    }

    }
}
