import { GameState } from './game-state.js';
import * as commands from './jzt-script-commands.js';



export class JztScriptContext {
    constructor(script, owner) {
    this.owner = owner;
    this.script = script;
    this.commandIndex = 0;
    this.currentLabels = {};
    this.heap = {};
    this.initializeLabels(script);
    this.scrollContent = [];
    this.jumpCount = 0;

    }

    serialize() {

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


    }

    deserialize(data) {

    var label;

    this.commandIndex = data.commandIndex;
    this.heap = data.heap;
    for (label in data.currentLabels) {
        if (data.currentLabels.hasOwnProperty(label)) {
            this.currentLabels[label] = data.currentLabels[label];
        }
    }


    }

    inDefaultState() {

    var defaultState = true,
        labelIndex;

    // Look for evidence that we're not in a default state
    if (this.commandIndex !== 0) {

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


    }

    initializeLabels(script) {
    var label;
    for (label in script.labelIndicies) {
        if (script.labelIndicies.hasOwnProperty(label)) {
            this.currentLabels[label] = 0;
        }
    }

    }

    isRunning() {
    return this.commandIndex >= 0 && this.commandIndex < this.script.commands.length;

    }

    stop() {
    this.commandIndex = -1;

    }

    addScrollContent(line, center, lineLabel) {
    var newLine = {
        'text': line,
        'center': center,
        'label': lineLabel
    };
    this.scrollContent.push(newLine);

    }

    displayScroll() {
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


    }

    executeTick() {

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


    }

    doneTick() {
    this.jumpCount = 0;

    }

    jumpToLabel(label) {

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

            return true;

        }

    }

    return false;


    }

    clearTemporaryHeapItems() {
    var heapItem;
    for (heapItem in this.heap) {
        if (this.heap.hasOwnProperty(heapItem) && heapItem[0] === '<' && heapItem[heapItem.length - 1] === '>') {
            delete this.heap[heapItem];
        }
    }

    }

    zapLabel(label) {

    var labelIndex;

    if (this.currentLabels.hasOwnProperty(label)) {
        labelIndex = this.currentLabels[label];
        if (labelIndex + 1 <= this.script.labelIndicies[label].length) {
            this.currentLabels[label] += 1;
        }
    }


    }

    restoreLabel(label) {

    var labelIndex;

    if (this.currentLabels.hasOwnProperty(label)) {
        labelIndex = this.currentLabels[label];
        if (labelIndex - 1 >= 0) {
            this.currentLabels[label] -= 1;
        }
    }


    }

    advanceLine() {
    if (this.isRunning()) {
        this.commandIndex += 1;
    }

    }
}
