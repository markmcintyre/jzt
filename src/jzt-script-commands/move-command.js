import { BasicDirection, CommandResult } from './shared.js';

export class MoveCommand {
    constructor(directionExpression, forceful) {
    this.directionExpression = directionExpression;
    this.forceful = forceful;

    }

    execute(owner) {

    return this.forceful ? this.forcefulMove(owner) : this.move(owner);


    }

    move(owner) {

    var heap = owner.scriptContext.heap,
        direction = this.directionExpression.getResult(owner),
        count = '<count>';

    if (!heap[count]) {
        heap[count] = this.directionExpression.count;
    }

    // If a direction is available
    if (direction) {

        // Move and reduce our count by one
        owner.move(direction);
        heap[count] -= 1;

        // If we are to go a number of times...
        if (heap[count] > 0) {
            return CommandResult.REPEAT;
        } else {
            delete heap[count];
        }

    }


    }

    forcefulMove(owner) {

    var direction,
        heap = owner.scriptContext.heap,
        count = '<count>',
        stuck = '<stuck>',
        success;

    if (!heap[count]) {
        heap[count] = this.directionExpression.count;
    }


    // Depending on if we are stuck or not...
    if (!heap[stuck]) {
        // We're not stuck, so calculate our next direction
        direction = this.directionExpression.getResult(owner);
    } else {
        // We are stuck, continue trying that direction
        direction = BasicDirection.fromName(heap[stuck]);
    }

    // If a direction is available
    if (direction) {

        success = owner.move(direction);

        // If we were not successful, we're stuck
        if (!success) {

            heap[stuck] = BasicDirection.getShortName(direction);

            // We will try again until we're free
            return CommandResult.REPEAT;

        }

        // We aren't stuck, so count our moves down
        heap[count] -= 1;
        if (heap[count] > 0) {
            delete heap[stuck];
            return CommandResult.REPEAT;
        }

        // We're not moving anymore...
        delete heap[count];
        delete heap[stuck];

    }


    }
}
