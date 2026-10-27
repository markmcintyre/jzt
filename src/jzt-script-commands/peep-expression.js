export class PeepExpression {
    constructor(radius) {
    this.radius = radius;

    }

    getResult(owner) {
    return owner.isPlayerVisible(this.radius);

    }
}
