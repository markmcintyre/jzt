import * as commands from './jzt-script-commands.js';
import { JztScriptParser } from './jzt-script-parser.js';
import { GameState } from './game-state.js';
const scriptParser = new JztScriptParser();

/**
 * JZTScript
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node:true */

/**
 * JztScript
 */

export class JztScript {
    constructor(name, rawScript, compileImmediately) {

    this.name = name;
    this.rawScript = rawScript;
    this.labelIndicies = {};
    this.commands = [];

    if (compileImmediately) {
        this.compile();
    }


    }

    compile() {

    var index,
        element,
        commandStack = scriptParser.parse(this.rawScript);

    /**
     * Adds a provided label to this JztScript to be associated with a provided
     * command index.
     *
     * @param label A name of a label
     * @param commandIndex A numeric index
     */
    function addLabel(owner, label, commandIndex) {
        // If no command index was provided, use the current command position
        commandIndex = commandIndex === undefined ? owner.commands.length : commandIndex;

        // Have we seen this label before?
        if (owner.labelIndicies.hasOwnProperty(label.name)) {

            // The label already exists, so push the new label
            // to the stack
            owner.labelIndicies[label.name].push(commandIndex);

        } else {

            // We've got a new label
            owner.labelIndicies[label.name] = [commandIndex];

        }
    }

    // Put the commands into our target
    for (index = 0; index < commandStack.length; index += 1) {

        // Grab our next element
        element = commandStack[index];

        // What do we have, exactly?
        if (element instanceof commands.Label) {

            // It's a label. Add it.
            addLabel(this, element);

        } else if (typeof element.execute === 'function') {

            // We've got an executable item
            this.commands.push(element);

        } else {

            // We've got something else. Something... unexpected!
            throw 'Catestrophic script error. Unexpected object in command stack.';

        }

    }


    }

    getCommand(index) {
    return this.commands[index];

    }

    serialize() {
    return {
        name: this.name,
        rawScript: this.rawScript
    };

    }
}
