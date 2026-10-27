export class CharCommand {
    constructor(value) {
    this.value = value;

    }

    execute(owner) {
    owner.spriteIndex = this.value;

    }
}
