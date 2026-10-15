import { GameState } from './shared.js';

export class VictoryCommand {
    constructor() {

    }

    execute(owner) {
    owner.board.game.setState(GameState.Victory);

    }
}
