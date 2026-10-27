export class BlockedExpression {
    constructor(directionExpression) {
    this.directionExpression = directionExpression;

    }

    getResult(owner) {
    return owner.isBlocked(this.directionExpression.getResult(owner));

    }
}
