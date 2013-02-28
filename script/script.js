window.jzt = window.jzt || {};

jzt.Script = function(scriptData) {
    
    this.name = scriptData.name;
    this.commands = [];
    this.labelIndicies = {};
    this.rawScript = scriptData.script;
    this.assemble();
    
};

jzt.Script.prototype.newContext = function(owner) {
    return new jzt.ScriptContext(this, owner);
};

jzt.Script.prototype.assemble = function() {
    
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
                this.commandIndex = -1;
                console.warn('Syntax error in script \'%s\' on line %d.\n> %s\n> %s.', this.name, index, line, ex);
                return;
            };

            // If we got an empty line, skip this iteration
            if(result == undefined) {
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
        
        // If we have at least one command, we can execute
        if(this.commands.length > 0) {
            this.commandIndex = 0;
        }
        
    }
};

jzt.Script.prototype.addLabel = function(label, commandIndex) {
  
    if(this.labelIndicies.hasOwnProperty(label.id)) {
        this.labelIndicies[label.id].push(commandIndex);
    }
    else {
        this.labelIndicies[label.id] = [commandIndex];
    }
    
};

jzt.Script.prototype.getCommand = function(commandIndex) {
    
    var result = this.commands[commandIndex];
    if(result == undefined) {
        return undefined;
    }
    
    return result.clone();
    
};

jzt.Script.prototype.serialize = function() {
    
    var result = {};
    result.name = this.name;
    result.script = this.rawScript;
    return result;

};

/*
 * ScriptContext
 */
jzt.ScriptContext = function(script, owner) {
    this.owner = owner;
    this.script = script;
    this.commandIndex = 0;
    this.currentLabels = {};
    this.storedCommand = undefined;
    this.initializeLabels(script);
};

jzt.ScriptContext.prototype.serialize = function() {
    var result = {};
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

jzt.ScriptContext.prototype.deserialize = function(data) {

    this.commandIndex = data.commandIndex;
    for(label in data.currentLabels) {
        if(data.currentLabels.hasOwnProperty(label)) {
            this.currentLabels[label] = data.currentLabels[label];
        }
    }

    // TODO: Deserialize stored command

};

jzt.ScriptContext.prototype.initializeLabels = function(script) {
    for(label in script.labelIndicies) {
        if(script.labelIndicies.hasOwnProperty(label)) {
            this.currentLabels[label] = 0;
        }
    }
};

jzt.ScriptContext.prototype.isRunning = function() {
    return this.commandIndex >= 0 && this.commandIndex < this.script.commands.length;
};

jzt.ScriptContext.prototype.stop = function() {
    this.commandIndex = -1;
};

jzt.ScriptContext.prototype.executeTick = function() {
    
    // If our owner has a message waiting...
    if(this.owner.messageQueue.length > 0) {
        
        // Grab our most recent message
        var message = this.owner.messageQueue.shift();
        
        // If we were able to receive this message
        this.jumpToLabel(message);
        
    }
    
    if(this.isRunning()) {
        
        var command;
        
        // If we have a stored command...
        if(this.storedCommand) {
            command = this.storedCommand;
        }
        
        // Otherwise fetch a new command
        else {
            command = this.script.getCommand(this.commandIndex);
        }
        
        if(command) {
    
            var result = command.execute(this.owner);
    
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

jzt.ScriptContext.prototype.jumpToLabel = function(label) {
    
    if(this.currentLabels.hasOwnProperty(label)) {
        
        var labelIndex = this.currentLabels[label];
        var labelIndicies = this.script.labelIndicies[label];
        
        // If all labels aren't zapped...
        if(labelIndex < labelIndicies.length) {
            
            // Set our current line to the active label index
            this.commandIndex = labelIndicies[labelIndex];
        
            /* We wish to start at the line after the label, as well as
               clear any stored commands. */
            this.advanceLine();
            
        }

    }
    
};

jzt.ScriptContext.prototype.zapLabel = function(label) {
    
    if(this.currentLabels.hasOwnProperty(label)) {
        var labelIndex = this.currentLabels[label];
        if(labelIndex + 1 <= this.script.labelIndicies.length) {
            this.currentLabels[label]++;
        }
    }
    
};

jzt.ScriptContext.prototype.restoreLabel = function(label) {
  
    if(this.currentLabels.hasOwnProperty(label)) {
        var labelIndex = this.currentLabels[label];
        if(labelIndex - 1 >= 0) {
            this.currentLabels[label]--;
        }
    }
    
};

jzt.ScriptContext.prototype.advanceLine = function() {
    if(this.isRunning()) {
        // If we have a stored command, clear it
        if(this.storedCommand) {
            this.storedCommand = undefined;
        }
        this.commandIndex++;
    }
};