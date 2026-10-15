export class AlignedExpression {
    constructor(directionExpression) {
    this.directionExpression = directionExpression;

    }

    getResult(owner) {
    return this.directionExpression ? owner.isPlayerAligned(1, this.directionExpression.getResult(owner)) : owner.isPlayerAligned(1);

    }
}
