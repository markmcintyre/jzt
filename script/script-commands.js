window.jzt = window.jzt || {};
jzt.commands = jzt.commands || {};

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

/*==================================================================
 * START OF EXPRESSIONS
 *=================================================================*/

/*
 * {@code DirectionExpression} is an expression that calculates a direction.
 *
 * @param tokens Tokens to be interpreted as this expression.
 */
jzt.commands.DirectionExpression = function(tokens) {
    this._directions = jzt.commands.DirectionExpression.Directions;
    this._modifiers = jzt.commands.DirectionExpression.Modifiers;
    this._validate(tokens);
}

/**
 * Direction Modifier Enumerated Types
 * 
 * Each direction modifier has an associated token value, a display name, and a process function.
 * The process function takes a direction and returns a final, calculated direction value.
 */
jzt.commands.DirectionExpression.Modifiers = {
    CW:   {tokenValue: 'CW',   name: 'Clockwise',              process: function(d) {return jzt.Direction.clockwise(d);}},
    CCW:  {tokenValue: 'CCW',  name: 'Counter-clockwise',      process: function(d) {return jzt.Direction.counterClockwise(d)}},
    OPP:  {tokenValue: 'OPP',  name: 'Opposite',               process: function(d) {return jzt.Direction.opposite(d);}},
    RNDP: {tokenValue: 'RNDP', name: 'Perpendicularly Random', process: function(d) {return jzt.Direction.randomPerpendicular(d);}}
};

/**
 * Direction Enumerated Types
 *
 * Each direction has an associated token value, a display name, and a process function.
 * The process function takes a JztObject and returns a final, calculated direction value.
 */
jzt.commands.DirectionExpression.Directions = {
    
    SEEK:  {tokenValue: 'SEEK',  name: 'Toward player',            process: function(o) {return o.playerDirection();}},
    FLOW:  {tokenValue: 'FLOW',  name: 'Current orientation',      process: function(o) {return o.orientation;}},
    RAND:  {tokenValue: 'RAND',  name: 'Random direction',         process: function()  {return jzt.Direction.random();}},
    RANDF: {tokenValue: 'RANDF', name: 'Random free direction',    process: function(o) {return jzt.Direction.random(o.getFreeDirections());}},
    RANDB: {tokenValue: 'RANDB', name: 'Random blocked direction', process: function(o) {return jzt.Direction.random(o.getBlockedDirections());}},
    RNDEW: {tokenValue: 'RNDEW', name: 'Randomly East or West',    process: function()  {return jzt.Direction.randomEastWest();}},
    RNDNS: {tokenValue: 'RNDNS', name: 'Randomly North or South',  process: function()  {return jzt.Direction.randomNorthSouth();}},
    RNDNE: {tokenValue: 'RNDNE', name: 'Randomly North or East',   process: function()  {return jzt.Direction.randomNorthEast();}},
    NORTH: {tokenValue: 'NORTH', name: 'North',                    process: function()  {return jzt.Direction.North;}},
    EAST:  {tokenValue: 'EAST',  name: 'East',                     process: function()  {return jzt.Direction.East;}},
    SOUTH: {tokenValue: 'SOUTH', name: 'South',                    process: function()  {return jzt.Direction.South;}},
    WEST:  {tokenValue: 'WEST',  name: 'West',                     process: function()  {return jzt.Direction.West;}},
    N:     {tokenValue: 'N',     name: 'North shorthand',          process: function()  {return jzt.Direction.North;}},
    E:     {tokenValue: 'E',     name: 'East shorthand',           process: function()  {return jzt.Direction.East;}},
    S:     {tokenValue: 'S',     name: 'South shorthand',          process: function()  {return jzt.Direction.South;}},
    W:     {tokenValue: 'W',     name: 'West shorthand',           process: function()  {return jzt.Direction.West;}}

};

jzt.commands.DirectionExpression.prototype._validate = function(tokens) {
    
    // We will be forming our expression here
    this.validatedTokens = [];

    // If no arguments were provided
    if(tokens.length <= 0) {
        throw 'Movement expression is empty.';
    }
    
    // While there are still tokens to process...
    while(tokens.length > 0) {
        
        // Peek at our token
        var token = tokens[0].toUpperCase();
        
        // If we have found a direction modifier...
        if(this._modifiers.hasOwnProperty(token)) {
            this.validatedTokens.push(token);
            tokens.shift();
        }
        
        // If we have found a direction
        else if(this._directions.hasOwnProperty(token)) {
            this.validatedTokens.push(token);
            tokens.shift();
            break;
        }
        
        else {
            throw 'Unexpected token in movement expression: ' + token;
        }
            
    }
    
};

/**
 * Evaluates this {@code DirectionExpression}'s validated tokens and returns
 * a Direction instance indicating the result of the expression.
 *
 * @param owner A JztObject on which this command is acting
 * @return a Direction
 */
jzt.commands.DirectionExpression.prototype.evaluate = function(owner) {
    return this._evaluate(owner, 0);
};

jzt.commands.DirectionExpression.prototype._evaluate = function(owner, tokenIndex) {
    
    // Get our current validated token
    var token = this.validatedTokens[tokenIndex];

    // If we've received a direction modifier, apply it now
    if(this._modifiers.hasOwnProperty(token)) {
        return this._modifiers[token].process( this._evaluate(owner, tokenIndex+1) );
    }
    
    // If we've received a calculable direction, process it now
    else if(this._directions.hasOwnProperty(token)) {
        return this._directions[token].process(owner);
    }
    
    return undefined;
    
};

/*
 * OptionalNumberExpression
 */
jzt.commands.OptionalNumberExpression = function(tokens, defaultValue) {
    
    this.value = defaultValue;
    
    if(tokens.length > 0) {
    
        var value = parseInt(tokens[0]);
        
        if(value != NaN) {
            this.value = value;
            tokens.shift();
        }
        
    }
    
};

jzt.commands.OptionalNumberExpression.prototype.evaluate = function() {
    return this.value;
};

/*
 * RequiredLabelExpression
 */
jzt.commands.RequiredLabelExpression = function(tokens) {
  
    if(tokens.length <= 0) {
        throw 'A label was expected.';
    }
    
    this.label = tokens.shift();
    
};

jzt.commands.RequiredLabelExpression.prototype.evaluate = function() {
    return this.label;
};

/*
 * RequiredStringExpression
 */
jzt.commands.RequiredStringExpression = function(tokens) {

    var token = tokens.shift();
    if(!token || token.charAt(0) != '"' || token.charAt(token.length-1) != '"') {
        throw 'A string was expected';
    }
    
    token = token.substring(1, token.length-1);
    token = token.replace(/\\/g, '');
    
    this.string = token;
    
};

jzt.commands.RequiredStringExpression.prototype.evaluate = function() {
    return this.string;
};

/*
 * RequiredNumberExpression
 */
jzt.commands.RequiredNumberExpression = function(tokens) {
    
    var token = tokens.shift();

    if(!token) {
        throw 'A number was expected.';
    }
    
    var value = parseInt(token, 10);
    
    if(value == NaN) {
        throw 'A number was expected.';
    }
    
    this.number = value;
    
};

jzt.commands.RequiredNumberExpression.prototype.evaluate = function() {
    return this.number;
};

/*
 * Remaining Tokens
 */
jzt.commands.remainingTokens = function(tokens) {
    if(tokens.length > 0) {
        throw 'Unexpected token: ' + tokens[0];
    }
}

/*==================================================================
 * START OF COMMANDS
 *=================================================================*/

/*
 * DIE command
 */
jzt.commands.DieCommand = function(tokens) {
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.DieCommand.prototype.execute = function(owner) {
    owner.die();
};

 /*
  * END command
  */
jzt.commands.EndCommand = function(tokens) {
    jzt.commands.remainingTokens(tokens);
 };

 jzt.commands.EndCommand.prototype.execute = function(owner) {
     owner.stopScript();
     return jzt.commands.CommandResult.NORMAL;
 };

 /**
  * {@code GoCommand} is like the {@code MoveCommand} except it will
  * simply ignore commands that make an owner object walk into a wall
  * as opposed to waiting until its free.
  */
 jzt.commands.GoCommand = function(tokens) {
     
     this.expression = new jzt.commands.DirectionExpression(tokens);
     this.times = new jzt.commands.OptionalNumberExpression(tokens, 1).evaluate();
     jzt.commands.remainingTokens(tokens);
     
 };

 jzt.commands.GoCommand.prototype.execute = function(owner) {

     // Get our direction from our expression
     var direction = this.expression.evaluate(owner);

     // If a direction is available
     if(direction) {

         owner.move(direction);

         // If we are to go a number of times...
         if(--this.times > 0) {
             return jzt.commands.CommandResult.REPEAT;
         }

     }

     return jzt.commands.CommandResult.NORMAL;

 };

/*
 * Lock Command
 */
jzt.commands.LockCommand = function(tokens) {
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.LockCommand.prototype.execute = function(owner) {
    owner.setLocked(true);
    return jzt.commands.CommandResult.CONTINUE;
};

/**
 * {@code MoveCommand} is a Command capable of moving an owner object
 * on a game board.
 */
jzt.commands.MoveCommand = function(tokens) {
    this.expression = new jzt.commands.DirectionExpression(tokens);
    this.times = new jzt.commands.OptionalNumberExpression(tokens, 1);
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.MoveCommand.prototype.execute = function(owner) {

    var direction;

    // If we aren't stuck, calculate our next direction
    if(!this.stuck) {
        
        // Evaluate our expression into a direction
        direction = this.expression.evaluate(owner);
        
    }
    
    // If we are stuck, we will continue trying that direction
    else {
        direction = this.stuck;
    }
    
    // If a direction is available
    if(direction) {
        
        var success = owner.move(direction);
        
        // If we were not successful, we're stuck
        if(!success) {
            
            this.stuck = direction;
            
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
 * Nothing Command
 */
jzt.commands.NothingCommand = function() {};
jzt.commands.NothingCommand.prototype.execute = function() {
    return jzt.commands.CommandResult.CONTINUE;
};

/*
 * Restore Command
 */
jzt.commands.RestoreCommand = function(tokens) {
    this.label = new jzt.commands.RequiredLabelExpression(tokens).evaluate();
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.RestoreCommand.prototype.execute = function(owner) {
    owner.script.restoreLabel(this.label);
    return jzt.commands.CommandResult.CONTINUE;
};

/**
 *{@code SayCommand} is a Command instance that outputs text to the
 * screen.
 */
jzt.commands.SayCommand = function(tokens) {
    this.text = new jzt.commands.RequiredStringExpression(tokens).evaluate();
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.SayCommand.prototype.execute = function(owner) {
    jzt.debug.log('%s says: %s', owner.name, this.text);
    return jzt.commands.CommandResult.CONTINUE;
};

/*
 * STAND command
 */
jzt.commands.StandCommand = function(tokens) {
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.StandCommand.prototype.execute = function(owner) {
    owner.walkDirection = undefined;
};

/*
 * Unlock Command
 */
jzt.commands.UnlockCommand = function(tokens) {
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.UnlockCommand.prototype.execute = function(owner) {
    owner.setLocked(false);
    return jzt.commands.CommandResult.CONTINUE;
};

/* 
 * WAIT command
 */
jzt.commands.WaitCommand = function(tokens) {
    this.cycles = new jzt.commands.RequiredNumberExpression(tokens).evaluate();
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.WaitCommand.prototype.execute = function(owner) {
    
    if(--this.cycles > 0) {
        return jzt.commands.CommandResult.REPEAT;
    }

    return jzt.commands.CommandResult.NORMAL;
    
};

/*
 * WALK COMMAND
 */
jzt.commands.WalkCommand = function(tokens) {
    this.expression = new jzt.commands.DirectionExpression(tokens);
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.WalkCommand.prototype.execute = function(owner) {
    
    // Evaluate our expression into a direction
    var direction = this.expression.evaluate(owner);
    
    // Assign our walking direction
    owner.walkDirection = direction;
    
};

/*
 * Zap Command
 */
jzt.commands.ZapCommand = function(tokens) {
    this.label = new jzt.commands.RequiredLabelExpression(tokens).evaluate();
    jzt.commands.remainingTokens(tokens);
};

jzt.commands.ZapCommand.prototype.execute = function(owner) {
    owner.script.zapLabel(this.label);
    return jzt.commands.CommandResult.CONTINUE;
};

/*==================================================================
 * SCRIPT COMMAND FACTORY
 *=================================================================*/

/**
 * {@code ScriptCommandFactory} is a factory object capable of creating
 * new Command instances from a given line of script text.
 */
jzt.ScriptCommandFactory = jzt.ScriptCommandFactory || {};

jzt.ScriptCommandFactory.create = function(line) {
    
    var tokens = line.match(/\w+|"(?:\\"|[^"])+"|[^\s]/g);
    
    // If we successfully found some tokens...
    if(tokens.length > 0) {
        
        // Grab our line indicator token
        var lineType = tokens.shift();
        
        // Parse the command depending on the indicator
        switch(lineType) {
            case '#':
                return jzt.ScriptCommandFactory._parseCommand(tokens);
            case ':':
                return new jzt.commands.NothingCommand();
        }
        
    }
    
    return undefined;
    
};

jzt.ScriptCommandFactory._getCommandByName = function(name) {
    
    var candidate = name.toUpperCase();
    
    if(jzt.ScriptCommandFactory._commandMap.hasOwnProperty(candidate)) {
        return jzt.ScriptCommandFactory._commandMap[candidate];
    }
    
    return undefined;
    
};

jzt.ScriptCommandFactory._parseCommand = function(tokens) {
  
    var commandToken = tokens.shift();
    var command = jzt.ScriptCommandFactory._getCommandByName(commandToken);
    
    if(command) {
        return new command(tokens);
    }
    
    return undefined;

  
};

jzt.ScriptCommandFactory._commandMap = {
    DIE: jzt.commands.DieCommand,
    END: jzt.commands.EndCommand,
    GO: jzt.commands.GoCommand,
    LOCK: jzt.commands.LockCommand,
    MOVE: jzt.commands.MoveCommand,
    RESTORE: jzt.commands.RestoreCommand,
    SAY: jzt.commands.SayCommand,
    STAND: jzt.commands.StandCommand,
    UNLOCK: jzt.commands.UnlockCommand,
    WAIT: jzt.commands.WaitCommand,
    WALK: jzt.commands.WalkCommand,
    ZAP: jzt.commands.ZapCommand
};