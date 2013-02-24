window.jzt = window.jzt || {};

jzt.Script = function(owner, scriptData) {
    
    this.name = scriptData.name;
    this.owner = owner;
    this.commands = [];
    this.labels = {};
    this.commandIndex = -1;
    
    this._assemble(scriptData.script);
    
};

jzt.Script.prototype._assemble = function(script) {
    if(script) {
        
        var factory = new jztscript.CommandFactory();
        
        // Split our lines by newline character
        var lines = script.split(/\n/);
        
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
                this._addLabel(result, this.commands.length-1);
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

jzt.Script.prototype._addLabel = function(label, commandIndex) {
  
    if(this.labels.hasOwnProperty(label.id)) {
        this.labels.indicies.push(commandIndex);
    }
    else {
        this.labels[label.id] = {
            currentIndex: 0,
            indicies: [commandIndex]
        };
    }
    
};

jzt.Script.prototype._getCommand = function() {
    
    var result = this.commands[this.commandIndex];
    if(result == undefined) {
        this.commandIndex = -1;
        return undefined;
    }
    
    return result.clone();
    
};

jzt.Script.prototype.isRunning = function() {
    return this.commandIndex >= 0 && this.commandIndex < this.commands.length;
};

jzt.Script.prototype.stop = function() {
    this.commandIndex = -1;
};

jzt.Script.prototype.executeTick = function() {
    
    // If our owner has a message waiting...
    if(this.owner.hasMessage()) {
        
        // Grab our most recent message
        var message = this.owner.getMessage();
        
        // If we were able to receive this message
        this.jumpToLabel(message);
        
    }
    
    if(this.isRunning()) {
        
        var command;
        
        // If we have a stored command...
        if(this._storedCommand) {
            command = this._storedCommand;
        }
        
        // Otherwise fetch a new command
        else {
            command = this._getCommand();
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
                    this._storedCommand = command;
                    break;
            
                default:
                    throw "Unexpected command execution.";
            }
        
        }
        
    }
    
};

jzt.Script.prototype.jumpToLabel = function(label) {
    
    if(this.labels.hasOwnProperty(label)) {
        
        var labelData = this.labels[label];
        
        // If all labels aren't zapped...
        if(labelData.currentIndex < labelData.indicies.length) {
            
            // Set our current line to the active label index
            this.commandIndex = labelData.indicies[labelData.currentIndex];
        
            /* We wish to start at the line after the label, as well as
               clear any stored commands. */
            this.advanceLine();
            
        }

    }
    
};

jzt.Script.prototype.zapLabel = function(label) {
    
    if(this.labels.hasOwnProperty(label)) {
        
        var labelData = this.labels[label];
        if(labelData.currentIndex + 1 <= labelData.indicies.length) {
            labelData.currentIndex++;
        }
    }
    
};

jzt.Script.prototype.restoreLabel = function(label) {
  
    if(this.labels.hasOwnProperty(label)) {
        
        var labelData = this.labels[label];
        if(labelData.currentIndex - 1 >= 0) {
            this.labels[label].currentIndex--;
        }
        
    }
    
};

jzt.Script.prototype.advanceLine = function() {
    if(this.isRunning()) {
        
        // If we have a stored command, clear it
        if(this._storedCommand) {
            this._storedCommand = undefined;
        }
        
        this.commandIndex++;
    }
};