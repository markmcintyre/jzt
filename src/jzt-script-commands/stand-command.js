export class StandCommand {
    constructor() {

    }

    execute(owner) {
    owner.pushable = false;
    owner.walkDirection = undefined;

    }
}
