export class TestingExpression {
    constructor(counter, operand, value) {
    this.counter = counter;
    this.operand = operand;
    this.value = value;

    }

    getResult(owner) {

    // Get our counter value
    var counterValue = owner.getCounterValue(this.counter);

    switch (this.operand) {
    case '>':
        return counterValue > this.value;
    case '<':
        return counterValue < this.value;
    case '>=':
        return counterValue >= this.value;
    case '<=':
        return counterValue <= this.value;
    case '=':
        return counterValue === this.value;
    }

    return undefined;

    }
}
