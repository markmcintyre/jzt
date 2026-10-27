export class SetCommand {
    constructor(counter, value) {
    this.counter = counter;
    this.value = value;

    }

    execute(owner) {
    owner.board.game.setCounterValue(this.counter, this.value);

    }
}
