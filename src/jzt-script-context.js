/**
 * JZTScript Context
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var GameState = require('./game-state').GameState,
    commands = require('./jzt-script-commands');

/**
 * A ScriptContext is a context in which a script can run, including an associated
 * Scriptable, a current execution index, labels, and more.
 *
 * @param script A script which this ScriptContext is set to execute.
 * @param owner A Scriptable to own this ScriptContext.
 */
function JztScriptContext(script, owner) {
    this.owner = owner;
    this.script = script;
    this.commandIndex = 0;
    this.currentLabels = {};
    this.heap = {};
    this.initializeLabels(script);
    this.scrollContent = [];
    this.jumpCount = 0;
}

/**
 * Serializes this JztScriptContext to a data object.
 *
 * @return A data object representing this JztScriptContext.
 */
JztScriptContext.prototype.serialize = function () {

    var result = {},
        label;
    result.commandIndex = this.commandIndex;
    result.currentLabels = {};
    result.heap = this.heap;
    for (label in this.currentLabels) {
        if (this.currentLabels.hasOwnProperty(label) && this.currentLabels[label]) {
            result.currentLabels[label] = this.currentLabels[label];
        }
    }

    return result;

};

/**
 * De-serializes a provided data object to initialize this JztScriptContext.
 *
 * @param data A serialized JztScriptContext.
 */
JztScriptContext.prototype.deserialize = function (data) {

    var label;

    this.commandIndex = data.commandIndex;
    this.heap = data.heap;
    for (label in data.currentLabels) {
        if (data.currentLabels.hasOwnProperty(label)) {
            this.currentLabels[label] = data.currentLabels[label];
        }
    }

};

/**
 * Determines whether or not we are in a default state for this JztScriptContext.
 * A script context that's in its default state has no need of being serialized.
 *
 * @return true if in a default state, false otherwise.
 */
JztScriptContext.prototype.inDefaultState = function () {

    var defaultState = true,
        labelIndex;

    // Look for evidence that we're not in a default state
    if (this.commandIndex > 0) {

        // We aren't at the first command
        defaultState = false;

    } else if (Object.keys(this.heap).length > 0) {

        // The heap is not empty
        defaultState = false;

    } else {

        // We have some non-zero label indicies
        for (labelIndex in this.currentLabels) {
            if (this.currentLabels.hasOwnProperty(labelIndex) && this.currentLabels[labelIndex] !== 0) {
                defaultState = false;
                break;
            }
        }

    }

    return defaultState;

};

/**
 * Initializes this JztScriptContext's labels to that of a provided Script instance.
 *
 * @param script A Script used to initialize this JztScriptContext's labels.
 */
JztScriptContext.prototype.initializeLabels = function (script) {
    var label;
    for (label in script.labelIndicies) {
        if (script.labelIndicies.hasOwnProperty(label)) {
            this.currentLabels[label] = 0;
        }
    }
};

/**
 * Retrieves whether or not this JztScriptContext is currently running.
 *
 * @return true if this JztScriptContext is running, false otherwise.
 */
JztScriptContext.prototype.isRunning = function () {
    return this.commandIndex >= 0 && this.commandIndex < this.script.commands.length;
};

/**
 * Stops running this JztScriptContext.
 */
JztScriptContext.prototype.stop = function () {
    this.commandIndex = -1;
};

JztScriptContext.prototype.addScrollContent = function (line, center, lineLabel) {
    var newLine = {
        'text': line,
        'center': center,
        'label': lineLabel
    };
    this.scrollContent.push(newLine);
};

JztScriptContext.prototype.displayScroll = function () {
    var index,
        line;

    this.owner.board.game.scroll.setTitle(this.owner.name);
    this.owner.board.game.scroll.clearLines();
    this.owner.board.game.scroll.listener = this.owner;

    for (index = 0; index < this.scrollContent.length; index += 1) {
        line = this.scrollContent[index];
        this.owner.board.game.scroll.addLine(line.text, line.center, line.label);
    }

    this.scrollContent = [];
    this.owner.board.game.setState(GameState.Reading);

};

/**
 * Executes a single tick of this JztScriptContext, taking a command from its associated
 * Script and executing it.
 */
JztScriptContext.prototype.executeTick = function () {

    var message,
        command,
        result,
        displayScroll = this.scrollContent.length > 0;

    // If our owner has a message waiting...
    if (this.owner.messageQueue.length > 0) {

        // Grab our most recent message
        message = this.owner.messageQueue.shift();

        // If we were able to receive this message
        if (!this.owner.locked) {
            this.jumpToLabel(message);
        }

    }

    if (this.isRunning()) {

        // Fetch a new command
        command = this.script.getCommand(this.commandIndex);

        if (command) {

            result = command.execute(this.owner);

            // If we modify the scroll, don't display it yet
            if (command.modifiesScroll) {
                displayScroll = false;
            }

            // If we've got scroll content, display it
            if (displayScroll) {
                this.displayScroll();
            }

            switch (result) {

            // Normal execution, advance line
            case undefined:
            case commands.CommandResult.NORMAL:
                this.advanceLine();
                this.doneTick();
                break;

            // Execute a second tick
            case commands.CommandResult.CONTINUE:
                this.advanceLine();
                this.executeTick();
                break;

            // Normal execution, assuming the counter is at the right location
            case commands.CommandResult.CONTINUE_AFTER_JUMP:

                // If we haven't jumped too many times already, go ahead
                // Otherwise, we're done for this tick.
                if (this.jumpCount <= 5) {
                    this.executeTick();
                } else {
                    this.doneTick();
                }
                break;

            // Execute the same command next tick
            case commands.CommandResult.REPEAT:
                this.doneTick();
                break;

            default:
                throw 'Unexpected command execution.';
            }

        }

    } else {

        // Even if we're not running, if we've got scroll content we need to show it
        if (displayScroll) {
            this.displayScroll();
        }

    }

};

/**
 * Indicates that this script is done executing for this tick.
 */
JztScriptContext.prototype.doneTick = function () {
    this.jumpCount = 0;
};

/**
 * Updates the active command of this JztScriptContext to that of a provided label
 * name.
 *
 * @param label A name of a label to which to jump.
 */
JztScriptContext.prototype.jumpToLabel = function (label) {

    if (this.currentLabels.hasOwnProperty(label)) {

        var labelIndex = this.currentLabels[label],
            labelIndicies = this.script.labelIndicies[label];

        // If all labels aren't zapped...
        if (labelIndex < labelIndicies.length) {

            // We're about to jump successfully, so clear out temporary heap items
            this.clearTemporaryHeapItems();

            // Set our current line to the active label index
            this.commandIndex = labelIndicies[labelIndex];

            // Increment our jump count for this tick
            this.jumpCount += 1;

        }

    }

};

JztScriptContext.prototype.clearTemporaryHeapItems = function () {
    var heapItem;
    for (heapItem in this.heap) {
        if (this.heap.hasOwnProperty(heapItem) && heapItem[0] === '<' && heapItem[heapItem.length - 1] === '>') {
            delete this.heap[heapItem];
        }
    }
};

/**
 * Zaps a provided label name, making it no longer jumpable. If more than one
 * label with the same name exists, only the first will be zapped. Subsequent
 * zaps will zap the next unzapped label.
 *
 * @param label A name of a label to zap.
 */
JztScriptContext.prototype.zapLabel = function (label) {

    var labelIndex;

    if (this.currentLabels.hasOwnProperty(label)) {
        labelIndex = this.currentLabels[label];
        if (labelIndex + 1 <= this.script.labelIndicies[label].length) {
            this.currentLabels[label] += 1;
        }
    }

};

/**
 * Restores a previously zapped label, making it resumable for jupming. If more than
 * one label with the same name has been zapped, the most recently zapped label will
 * be unzapped.
 *
 * @param label A name of a label to restore.
 */
JztScriptContext.prototype.restoreLabel = function (label) {

    var labelIndex;

    if (this.currentLabels.hasOwnProperty(label)) {
        labelIndex = this.currentLabels[label];
        if (labelIndex - 1 >= 0) {
            this.currentLabels[label] -= 1;
        }
    }

};

/**
 * Advances this JztScriptContext by one line, preparing a new command to be executed
 * at the next tick event.
 */
JztScriptContext.prototype.advanceLine = function () {
    if (this.isRunning()) {
        this.commandIndex += 1;
    }
};

exports.JztScriptContext = JztScriptContext;
