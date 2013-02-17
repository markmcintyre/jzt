window.jzt = window.jzt || {};

jzt.Script = function(owner, scriptData) {
	
	this.name = scriptData.name;
	this.owner = owner;
	this.script = scriptData.lines;
	this.currentLine = 0;
	
};

jzt.Script.prototype.isRunning = function() {
	return this.currentLine >= 0 && this.currentLine < this.script.length;
}

jzt.Script.prototype.stop = function() {
	this.currentLine = -1;
}

jzt.Script.prototype.executeTick = function() {
	
	if(this.isRunning()) {
		
		// If we have a stored command, use it
		if(this._storedCommand) {
			command = this._storedCommand;
		}
		
		// Otherwise fetch a new command
		else {
			var line = this.script[this.currentLine];
			var command = this.parseLine(line, this.currentLine);	
		}
		
		if(command) {
	
			var result = command.execute(this.owner);
	
			switch(result) {
		
				// Normal execution, advance line
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
		return jzt.ScriptCommandFactory.create(line);
	}
	catch(error) {
		alert('Syntax error in script "' + this.name + '"\nLine ' + lineNumber + '\n' + line + '\n' + error);
	}
}