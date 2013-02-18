window.jzt = window.jzt || {};
jzt.commands = jzt.commands || {};

/**
 * {@code ScriptCommandFactory} is a factory object capable of creating
 * new Command instances from a given line of script text.
 */
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

/**
 * {@code CommandResult} is an object containing definitions of
 * command results. The values are NORMAL, CONTINUE, and REPEAT.
 * NORMAL: Returned when a Command executes normally.
 * CONTINUE: Requests that the next command be executed immediately.
 * REPEAT: Requests that the same command be executed again next cycle.
 */
jzt.commands.CommandResult = {
    NORMAL: 0,
    CONTINUE: 1,
    REPEAT: 2
};

/**
 * {@code MovementExpression} is a representation of an expression that
 * calculates direction for movement.
 */
jzt.commands.MovementExpression = function(tokens) {
    this.tokens = tokens;
    this.times = 1;
    this._validate();
};

jzt.commands.MovementExpression.prototype._validate = function() {
    
    // We will be forming our expression here
    this.validatedTokens = [];
    
    // Initialize validation flags
    var concreteDirection = false;
    var done = false;
    
    // If no arguments were provided
    if(this.tokens.length <= 0) {
        throw 'Movement expression is empty.';
    }
    
    // For each of our arguments...
    for(var index = 0; index < this.tokens.length; ++index) {
        
        // If we are not expecting more tokens...
        if(done) {
            throw 'Movement expression contains unexpected token: ' + this.tokens[index];
        }
        
        var token = this.tokens[index].toUpperCase();
        
        switch(token) {
            case 'CW':
            case 'CCW':
            case 'OPP':
                concreteDirection = false;
                this.validatedTokens.push(token);
                break;
            case 'SEEK':
            case 'FLOW':
            case 'RAND':
            case 'RANDEW':
            case 'RANDNS':
                concreteDirection = true;
                this.validatedTokens.push(token);
                break;
            default:
            
                var direction = jzt.Direction.parse(token);
                
                // If we successfully parsed a direction...
                if(direction) {
                    concreteDirection = true;
                    this.validatedTokens.push(direction);
                }
                
                // If we could not parse a direction...
                else {
                    
                    // Try to parse the token as a number
                    var times = parseInt(token);
                    
                    // If that failed, there was an error
                    if(times == NaN) {
                        throw 'Movement expression contains unexpected token: ' + token;
                    }
                    
                    // If no concrete direction was encountered by now, that's an error
                    if(!concreteDirection) {
                        throw 'Movement expression does not contain a direction.';
                    }
                    
                    // Store our repeat times
                    this.times = times;

                    // We do not expect tokens after a number
                    done = true;
                    
                }
        }
    }
};

/**
 * Evaluates this {@code MovementExpression}'s tokens and returns
 * a Direction instance indicating the result of the expression.
 *
 * @param owner A JztObject on which this command is acting
 * @return a Direction
 */
jzt.commands.MovementExpression.prototype.evaluate = function(owner) {
    return this._evaluate(owner, 0);
};

jzt.commands.MovementExpression.prototype._evaluate = function(owner, tokenIndex) {
    
    var token = this.validatedTokens[tokenIndex];

    switch(token) {
        case 'OPP':
            return jzt.Direction.opposite( this._evaluate(owner,tokenIndex+1) );
        case 'CW':
            return jzt.Direction.clockwise( this._evaluate(owner,tokenIndex+1) );
        case 'CCW':
            return jzt.Direction.counterClockwise( this._evaluate(owner,tokenIndex+1) );
        case 'RAND':
            return jzt.Direction.random();
        case 'RANDEW':
            return jzt.Direction.randomX();
        case 'RANDNS':
            return jzt.Direction.randomY();
        case 'SEEK':
            return owner.playerDirection();
        case 'FLOW':
            return owner.orientation;
        default:
            return token;
    }
    
};

/**
 *{@code SayCommand} is a Command instance that outputs text to the
 * screen.
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

/**
 * {@code MoveCommand} is a Command capable of moving an owner object
 * on a game board.
 */
jzt.commands.MoveCommand = function(tokens) {
    this.movementExpression = new jzt.commands.MovementExpression(tokens);
    this.times = this.movementExpression.times;
};

jzt.commands.MoveCommand.prototype.execute = function(owner) {

    var direction;

    // If we aren't stuck, calculate our next direction
    if(!this.stuck) {
        
        // Evaluate our expression into a direction
        direction = this.movementExpression.evaluate(owner);
        
    }
    
    // If we are stuck, we will continue trying that direction
    else {
        direction = this.stuck;
    }
    
    // If a direction is available
    if(direction) {
        
        jzt.debug.log('%s wishes to move %s.', owner.name, jzt.Direction.getName(direction));
        var success = owner.move(direction);
        
        // If we were not successful, we're stuck
        if(!success) {
            
            this.stuck = direction;
            jzt.debug.log('But %s is stuck!', owner.name);
            
            // We will try again until we're free
            return jzt.commands.CommandResult.REPEAT;
            
        }
        
        // If we are to move a number of times...
        else if(--this.times > 0) {
            this.stuck = undefined;
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