export class ExistsExpression {
    constructor(thingTemplate, count) {
    this.thingTemplate = thingTemplate;
    this.count = count;

    }

    getResult(owner) {
    return owner.board.hasTile(this.thingTemplate, this.count);

    }
}
