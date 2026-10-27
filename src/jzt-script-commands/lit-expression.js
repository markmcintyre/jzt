export class LitExpression {
    constructor() {

    }

    getResult(owner) {
    return owner.board.isLit(owner.point, undefined, true);

    }
}
