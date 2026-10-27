import { CommandResult } from './shared.js';

export class WaitCommand {
    constructor(count) {
    this.count = count;

    }

    execute(owner) {

    var heap = owner.scriptContext.heap,
        cycles = '<cycles>';

    if (!heap[cycles]) {
        heap[cycles] = this.count;
    }

    heap[cycles] -= 1;
    if (heap[cycles] > 0) {
        return CommandResult.REPEAT;
    }

    // If we've got no more heap cycles, delete it entirely
    delete heap[cycles];


    }
}
