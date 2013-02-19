window.jzt = window.jzt || {};

jzt.Script = function(owner, scriptData) {
    
    this.name = scriptData.name;
    this.owner = owner;
    this.script = scriptData.lines;
    this.currentLine = 0;
    this.labels = this._findLabels();
    
};

jzt.Script.prototype._findLabels = function() {
    
    var result = {};
    
    // For each line...
    for(var index = 0; index < this.script.length; ++index) {
        
        var line = this.script[index];
        if(line.length > 1) {
            
            if(line.charAt(0) == ':') {
                var labelName = line.substring(1).toUpperCase();
                
                if(result[labelName]) {
                    result[labelName].indicies.push(index);
                }
                else {
                    result[labelName] = {currentIndex: 0, indicies: [index]};
                }
            }
        }
        
    }
    
    return result;
    
};

jzt.Script.prototype.isRunning = function() {
    return this.currentLine >= 0 && this.currentLine < this.script.length;
};

jzt.Script.prototype.stop = function() {
    this.currentLine = -1;
};

jzt.Script.prototype._fetchCommand = function() {
    var line = this.script[this.currentLine];
    return this.parseLine(line, this.currentLine);
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
            command = this._fetchCommand(); 
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
    
    label = label.toUpperCase();
    
    if(this.labels.hasOwnProperty(label)) {
        
        var labelData = this.labels[label];
        
        // If all labels aren't zapped...
        if(labelData.currentIndex < labelData.indicies.length) {
            
            // Set our current line to the active label index
            this.currentLine = labelData.indicies[labelData.currentIndex];
        
            /* We wish to start at the line after the label, as well as
               clear any stored commands. */
            this.advanceLine();
            
        }

    }
    
};

jzt.Script.prototype.zapLabel = function(label) {
    
    label = label.toUpperCase();
    
    if(this.labels.hasOwnProperty(label)) {
        
        var labelData = this.labels[label];
        if(labelData.currentIndex + 1 <= labelData.indicies.length) {
            labelData.currentIndex++;
        }
    }
    
};

jzt.Script.prototype.restoreLabel = function(label) {
  
    label = label.toUpperCase();
    
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
        
        this.currentLine++;
    }
};

jzt.Script.prototype.parseLine = function(line, lineNumber) {
    try {
        var result = jzt.ScriptCommandFactory.create(line);
        if(!result) {
            throw 'Unrecognized command.';
        }
        return result;
    }
    catch(error) {
        console.error('Syntax error in script \'%s\'\n> Line %d: \'%s\'\n> %s"', this.name, lineNumber, line, error);
    }
};