import { ThingFactory } from './shared.js';

export class BecomeCommand {
    constructor(thingTemplate) {

    this.thingTemplate = thingTemplate;


    }

    execute(owner) {

    // Create our new thing
    var newThing = ThingFactory.deserialize(this.thingTemplate, owner.board);


    // Replace our owner's tile with the new thing
    owner.board.replaceTile(owner.point, newThing);


    }
}
