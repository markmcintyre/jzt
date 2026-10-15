export class DirectionExpression {
    constructor(terminal) {

    this.modifiers = [];
    this.terminal = terminal;
    this.count = 1;

    }

    getResult(owner) {

    // Get our direction from our expression
    var direction = this.terminal.process(owner),
        modifiers = this.modifiers.slice(0);

    while (modifiers.length) {
        direction = modifiers.pop().process(direction);
    }

    // Return our result
    return direction;

    }
}
