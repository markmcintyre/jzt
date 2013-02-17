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
            case 'WAIT':
                return new jzt.commands.WaitCommand(tokens);
                break;
        }
        
    }
    
    return undefined;
    
};

jzt.commands.CommandResult = jzt.commands.CommandResult || {};
jzt.commands.CommandResult.NORMAL = 0;
jzt.commands.CommandResult.CONTINUE = 1;
jzt.commands.CommandResult.REPEAT = 2;

/*
 *  SAY command
 */
jzt.commands.SayCommand = function(arguments) {
    
    if(arguments.length != 1) {
        throw 'Say command expects a single argument.';
    }
    
    var text = arguments[0];
    if(text.charAt(0) != '"' || text.charAt(text.length-1) != '"') {
        throw 'Text for the say command must be in quotes.';
    }
    
    this.text = arguments[0].substring(1, text.length-1);
    this.text = this.text.replace(/\\/g, '');
    
};

jzt.commands.SayCommand.prototype.execute = function(owner) {
    jzt.debug.log('%s says: %s', owner.name, this.text);
    return jzt.commands.CommandResult.CONTINUE;
};

/*
 * MOVE command
 */
jzt.commands.MoveCommand = function(arguments) {
    
    if(arguments.length <= 0) {
        throw 'Move command expects a direction';
    }

    this.direction = jzt.Direction.parse(arguments[0]);
    
    if(!this.direction) {
        throw 'Move command couldn\'t understand the direction ' + arguments[0];
    }
    
    if(arguments.length > 1) {
        var times = parseInt(arguments[1], 10);
        if(times == NaN) {
            throw 'Could not understand number parameter';
        }
        else {
            // We subtract one because the last time counts
            this.times = times;
        }
        
    }
        
};

jzt.commands.MoveCommand.prototype.execute = function(owner) {

    jzt.debug.log('%s wishes to move %s.', owner.name, jzt.Direction.getName(this.direction));
    owner.move(this.direction);
    
    if(--this.times > 0) {
        return jzt.commands.CommandResult.REPEAT;
    }
    
    return jzt.commands.CommandResult.NORMAL;
    
};

/*
 * END command
 */
jzt.commands.EndCommand = function(arguments) {
    if(arguments.length > 0) {
        throw 'End command does not take arguments.';
    }
}

jzt.commands.EndCommand.prototype.execute = function(owner) {
    jzt.debug.log('%s has stopped its script.', owner.name);
    owner.stopScript();
    return jzt.commands.CommandResult.NORMAL;
}

/* 
 * WAIT command
 */
jzt.commands.WaitCommand = function(arguments) {
    
    if(arguments.length != 1) {
        throw 'Wait command expects a number of cycles to wait.';
    }
    
    var cycles = parseInt(arguments[0], 10);
    if(cycles == NaN) {
        throw 'Wait command expects a number as its cycle argument.';
    }
    
    this.cycles = cycles;
    
}

jzt.commands.WaitCommand.prototype.execute = function(owner) {
    
    jzt.debug.log('%s is waiting patiently for %d cycles', owner.name, this.cycles);
    
    if(--this.cycles > 0) {
        return jzt.commands.CommandResult.REPEAT;
    }

    return jzt.commands.CommandResult.NORMAL;
    
}