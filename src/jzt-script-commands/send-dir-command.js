export class SendDirCommand {
    constructor(directionExpression, message) {
    this.directionExpression = directionExpression;
    this.message = message;

    }

    execute(owner) {

    // Get our final direction
    var direction = this.directionExpression.getResult(owner);

    // If a direction is valid...
    if (direction) {

        // Get the resulting tile
        var tile = owner.board.getTile(owner.point.add(direction));

        // If it exists, send it a message
        if (tile) {
            tile.sendMessage(this.message);
        }

    }
    


    }
}
