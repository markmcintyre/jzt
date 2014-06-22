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
    function JztScript(rawScript) {
        
        if(!(this instanceof JztScript)) {
            throw jzt.ConstructorError;
        }
        
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
            rawScript: this.rawScript
        };
    };
    
    my.JztScript = JztScript;
    return my;
 
}((jzt || {}).jztscript || {}));