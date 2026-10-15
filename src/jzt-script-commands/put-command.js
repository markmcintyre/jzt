import { ThingFactory } from './shared.js';

export class PutCommand {
    constructor(thingTemplate, directionExpression) {
    this.thingTemplate = thingTemplate;
    this.directionExpression = directionExpression;

    }

    execute(owner) {

    var newThing,
        direction = this.directionExpression.getResult(owner),
        point = owner.point.add(direction),
        isFreeSpace;

    // If our point is off the board, return immediately
    if (owner.board.isOutside(point)) {
        return;
    }

    // Create our new thing
    newThing = ThingFactory.deserialize(this.thingTemplate, owner.board);

    if (newThing) {

        // Give whatever's in the way a nudge first
        owner.board.moveTile(owner.point, point, false, true);

        // If the space is free to put something, do it
        if (owner.board.isFreeOrSurrenderable(point)) {
            owner.board.addThing(point, newThing, true);
        }

    } else {

        if (!owner.board.player.point.equals(point)) {
            owner.board.deleteTile(point);
        }

    }


    }
}
