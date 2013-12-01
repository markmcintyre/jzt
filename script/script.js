/**
 * JZT Script
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */
/* global jztscript, console */

"use strict";

var jzt = jzt || {};

/**
 * Script is an executable set of command instructions that dictates the behaviour
 * of a ScriptableThing.
 * 
 * @param scriptData Serialized script data
 */
jzt.Script = function(scriptData) {
    
    this.name = scriptData.name;
    this.commands = [];
    this.labelIndicies = {};
    this.rawScript = scriptData.script;
    this.assemble();
    
};

/**
 * Creates a new ScriptContext that can be used to execute a script
 * 
 * @param owner A ScriptableThing to own the new script context
 * @return A new ScriptContext for a provided owner
 */
jzt.Script.prototype.newContext = function(owner) {
    return new jzt.ScriptContext(this, owner);
};

/**
 * Assembles this Script's script data into executable commands.
 */
jzt.Script.prototype.assemble = function() {
    
    // If script text is available...
    if(this.rawScript) {
        
        var factory = new jztscript.CommandFactory();
        
        // Split our lines by newline character
        var lines = this.rawScript.split(/\n/);
        
        // For each script line...
        for(var index = 0; index < lines.length; ++index) {
            
            // Retrieve the next line
            var line = lines[index];
            var result;
            
            // Parse the line
            try {
                result = factory.parseLine(line);
            }
            
            // If there was an error parsing, cancel the script and output an error
            catch(ex) {
                this.commands = [];
                console.warn('Syntax error in script \'%s\' on line %d.\n> %s\n> %s.', this.name, index, line, ex);
                return;
            }

            // If we got an empty line, skip this iteration
            if(result === undefined) {
                continue;
            }
            
            // If we got a label, add it to our labels
            else if(result instanceof jzt.commands.Label) {
                this.addLabel(result, this.commands.length-1);
            }
        
            // Otherwise it's a command to add to our set
            else {
                this.commands.push(result);
            }
            
        }
        
    }
};

/**
 * Adds a provided label to this Script, and associates it with a command index.
 *
 * @param label A label
 * @param commandIndex An index of a command to which the label points.
 */
jzt.Script.prototype.addLabel = function(label, commandIndex) {
  
    // Labels aren't stored, so we point to their next location
    commandIndex++;

    // If the label already exists, push the new label to the stack
    if(this.labelIndicies.hasOwnProperty(label.id)) {
        this.labelIndicies[label.id].push(commandIndex);
    }

    // Otherwise we've got a new label
    else {
        this.labelIndicies[label.id] = [commandIndex];
    }
    
};

/**
 * Retrieves a Command instance for a provided command index value.
 *
 * @param commandIndex An index of a command to retrieve
 * @return A Command instance
 */
jzt.Script.prototype.getCommand = function(commandIndex) {
    
    var result = this.commands[commandIndex];
    if(result === undefined) {
        return undefined;
    }
    
    return result.clone();
    
};

/**
 * Serializes this Script instance into a data object.
 *
 * @return A data object representing a serialized Script.
 */
jzt.Script.prototype.serialize = function() {
    
    var result = {};
    result.name = this.name;
    result.script = this.rawScript;
    return result;

};

/**
 * A ScriptContext is a context in which a script can run, including an associated
 * ScriptableThing, a current execution index, labels, and more.
 *
 * @param script A script which this ScriptContext is set to execute.
 * @param owner A ScriptableThing to own this ScriptContext.
 */
jzt.ScriptContext = function(script, owner) {
    this.owner = owner;
    this.script = script;
    this.commandIndex = 0;
    this.currentLabels = {};
    this.storedCommand = undefined;
    this.initializeLabels(script);
    this.scrollContent = [];
};

/**
 * Serializes this ScriptContext to a data object.
 *
 * @return A data object representing this ScriptContext.
 */
jzt.ScriptContext.prototype.serialize = function() {

    var result = {};
    var label;
    result.commandIndex = this.commandIndex;
    result.currentLabels = {};
    for(label in this.currentLabels) {
        if(this.currentLabels.hasOwnProperty(label) && this.currentLabels[label]) {
            result.currentLabels[label] = this.currentLabels[label];
        }
    }

    //TODO: Serialize stored command
    return result;

};

/**
 * De-serializes a provided data object to initialize this ScriptContext.
 *
 * @param data A serialized ScriptContext.
 */
jzt.ScriptContext.prototype.deserialize = function(data) {

    var label;

    this.commandIndex = data.commandIndex;
    for(label in data.currentLabels) {
        if(data.currentLabels.hasOwnProperty(label)) {
            this.currentLabels[label] = data.currentLabels[label];
        }
    }

    // TODO: Deserialize stored command

};

/**
 * Initializes this ScriptContext's labels to that of a provided Script instance.
 * 
 * @param script A Script used to initialize this ScriptContext's labels.
 */
jzt.ScriptContext.prototype.initializeLabels = function(script) {
    var label;
    for(label in script.labelIndicies) {
        if(script.labelIndicies.hasOwnProperty(label)) {
            this.currentLabels[label] = 0;
        }
    }
};

/**
 * Retrieves whether or not this ScriptContext is currently running.
 *
 * @return true if this ScriptContext is running, false otherwise.
 */
jzt.ScriptContext.prototype.isRunning = function() {
    return this.commandIndex >= 0 && this.commandIndex < this.script.commands.length;
};

/**
 * Stops running this ScriptContext.
 */
jzt.ScriptContext.prototype.stop = function() {
    this.commandIndex = -1;
};

jzt.ScriptContext.prototype.addScrollContent = function(line, center, lineLabel) {
    var newLine = {
        'text': line,
        'center': center,
        'label': lineLabel
    }
    this.scrollContent.push(newLine);
};

jzt.ScriptContext.prototype.displayScroll = function() {
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
 * Executes a single tick of this ScriptContext, taking a command from its associated
 * Script and executing it.
 */
jzt.ScriptContext.prototype.executeTick = function() {
    
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
        
        // If we have a stored command...
        if(this.storedCommand) {
            command = this.storedCommand;
        }
        
        // Otherwise fetch a new command
        else {
            command = this.script.getCommand(this.commandIndex);
        }
        
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
                    break;
            
                // Execute a second tick
                case jzt.commands.CommandResult.CONTINUE:
                    this.advanceLine();
                    this.executeTick();
                    break;

                // Normal execution, assuming the counter is at the right location
                case jzt.commands.CommandResult.CONTINUE_AFTER_JUMP:
                    //this.executeTick();
                    break;
            
                // Execute the same command next tick
                case jzt.commands.CommandResult.REPEAT:
                    this.storedCommand = command;
                    break;
            
                default:
                    throw "Unexpected command execution.";
            }
        
        }
        
    }
    
};

/**
 * Updates the active command of this ScriptContext to that of a provided label
 * name.
 *
 * @param label A name of a label to which to jump.
 */
jzt.ScriptContext.prototype.jumpToLabel = function(label) {
    
    if(this.currentLabels.hasOwnProperty(label)) {
        
        var labelIndex = this.currentLabels[label];
        var labelIndicies = this.script.labelIndicies[label];
        
        // If all labels aren't zapped...
        if(labelIndex < labelIndicies.length) {
            
            // Set our current line to the active label index
            this.commandIndex = labelIndicies[labelIndex];
    
            // If we have a stored command, clear it
            if(this.storedCommand) {
                this.storedCommand = undefined;
            }
            
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
jzt.ScriptContext.prototype.zapLabel = function(label) {
    
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
jzt.ScriptContext.prototype.restoreLabel = function(label) {
  
    if(this.currentLabels.hasOwnProperty(label)) {
        var labelIndex = this.currentLabels[label];
        if(labelIndex - 1 >= 0) {
            this.currentLabels[label]--;
        }
    }
    
};

/**
 * Advances this ScriptContext by one line, preparing a new command to be executed
 * at the next tick event.
 */
jzt.ScriptContext.prototype.advanceLine = function() {
    if(this.isRunning()) {
        // If we have a stored command, clear it
        if(this.storedCommand) {
            this.storedCommand = undefined;
        }
        this.commandIndex++;
    }
};