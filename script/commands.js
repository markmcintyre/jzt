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

/**
 * Direction Modifier Enumerated Types
 * 
 * Each direction modifier has an associated token value, a display name, and a process function.
 * The process function takes a direction and returns a final, calculated direction value.
 */
jzt.commands.DirectionModifier = {
    CW:   {name: 'Clockwise',              process: function(d) {return jzt.Direction.clockwise(d);}},
    CCW:  {name: 'Counter-clockwise',      process: function(d) {return jzt.Direction.counterClockwise(d)}},
    OPP:  {name: 'Opposite',               process: function(d) {return jzt.Direction.opposite(d);}},
    RNDP: {name: 'Perpendicularly Random', process: function(d) {return jzt.Direction.randomPerpendicular(d);}}
};

/**
 * Direction Enumerated Types
 *
 * Each direction has an associated token value, a display name, and a process function.
 * The process function takes a JztObject and returns a final, calculated direction value.
 */
jzt.commands.Direction = {
    
    SEEK:  {name: 'Toward player',            process: function(o) {return o.playerDirection();}},
    FLOW:  {name: 'Current orientation',      process: function(o) {return o.orientation;}},
    RAND:  {name: 'Random direction',         process: function()  {return jzt.Direction.random();}},
    RANDF: {name: 'Random free direction',    process: function(o) {return jzt.Direction.random(o.getFreeDirections());}},
    RANDB: {name: 'Random blocked direction', process: function(o) {return jzt.Direction.random(o.getBlockedDirections());}},
    RNDEW: {name: 'Randomly East or West',    process: function()  {return jzt.Direction.randomEastWest();}},
    RNDNS: {name: 'Randomly North or South',  process: function()  {return jzt.Direction.randomNorthSouth();}},
    RNDNE: {name: 'Randomly North or East',   process: function()  {return jzt.Direction.randomNorthEast();}},
    NORTH: {name: 'North',                    process: function()  {return jzt.Direction.North;}},
    EAST:  {name: 'East',                     process: function()  {return jzt.Direction.East;}},
    SOUTH: {name: 'South',                    process: function()  {return jzt.Direction.South;}},
    WEST:  {name: 'West',                     process: function()  {return jzt.Direction.West;}},
    N:     {name: 'North shorthand',          process: function()  {return jzt.Direction.North;}},
    E:     {name: 'East shorthand',           process: function()  {return jzt.Direction.East;}},
    S:     {name: 'South shorthand',          process: function()  {return jzt.Direction.South;}},
    W:     {name: 'West shorthand',           process: function()  {return jzt.Direction.West;}}

};

/*
 * Char Command
 */
jzt.commands.Char = function() {
    this.character = undefined;
};

jzt.commands.Char.prototype.clone = function() {
    var clone = new jzt.commands.Char();
    clone.character = this.character;
    return clone;
};

jzt.commands.Char.prototype.execute = function(owner) {
    owner.spriteIndex = this.character;
};

/*
 * Die Command
 */
jzt.commands.Die = function() {};
jzt.commands.Die.prototype.clone = function() {return this;};

jzt.commands.Die.prototype.execute = function(owner) {
    owner.die();
};

/*
 * End Command
 */
jzt.commands.End = function() {};
jzt.commands.End.prototype.clone = function() {return this;};

jzt.commands.End.prototype.execute = function(owner) {
    owner.stopScript();
};

/*
 * Go Command
 */
jzt.commands.Go = function() {
    this.modifiers = [];
    this.direction = undefined;
    this.count = 1;
};

jzt.commands.Go.prototype.clone = function() {
    var clone = new jzt.commands.Go();
    clone.modifiers = this.modifiers.slice(0);
    clone.direction = this.direction;
    clone.count = this.count;
    return clone;
};

jzt.commands.Go.prototype.execute = function(owner) {
    
    // Get our direction from our expression
    var direction = this.direction.process(owner);
    
    // Evaluate our modifiers into a direction
    var modifiers = this.modifiers.slice(0);
    for(var modifier; modifier = modifiers.pop();) {
        direction = modifier.process(direction);
    }

    // If a direction is available
    if(direction) {

        owner.move(direction);

        // If we are to go a number of times...
        if(--this.count > 0) {
            return jzt.commands.CommandResult.REPEAT;
        }

    }

};

/*
 * Label
 */
jzt.commands.Label = function() {
    this.id = undefined;
    this.indicies = [];
    this.currentIndex = -1;
};

jzt.commands.Label.prototype.clone = function() {
    var clone = new jzt.commands.Label();
    clone.id = this.id;
    clone.indicies = this.indicies.slice(0);
    clone.currentIndex = this.currentIndex;
    return clone;
};

/*
 * Lock Command
 */
jzt.commands.Lock = function() {};
jzt.commands.Lock.prototype.clone = function(){return this;};
jzt.commands.Lock.prototype.execute = function(owner) {
    owner.setLocked(true);
    return jzt.commands.CommandResult.CONTINUE;
};

/*
 * Move Command
 */
jzt.commands.Move = function() {
    this.modifiers = [];
    this.direction = undefined;
    this.count = 1;
};

jzt.commands.Move.prototype.clone = function() {
    var clone = new jzt.commands.Move();
    clone.modifiers = this.modifiers.slice(0);
    clone.direction = this.direction;
    clone.count = this.count;
    return clone;
};

jzt.commands.Move.prototype.execute = function(owner) {
    
    var direction;

    // If we aren't stuck, calculate our next direction
    if(!this.stuck) {
        
        direction = this.direction.process(owner);
        
        // Evaluate our modifiers into a direction
        var modifiers = this.modifiers.slice(0);
        for(var modifier; modifier = modifiers.pop();) {
            direction = modifier.process(direction);
        }
        
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
        else if(--this.count > 0) {
            this.stuck = undefined;
            return jzt.commands.CommandResult.REPEAT;
        }
        
    }
    
};

/*
 * Restore Command
 */
jzt.commands.Restore = function() {
    this.label = undefined;
};

jzt.commands.Restore.prototype.clone = function() {
    var clone = new jzt.commands.Restore();
    clone.label = this.label;
    return clone;
};

jzt.commands.Restore.prototype.execute = function(owner) {
    owner.script.restoreLabel(this.label);
    return jzt.commands.CommandResult.CONTINUE;
};

/*
 * Say Command
 */
jzt.commands.Say = function() {
    this.text = undefined;
};

jzt.commands.Say.prototype.clone = function() {
    var clone = new jzt.commands.Say();
    clone.text = this.text;
    return clone;
};

jzt.commands.Say.prototype.execute = function(owner) {
    jzt.debug.log('%s says: %s', owner.name, this.text);
    return jzt.commands.CommandResult.CONTINUE;
};

/**
 * Wait Command
 */
jzt.commands.Wait = function() {
    this.cycles = 1;
};

jzt.commands.Wait.prototype.clone = function() {
    var clone = new jzt.commands.Wait();
    clone.cycles = this.cycles;
    return clone;
};

jzt.commands.Wait.prototype.execute = function(owner) {
    if(--this.cycles > 0) {
        return jzt.commands.CommandResult.REPEAT;
    }
};
