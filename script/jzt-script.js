/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
var jzt;
jzt.jztscript = (function(my){
 
    'use strict';
    
    var commands = my.commands;
    var scriptParser = new my.JztScriptParser();
    
    function populateScript(script, commandStack) {
        
        var index;
        var element;
        
        // Put the commands into our target
        for(index = 0; index < commandStack.length; ++index) {
        
            // Grab our next element
            element = commandStack[index];
            
            // If it's a label...
            if(element instanceof commands.Label) {
                script.addLabel(element);
            }
            
            // If it's an executable item...
            else if(typeof element.execute === 'function') {
                script.addCommand(element);
            }
            
            // If it's anything else...
            else {
                throw 'Catestrophic script error. Unexpected object in command stack.';
            }
            
        }

    }
    
    /**
     * JztScript
     */
    function JztScript(name, rawScript) {
        
        if(!(this instanceof JztScript)) {
            throw jzt.ConstructorError;
        }
        
        this.name = name;
        this.rawScript = rawScript;
        this.labelIndicies = {};
        this.commands = [];
        
        if(rawScript) {
            populateScript(this, scriptParser.parse(rawScript));
        }
        
    }
    
    JztScript.prototype.addLabel = function(label, commandIndex) {
        
        // If no command index was provided, use the current command position
        commandIndex = commandIndex === undefined ? this.commands.length : commandIndex;
        
        // If the label already exists, push the new label to the stack
        if(this.labelIndicies.hasOwnProperty(label.name)) {
            this.labelIndicies[label.name].push(commandIndex);
        }

        // Otherwise we've got a new label
        else {
            this.labelIndicies[label.name] = [commandIndex];
        }
        
    };
    
    JztScript.prototype.addCommand = function(command) {
        this.commands.push(command);
    };
    
    JztScript.prototype.getCommand = function(index) {
        return this.commands[index];
    };
    
    JztScript.prototype.serialize = function() {
        return {
            name: this.name,
            rawScript: this.rawScript
        };
    };
    
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
    JztScriptContext.prototype.serialize = function() {

        var result = {};
        var label;
        result.commandIndex = this.commandIndex;
        result.currentLabels = {};
        result.heap = this.heap;
        for(label in this.currentLabels) {
            if(this.currentLabels.hasOwnProperty(label) && this.currentLabels[label]) {
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
    JztScriptContext.prototype.deserialize = function(data) {

        var label;

        this.commandIndex = data.commandIndex;
        this.heap = data.heap;
        for(label in data.currentLabels) {
            if(data.currentLabels.hasOwnProperty(label)) {
                this.currentLabels[label] = data.currentLabels[label];
            }
        }

    };

    /**
     * Initializes this JztScriptContext's labels to that of a provided Script instance.
     * 
     * @param script A Script used to initialize this JztScriptContext's labels.
     */
    JztScriptContext.prototype.initializeLabels = function(script) {
        var label;
        for(label in script.labelIndicies) {
            if(script.labelIndicies.hasOwnProperty(label)) {
                this.currentLabels[label] = 0;
            }
        }
    };

    /**
     * Retrieves whether or not this JztScriptContext is currently running.
     *
     * @return true if this JztScriptContext is running, false otherwise.
     */
    JztScriptContext.prototype.isRunning = function() {
        return this.commandIndex >= 0 && this.commandIndex < this.script.commands.length;
    };

    /**
     * Stops running this JztScriptContext.
     */
    JztScriptContext.prototype.stop = function() {
        this.commandIndex = -1;
    };

    JztScriptContext.prototype.addScrollContent = function(line, center, lineLabel) {
        var newLine = {
            'text': line,
            'center': center,
            'label': lineLabel
        };
        this.scrollContent.push(newLine);
    };

    JztScriptContext.prototype.displayScroll = function() {
        var index;
        var line;

        this.owner.board.game.scroll.setTitle(this.owner.name);
        this.owner.board.game.scroll.clearLines();
        this.owner.board.game.scroll.listener = this.owner;

        for(index = 0; index < this.scrollContent.length; ++index) {
            line = this.scrollContent[index];
            this.owner.board.game.scroll.addLine(line.text, line.center, line.label);
        }

        this.scrollContent = [];
        this.owner.board.game.setState(jzt.GameState.Reading);

    };

    /**
     * Executes a single tick of this JztScriptContext, taking a command from its associated
     * Script and executing it.
     */
    JztScriptContext.prototype.executeTick = function() {

        // If our owner has a message waiting...
        if(this.owner.messageQueue.length > 0) {

            // Grab our most recent message
            var message = this.owner.messageQueue.shift();

            // If we were able to receive this message
            if(!this.owner.locked) {
                this.jumpToLabel(message);
            }

        }

        if(this.isRunning()) {

            var command;
            var result;

            // Fetch a new command
            command = this.script.getCommand(this.commandIndex);

            if(command) {

                result = command.execute(this.owner);

                // If the command doesn't modify the scroll, and there's scroll content... 
                if(this.scrollContent.length > 0 && ! command.modifiesScroll) {

                    // It's time to show the scroll content
                    this.displayScroll();

                }

                switch(result) {

                    // Normal execution, advance line
                    case undefined:
                    case jzt.commands.CommandResult.NORMAL:
                        this.advanceLine();
                        this.doneTick();
                        break;

                    // Execute a second tick
                    case jzt.commands.CommandResult.CONTINUE:
                        this.advanceLine();
                        this.executeTick();
                        break;

                    // Normal execution, assuming the counter is at the right location
                    case jzt.commands.CommandResult.CONTINUE_AFTER_JUMP:

                        // If we haven't jumped too much this tick...
                        if(this.jumpCount <= 5) {
                            // Execute the next tick
                            this.executeTick();
                        }
                        // Otherwise we're done
                        else {
                            this.doneTick();
                        }
                        break;

                    // Execute the same command next tick
                    case jzt.commands.CommandResult.REPEAT:
                        this.doneTick();
                        break;

                    default:
                        throw 'Unexpected command execution.';
                }

            }

        }

    };

    /**
     * Indicates that this script is done executing for this tick.
     */
    JztScriptContext.prototype.doneTick = function() {
        this.jumpCount = 0;
    };

    /**
     * Updates the active command of this JztScriptContext to that of a provided label
     * name.
     *
     * @param label A name of a label to which to jump.
     */
    JztScriptContext.prototype.jumpToLabel = function(label) {

        if(this.currentLabels.hasOwnProperty(label)) {

            var labelIndex = this.currentLabels[label];
            var labelIndicies = this.script.labelIndicies[label];

            // If all labels aren't zapped...
            if(labelIndex < labelIndicies.length) {

                // Set our current line to the active label index
                this.commandIndex = labelIndicies[labelIndex];

                // Increment our jump count for this tick
                this.jumpCount++;

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
    JztScriptContext.prototype.zapLabel = function(label) {

        if(this.currentLabels.hasOwnProperty(label)) {
            var labelIndex = this.currentLabels[label];
            if(labelIndex + 1 <= this.script.labelIndicies[label].length) {
                this.currentLabels[label]++;
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
    JztScriptContext.prototype.restoreLabel = function(label) {

        if(this.currentLabels.hasOwnProperty(label)) {
            var labelIndex = this.currentLabels[label];
            if(labelIndex - 1 >= 0) {
                this.currentLabels[label]--;
            }
        }

    };

    /**
     * Advances this JztScriptContext by one line, preparing a new command to be executed
     * at the next tick event.
     */
    JztScriptContext.prototype.advanceLine = function() {
        if(this.isRunning()) {
            this.commandIndex++;
        }
    };
    
    my.JztScript = JztScript;
    my.JztScriptContext = JztScriptContext;
    return my;
 
}((jzt || {}).jztscript || {}));