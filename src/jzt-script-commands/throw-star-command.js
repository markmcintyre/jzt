import { ThingFactory } from './shared.js';

export class ThrowStarCommand {
    constructor(directionExpression) {
    this.directionExpression = directionExpression;

    }

    execute(owner) {
    // Get our final direction
    var direction = this.directionExpression.getResult(owner);

    // If a direction is available
    if (direction) {

        // Shoot
        ThingFactory.shoot(owner.board, owner.point.add(direction), direction, false, true);

    }

    }
}
