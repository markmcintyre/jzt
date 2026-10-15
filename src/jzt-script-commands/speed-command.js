export class SpeedCommand {
    constructor(speed) {
    this.speed = speed || 3;

    }

    execute(owner) {
    owner.speed = this.speed;

    }
}
