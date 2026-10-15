export class EndCommand {
    constructor() {

    }

    execute(owner) {
    owner.scriptContext.stop();

    }
}
