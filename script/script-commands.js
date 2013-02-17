window.jzt = window.jzt || {};
jzt.commands = jzt.commands || {};

jzt.ScriptCommandFactory = jzt.ScriptCommandFactory || {};
jzt.ScriptCommandFactory.create = function(line) {
	
	var tokens = line.match(/\w+|"(?:\\"|[^"])+"/g);
	if(tokens.length > 0) {
		
		var commandName = tokens.shift().toUpperCase();
		
		switch(commandName) {
			case 'SAY':
				return new jzt.commands.SayCommand(tokens);
				break;
			case 'MOVE':
				return new jzt.commands.MoveCommand(tokens);
				break;
			case 'END':
				return new jzt.commands.EndCommand(tokens);
				break;
		}
		
	}
	
	return undefined;
	
};

jzt.commands.CommandResult = jzt.commands.CommandResult || {};
jzt.commands.CommandResult.NORMAL = 0;
jzt.commands.CommandResult.CONTINUE = 1;
jzt.commands.CommandResult.REPEAT = 2;

jzt.commands.SayCommand = function(arguments) {
	
	if(arguments.length != 1) {
		throw "Say command expects a single argument.";
	}
	
	var text = arguments[0];
	if(text.charAt(0) != '"' || text.charAt(text.length-1) != '"') {
		throw "Text for the say command must be in quotes.";
	}
	
	this.text = arguments[0].substring(1, text.length-1);
	this.text = this.text.replace(/\\/g, '');
	
};

jzt.commands.SayCommand.prototype.execute = function(owner) {
	console.log(owner.name + ' says: ' + this.text);
	return jzt.commands.CommandResult.CONTINUE;
};

jzt.commands.MoveCommand = function(arguments) {
	
	if(arguments.length <= 0) {
		throw "Move command expects a direction";
	}
	else {
		this.direction = arguments[0];
		
		if(arguments.length > 1) {
			var times = parseInt(arguments[1], 10);
			if(times == NaN) {
				throw "Could not understand number parameter";
			}
			else {
				// We subtract one because the last time counts
				this.times = times;
			}
			
		}
		
	}
	
};

jzt.commands.MoveCommand.prototype.execute = function(owner) {

	console.log(owner.name + ' wishes to move ' +  this.direction);
	owner.board.moveTile(owner.point, owner.point.add(jzt.Direction.parse(this.direction)));
	
	if(--this.times > 0) {
		return jzt.commands.CommandResult.REPEAT;
	}
	else {
		return jzt.commands.CommandResult.NORMAL;
	}
	
};

jzt.commands.EndCommand = function(arguments) {
	if(arguments.length > 0) {
		throw "End command does not take arguments.";
	}
}

jzt.commands.EndCommand.prototype.execute = function(owner) {
	console.log(owner.name + ' has stopped its script.');
	owner.stopScript();
	return jzt.commands.CommandResult.NORMAL;
}