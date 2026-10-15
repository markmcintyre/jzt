export class TorchCommand {
    constructor(radius) {
    this.radius = radius;

    }

    execute(owner) {
    owner.setTorchRadius(this.radius);

    }
}
