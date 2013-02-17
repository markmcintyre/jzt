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
     
    // We will be forming our expression here
    this._movementExpression = [];
    this.times = 1;
    
    // Initialize validation flags
    var concreteDirection = false;
    var done = false;
    
    // If no arguments were provided
    if(arguments.length <= 0) {
        throw 'Move command expects a movement expression';
    }
    
    // For each of our arguments...
    for(var index = 0; index < arguments.length; ++index) {
        
        // If we are not expecting more tokens...
        if(done) {
            throw 'Unexpected token after movement times modifier: ' + arguments[index];
        }
        
        var token = arguments[index].toUpperCase();
        
        switch(token) {
            case 'CW':
                concreteDirection = false;
                this._movementExpression.push(token);
                break;
            case 'CCW':
                concreteDirection = false;
                this._movementExpression.push(token);
                break;
            case 'OPP':
                concreteDirection = false;
                this._movementExpression.push(token);
                break;
            case 'SEEK':
                concreteDirection = true;
                this._movementExpression.push(token);
                break;
            case 'FLOW':
                concreteDirection = true;
                this._movementExpression.push(token);
                break;
            case 'RAND':
                concreteDirection = true;
                this._movementExpression.push(token);
                break;
            case 'RANDX':
                concreteDirection = true;
                this._movementExpression.push(token);
                break;
            case 'RANDY':
                concreteDirection = true;
                this._movementExpression.push(token);
                break;
            default:
                var direction = jzt.Direction.parse(token);
                if(direction) {
                    concreteDirection = true;
                    this._movementExpression.push(direction);
                }
                else {
                    
                    // Try to parse the token as a number
                    var times = parseInt(token);
                    
                    // If that failed, there was an error
                    if(times == NaN) {
                        throw 'Move command could not understand expression element: ' + token;
                    }
                    
                    // If no concrete direction was encountered, that's an error
                    if(!concreteDirection) {
                        throw 'Invalid movement expression at ' + token + '. No direction specified.';
                    }
                    
                    // Store our repeat times
                    this.times = times;

                    // We do not expect tokens after a number
                    done = true;
                    
                }
        }
    }      
};

jzt.commands.MoveCommand.prototype.processExpression = function(owner, index) {
    
    var token = this._movementExpression[index];

    switch(token) {
        case 'OPP':
            return jzt.Direction.opposite( this.processExpression(owner,index+1) );
        case 'CW':
            return jzt.Direction.clockwise( this.processExpression(owner,index+1) );
        case 'CCW':
            return jzt.Direction.counterClockwise( this.processExpression(owner,index+1) );
        case 'RAND':
            return jzt.Direction.random();
        case 'RANDX':
            return jzt.Direction.randomX();
        case 'RANDY':
            return jzt.Direction.randomY();
        case 'SEEK':
            return owner.playerDirection();
        case 'FLOW':
            return owner.orientation;
        default:
            return token;
    }
    
};

jzt.commands.MoveCommand.prototype.execute = function(owner) {

    // Process our expression from the first element
    var direction = this.processExpression(owner, 0);

    // If a movement was available...
    if(direction) {
        
        // Interpret our dynamic directions
        if(direction == this.SEEK) {
            direction = owner.playerDirection();
        }
        else if(direction == this.FLOW) {
            direction = owner.orientation;
        }
        
        jzt.debug.log('%s wishes to move %s.', owner.name, jzt.Direction.getName(direction));
        owner.move(direction);
        
        // If still have more moves to perform...
        if(--this.times > 0) {
            return jzt.commands.CommandResult.REPEAT;
        }
        
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