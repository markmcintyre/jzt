export class NotExpression {
    constructor(expression) {
    this.subExpression = expression;

    }

    getResult(owner) {
    return !this.subExpression.getResult(owner);

    }
}
