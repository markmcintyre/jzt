export class ColorCommand {
    constructor(newForeground) {
    this.newForeground = newForeground;

    }

    execute(owner) {
    owner.foreground = this.newForeground;

    }
}
