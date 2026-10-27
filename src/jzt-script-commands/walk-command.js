import { CommandResult } from './shared.js';

export class WalkCommand {
    constructor(directionExpression) {
    this.directionExpression = directionExpression;

    }

    execute(owner) {
    var direction = this.directionExpression.getResult(owner);
    owner.walkDirection = direction;
    return CommandResult.CONTINUE;

    }
}
