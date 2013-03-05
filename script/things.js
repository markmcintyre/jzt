window.jzt = window.jzt || {};
jzt.things = jzt.things || {};

/*
 * Thing represents a single 'thing' that can be associated with a Board. This can
 * range from players, to walls, to ScriptableThings. Each Thing has a location,
 * sprite index, and foreground and background color. Each Thing should also
 * be able to handle its own serialization and deserialization. Things may also
 * receive messages and take actions accordingly, either altering its own state
 * or making requests to its owner Board.
 *
 * @param board A Board instance to "own" this Thing.
 */
jzt.things.Thing = function(board) {
    this.name = undefined;
    this.spriteIndex = 63;
    this.board = board;
    this.point = new jzt.Point(0,0);
    this.foreground = jzt.colors.Colors['E'];
    this.background = jzt.colors.Colors['0'];
};

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.Thing.prototype.serialize = function() {
    var result = {};
    if(this.constructor.hasOwnProperty('serializationType')) {
        result.serializationType = this.constructor.serializationType;
    }
    result.name = this.name;
    result.spriteIndex = this.spriteIndex;
    result.x = this.point.x;
    result.y = this.point.y;
    result.color = this.background.code + (this.foreground == '*' ? '*' : this.foreground.code);
    return result;
};

/**
 * Deserializes a given data object and update's this Thing's state to
 * that data.
 *
 * @param data An object to be deserialized into this Thing.
 */
jzt.things.Thing.prototype.deserialize = function(data) {
    
    this.name = data.name;
    this.spriteIndex = data.spriteIndex || 63;
    this.point.x = data.x || 0;
    this.point.y = data.y || 0;
    
    var backgroundCode = data.color.charAt(0);
    var foregroundCode = data.color.charAt(1);
    
    this.foreground = foregroundCode == '*' ? foregroundCode : jzt.colors.Colors[foregroundCode];
    this.background = jzt.colors.Colors[backgroundCode];

};

/**
 * Delivers a provided message to this Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Thing.prototype.sendMessage = function(messageName) {};

/**
 * Retrurns whether or not this Thing declares itself to be pushable in a provided
 * direction by other Things.
 *
 * @param direction A direction in which to test the pushability of this Thing
 * @return True if this thing is pushable in a given direction, false otherwise.
 */
jzt.things.Thing.prototype.isPushable = function(direction) {
    return false;
};

/**
 * Moves this Thing in a provided Direction and returns its success.
 * 
 * @param direction A Direction in which to move this Thing.
 * @param weak If true, we will move weakly.
 * @param flier If true, we will move as a flier.
 * @return true if the move was successful, false otherwise.
 */
jzt.things.Thing.prototype.move = function(direction, weak, flier) {
    return this.board.moveTile(this.point, this.point.add(direction), weak, flier);
};

/**
 * Removes this Thing from its owner board.
 */
jzt.things.Thing.prototype.delete = function() {
    this.board.deleteTile(this.point);
};

// ------------------------------------------------------------------------------

/*
 * Updateable Thing is a Thing that can be updated during an execution cycle 
 * of its owner board. UpdateableThings may take different actions during updates.
 * 
 * @param board A Board to which this UpdateableThing belongs.
 */
jzt.things.UpdateableThing = function(board) {
    jzt.things.Thing.call(this, board);
    this.setSpeed(10);
};
jzt.things.UpdateableThing.prototype = new jzt.things.Thing();
jzt.things.UpdateableThing.prototype.constructor = jzt.things.UpdateableThing;

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.UpdateableThing.prototype.serialize = function() {
    var result = jzt.things.Thing.prototype.serialize.call(this) || {};
    result.speed = this.speed;
    if(this.under) {
        result.under = this.under.serialize();
    }
    return result;
};

/**
 * Deserializes a given data object and update's this Thing's state to
 * that data.
 *
 * @param data An object to be deserialized into this Thing.
 */
jzt.things.UpdateableThing.prototype.deserialize = function(data) {
    jzt.things.Thing.prototype.deserialize.call(this, data);
    if(data.under) {
        this.under = jzt.things.ThingFactory.deserialize(data.under);
    }
    this.setSpeed(data.speed);
};

/**
 * Assigns an update speed to this UpdateableThing. Things will only
 * execute their update logic at their own defined speed.
 *
 * @param A speed (in updates per second) at which this UpdateableThing
 *        will update itself.
 */
jzt.things.UpdateableThing.prototype.setSpeed = function(speed) {
    this.speed = speed;
    this.ticksPerCycle = Math.round(1000 / this.speed);
    this.nextTick = Date.now() + this.ticksPerCycle;
};

/**
 * Retrieves a Direction toward this UpdateableThing's Board's Player.
 *
 * @return a Direction toward a Player.
 */
jzt.things.UpdateableThing.prototype.getPlayerDirection = function() {
    return this.point.directionTo(this.board.player.point);
};

/**
 * Retrievs an Array of Directions in which this UpdateableThing is
 * free to move on its owner Board.
 *
 * @return An array of Directions.
 */
jzt.things.UpdateableThing.prototype.getFreeDirections = function() {
    
    var result = [];
    var instance = this;
    
    jzt.Direction.each(function(direction) {
        if(!instance.isBlocked(direction)) {
            result.push(direction);
        }
    });
    
    return result;

};

/**
 * Retrieves an Array of Directions in which this UpdateableThing is not free
 * to move on its owner Board.
 *
 * @return An array of Directions.
 */
jzt.things.UpdateableThing.prototype.getBlockedDirections = function() {
  
    var result = [];
    var instance = this;
    
    jzt.Direction.each(function(direction) {
       if(instance.isBlocked(direction)) {
           result.push(direction);
       }
    });
    
    return result;
 
};

/**
 * Updates this UpdateableThing for a single execution cycle.
 */
jzt.things.UpdateableThing.prototype.update = function() {};

// ------------------------------------------------------------------------------

/*
 * Scriptable Thing is an UpdateableThing capable of executing a Script instance
 * for its update cycles. This Script will be updated in a ScriptContext unique
 * to this ScriptableThing.
 *
 * @param board An owner board for this ScriptableThing.
 */
jzt.things.ScriptableThing = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.scriptContext = undefined;
    this.messageQueue = [];
    this.walkDirection = undefined;
    this.locked = false;
    this.orientation = undefined;
};
jzt.things.ScriptableThing.prototype = new jzt.things.UpdateableThing();
jzt.things.ScriptableThing.prototype.constructor = jzt.things.ScriptableThing;
jzt.things.ScriptableThing.serializationType = 'Scriptable';

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.ScriptableThing.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this) || {};

    result.serializationType = jzt.things.ScriptableThing.serializationType;
    result.script = this.scriptName;

    if(this.scriptContext) {
        result.scriptContext = this.scriptContext.serialize();
        result.messageQueue = this.messageQueue.slice(0);
        jzt.util.storeOption(result, 'walkDirection', jzt.Direction.getName(this.walkDirection));
        jzt.util.storeOption(result, 'locked', this.locked);
        jzt.util.storeOption(result, 'orientation', jzt.Direction.getName(this.orientation));
    }

    return result;

};

/**
 * Deserializes a given data object and update's this Thing's state to
 * that data.
 *
 * @param data An object to be deserialized into this Thing.
 */
jzt.things.ScriptableThing.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.scriptName = data.script;
    var script = this.board.getScript(this.scriptName);
    if(script) {
        this.scriptContext = script.newContext(this);
        if(data.scriptContext) {
            this.scriptContext.deserialize(data.scriptContext);
        }
    }
};

/**
 * Delivers a message to this ScriptableThing. This message will be passed 
 * on to its Script during its next execution cycle if this ScriptableInstance
 * is not in a locked state.
 *
 * @param message A message to be delivered to this ScriptableThing.
 */
jzt.things.ScriptableThing.prototype.sendMessage = function(message) {
    
    // If we are ready to receive a message...
    if(!this.locked) {
    
        // We disallow duplicate messages in a row
        if(this.messageQueue[this.messageQueue.length-1] != message) {
            this.messageQueue.push(message);
        }
        
    }
    
};

/**
 * Moves this Thing in a provided Direction and returns its success.
 * 
 * @param direction A Direction in which to move this Thing.
 * @return true if the move was successful, false otherwise.
 */
jzt.things.ScriptableThing.prototype.move = function(direction) {
    this.orientation = direction;
    return jzt.things.UpdateableThing.prototype.move.call(this, direction);
};

/**
 * Makes this ScriptableThing walk in its current walking direction.
 * ScriptableThings can walk while executing other instructions. If this
 * ScriptableThing walks into an obsticle and cannot continue walking,
 * it will receive a 'THUD' message and halt its walking direction.
 */
jzt.things.ScriptableThing.prototype.walk = function() {
    if(this.walkDirection) {
        
        if(this.isBlocked(this.walkDirection)) {
            this.sendMessage('THUD');
        }
        else {
            jzt.debug.log('%s is walking %s', this.name, jzt.Direction.getName(this.walkDirection));
            this.move(this.walkDirection);
        }
    }
};

/**
 * Updates this ScriptableThing for a single execution cycle, including its
 * associated Script.
 */
jzt.things.ScriptableThing.prototype.update = function() {
    
    var now = Date.now();
    
    if(now > this.nextTick) {
        this.walk();
        this.scriptContext.executeTick();
        this.nextTick = now + this.ticksPerCycle;
    };
    
};

/*==================================================================================
 * BUILT-IN THINGS
 *=================================================================================*/
 
/*
 * A Boulder is a Thing that is pushable in all directions.
 * 
 * @param board An owner board for this Boulder.
 */
jzt.things.Boulder = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 254;
};
jzt.things.Boulder.prototype = new jzt.things.Thing();
jzt.things.Boulder.prototype.constructor = jzt.things.Boulder;
jzt.things.Boulder.serializationType = 'Boulder';
jzt.things.Boulder.symbol = 'BL';

/**
 * Retrurns whether or not this Thing declares itself to be pushable in a provided
 * direction by other Things.
 *
 * @param direction A direction in which to test the pushability of this Thing
 * @return True if this thing is pushable in a given direction, false otherwise.
 */
jzt.things.Boulder.prototype.isPushable = function(direction) {
    return true;
};

//--------------------------------------------------------------------------------


/**
 * A Bullet is an UpdateableThing that represents a projectile.
 *
 * @param board An owner board for this Bullet
 */
jzt.things.Bullet = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 248;
    this.foreground = jzt.colors.Colors['F'];
    this.background = jzt.colors.Colors['0'];
    this.direction = jzt.Direction.North;
    this.cycle = 0;
};
jzt.things.Bullet.prototype = new jzt.things.UpdateableThing();
jzt.things.Bullet.prototype.constructor = jzt.things.Bullet;
jzt.things.Bullet.serializationType = 'Bullet';

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.Bullet.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this) || {};
    result.direction = this.direction;
    if(this.fromPlayer) {
        result.fromPlayer = true;
    }
    return result;
};

/**
 * Deserializes a given data object and update's this Thing's state to
 * that data.
 *
 * @param data An object to be deserialized into this Thing.
 */
 jzt.things.Bullet.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.direction = data.direction;
    if(data.fromPlayer) {
        this.fromPlayer = data.fromPlayer;
    }
 };

/**
 * Updates this bullet, moving it one tile in its associated
 * direction.
 */
jzt.things.Bullet.prototype.update = function() {

    if(++this.cycle > 1) {

        this.cycle = 0;

        // If we couldn't move in a given direction...
        if(! this.move(this.direction, true)) {

            // See what was in our way.
            var thing = this.board.getTile(this.point.add(this.direction));

            // If it was water, we can shoot over it!
            if(thing instanceof jzt.things.Water) {
                if(this.move(this.direction, true, true)) {
                    return;
                }
            }

            /*
             * Send a SHOT message if the bullet was from the player and any UpdateableThing, 
             * otherwise we only send the SHOT message to the player itself or ScriptabelThings.
             */
            else if((this.fromPlayer && thing instanceof jzt.things.UpdateableThing) ||
                    thing instanceof jzt.things.Player || thing instanceof jzt.things.ScriptableThing) {
                thing.sendMessage('SHOT');
            }

            // Regardless of what we hit, we're done
            this.delete();

        }

    }

};

//--------------------------------------------------------------------------------

/*
 * Forest acts as a non-pushable obstacle, like a wall, but it vanishes when the 
 * player attempts to move to its location, clearing this Thing from the board.
 *
 * @param board An owner board for this Forest
 */
jzt.things.Forest = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 176;
    this.foreground = jzt.colors.Colors['0'];
    this.background = jzt.colors.Colors['2'];
};
jzt.things.Forest.prototype = new jzt.things.Thing();
jzt.things.Forest.prototype.constructor = jzt.things.Forest;
jzt.things.Forest.serializationType = 'Forest';
jzt.things.Forest.symbol = 'FR';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Forest will be deleted from the board, allowing movement onto its
 * space.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Forest.prototype.sendMessage = function(message) {
    if(message == 'TOUCH') {
        this.board.deleteTile(this.point);
    }
}

//--------------------------------------------------------------------------------

/*
 * InvisibleWall will appear invisible until it is touched, at which point it
 * becomes a regular Wall.
 * 
 * @param board An owner Board.
 */
jzt.things.InvisibleWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 0;
    this.foreground = jzt.colors.Colors['A'];
};
jzt.things.InvisibleWall.prototype = new jzt.things.Thing();
jzt.things.InvisibleWall.prototype.constructor = jzt.things.InvisibleWall;
jzt.things.InvisibleWall.serializationType = 'InvisibleWall';
jzt.things.InvisibleWall.symbol = 'IW';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Thing will turn into a Wall Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.InvisibleWall.prototype.sendMessage = function(message) {
    if(message == 'TOUCH') {
        var replacement = new jzt.things.Wall();
        replacement.foreground = this.foreground;
        replacement.background = this.background;
        this.board.replaceTile(this.point, replacement);
    }
};
 
//--------------------------------------------------------------------------------

/*
 * Player is an UpdateableThing that is controllable by the user and represents
 * the primary action point for gameplay.
 *
 * @param board An owner board for this Player.
 */ 
jzt.things.Player = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    
    var now = Date.now();
    
    this.name = 'Player';
    this.spriteIndex = 2;
    this.point = new jzt.Point(-1,-1);
    this.foreground = jzt.colors.Colors['F'];
    this.background = jzt.colors.Colors['1'];
    this.speed = 9;
    
    this.torch = false;
    this.torchStrength = 0;
    this.torchExpiry = now;
    this.nextMove = now;
    this.game = undefined;
    
    this.TORCH_TTL = 60000; // One Minute
    this.MAX_TORCH_STRENGTH = 4;
    
};
jzt.things.Player.prototype = new jzt.things.UpdateableThing();
jzt.things.Player.prototype.constructor = jzt.things.Player;

/**
 * Retrurns whether or not this Thing declares itself to be pushable in a provided
 * direction by other Things.
 *
 * @param direction A direction in which to test the pushability of this Thing
 * @return True if this thing is pushable in a given direction, false otherwise.
 */
jzt.things.Player.prototype.isPushable = function(direction) {
    return true;
};

/**
 * Moves this Thing in a provided Direction and returns its success.
 * 
 * @param direction A Direction in which to move this Thing.
 * @return true if the move was successful, false otherwise.
 */
jzt.things.Player.prototype.move = function(direction) {
    
    // Calculate our new location
    var newLocation = this.point.add(direction);

    // We can move again at the next cycle
    this.nextMove = Date.now() + Math.round(1000 / this.speed);
    
    // First, check if the direction is outside the board
    if(this.board.isOutside(newLocation)) {

        // Find out which direction we're moving to
        var direction = this.point.directionTo(newLocation);
        this.board.movePlayerOffBoard(direction);

        // This isn't a typical board move
        return false;

    }

    // If we're not moving off board, inspect the thing we're moving to
    var thing = this.board.getTile(newLocation);
    
    // If there's a tile there, send it a touch message
    if(thing) {
        thing.sendMessage('TOUCH');
    }

    return this.board.moveTile(this.point, newLocation);;
    
};

/**
 * Shoots a player bullet in a provided Direction.
 *
 * @param A Direction in which to shoot a player bullet.
 */
jzt.things.Player.prototype.shoot = function(direction) {
    
    // We can move again at the next cycle
    this.nextMove = Date.now() + Math.round(1000 / this.speed);

    // Shoot
    jzt.things.ThingFactory.shoot(this.board, this.point.add(direction), direction, true);

};

/**
 * Updates this Player for a single execution cycle. During its update,
 * Player will check for keypresses and move accordingly.
 */
jzt.things.Player.prototype.update = function() {
    
    var now = Date.now();
        
    if(this.torch) {
        this.updateTorch(now);
    }
        
    // We can only move when permissable speed-wise
    if( now > this.nextMove ) {
        
        var k = this.game.keyboard;

        // If the Shift key is pressed, the player would like to shoot
        if(k.isPressed(k.SHIFT)) {
            if(k.isPressed(k.UP)) this.shoot(jzt.Direction.North);
            else if(k.isPressed(k.LEFT)) this.shoot(jzt.Direction.West);
            else if(k.isPressed(k.DOWN)) this.shoot(jzt.Direction.South);
            else if(k.isPressed(k.RIGHT)) this.shoot(jzt.Direction.East);
        }

        // Otherwise the player would like to move
        else {
            if (k.isPressed(k.UP)) this.move(jzt.Direction.North);
            else if (k.isPressed(k.LEFT)) this.move(jzt.Direction.West);
            else if (k.isPressed(k.DOWN)) this.move(jzt.Direction.South);
            else if (k.isPressed(k.RIGHT)) this.move(jzt.Direction.East);
        }
        
    }
    
};

/**
 * Uses a torch, illuminating surrounding tiles if a given board is
 * dark.
 */
jzt.things.Player.prototype.useTorch = function() {
    this.torch = true;
    this.torchExpiry = Date.now() + this.TORCH_TTL;
    this.torchStrength = this.MAX_TORCH_STRENGTH;
};

/**
 * Updates this Player's torch as of a provided timestamp moment, dimming
 * the surrounding area as the torch ages.
 *
 * @param timeStamp A moment representing a new reality for this Player's torch.
 */
jzt.things.Player.prototype.updateTorch = function(timeStamp) {
    
    // If we've already past our torch expiry date
    if(timeStamp > this.torchExpiry) {
        this.torch = false;
    }
    
    // Otherwise...
    else {
        
        // Calculate our torche's life remaining
        var torchLife = this.torchExpiry - timeStamp;
        
        // If there are 20 seconds left...
        if(torchLife > 20000) {
            this.torchStrength = 4;
        }
        
        // If there are 10 seconds left...
        else if(torchLife > 10000) {
            this.torchStrength = 3;
        }
        
        // If there are 5 seconds left...
        else if(torchLife > 5000) {
            this.torchStrength = 2;
        }
        
        // Otherwise...
        else {
            this.torchStrength = 1;
        }
        
    }
    
};

/**
 * Retrieves whether or not a given point is within range of this Player's
 * torch.
 *
 * @param point A point to test if it is within this Player's torch range
 * @return true if a point is within torch range, false otherwise.
 */
jzt.things.Player.prototype.inTorchRange = function(point) {
    
    // If we don't have a torch, we can only see ourselves
    if(!this.torch) {
        return point.x == this.point.x && point.y == this.point.y;
    }
    
    // Otherwise...
    else {

        // Calculate the distance between us and the point
        var xDiff = Math.abs(point.x - this.point.x);
        var yDiff = Math.abs(point.y - this.point.y);

        // Calculate a torch modifier based on its strength
        var torchModifier = this.MAX_TORCH_STRENGTH - this.torchStrength;
        yDiff = yDiff + torchModifier;

        // Our radius depends on the distance
        switch(yDiff) {
          case 0:
                return xDiff <= 7 - torchModifier;
          case 1:
          case 2:
                return xDiff <= 6 - torchModifier;
          case 3:
                return xDiff <= 5 - torchModifier;
          case 4:
                return xDiff <= 4 - torchModifier;
          default:
                return false;
        }

    }  
};

//--------------------------------------------------------------------------------

/*
 * Wall is a Thing representing an immoveable obstacle.
 *
 * @param board An owner board for this Wall.
 */ 
jzt.things.Wall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 178;
};
jzt.things.Wall.prototype = new jzt.things.Thing();
jzt.things.Wall.prototype.constructor = jzt.things.Wall;
jzt.things.Wall.prototype.serializationType = 'Wall';
jzt.things.Wall.symbol = 'WL';

//--------------------------------------------------------------------------------

/*
 * Water is a Thing representing an obstacle to most Things, except for
 * bullets and other potentially flying Things, which can pass over it.
 */
jzt.things.Water = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 176;
    this.background = jzt.colors.Colors['F'];
    this.foreground = jzt.colors.Colors['9'];
};
jzt.things.Water.prototype = new jzt.things.Thing();
jzt.things.Water.prototype.constructor = jzt.things.Water;
jzt.things.Water.serializationType = 'Water';
jzt.things.Water.symbol = 'WT';

/*==================================================================================
 * THING FACTORY
 *=================================================================================*/
jzt.things.ThingFactory = jzt.things.ThingFactory || {};

/**
 * Creates a new Thing based on a provided symbol, and assigns it to a given board.
 *
 * @param symbol A symbol used as a shorthand to represent a built-in Thing.
 * @param board A board which should own the created Thing.
 */
jzt.things.ThingFactory.createThing = function(symbol, board) {

    // Create our thing map if it hasn't been created already
    var thingMap = jzt.things.ThingFactory.getThingMap();

    var thingFunction = thingMap.symbols[symbol];
    if(thingFunction) {
        return new thingFunction(board);
    }

};

/**
 * Creates a new Thing based on provided serialized data, and assigns it to a given board.
 * 
 * @param data Serialized data to turn into a Thing
 * @param board A board which should own the created Thing.
 */
jzt.things.ThingFactory.deserialize = function(data, board) {

    var thingMap = jzt.things.ThingFactory.getThingMap();

    var thingFunction = thingMap.serializationTypes[data.serializationType];
    if(thingFunction) {
        var result = new thingFunction(board);
        result.deserialize(data);
        return result;
    }

};

/**
 * Lazily fetches a map of Things that have declared themself as serializeable in
 * shorthand (symbol-based) or fully (serializationType).
 *
 * @return A map of Thing functions indexed by their symbols or serialization types.
 */ 
jzt.things.ThingFactory.getThingMap = function() {

    if(jzt.things.ThingFactory.thingMap === undefined) {

        jzt.things.ThingFactory.thingMap = {
            symbols: {},
            serializationTypes: {}
        };

        for(thing in jzt.things) {
            if(jzt.things.hasOwnProperty(thing)) {

                var thingProperty = jzt.things[thing];

                if(thingProperty.hasOwnProperty('symbol')) {
                    jzt.things.ThingFactory.thingMap.symbols[thingProperty.symbol] = thingProperty;
                }

                if(thingProperty.hasOwnProperty('serializationType')) {
                    jzt.things.ThingFactory.thingMap.serializationTypes[thingProperty.serializationType] = thingProperty;
                }

            }
        }
    }

    return jzt.things.ThingFactory.thingMap;

};


/**
 * Creates a new Bullet Thing on a provided board at a given point, oriented in
 * a provided direction. If the provided point is blocked by another UpdateableThing,
 * then that UpdateableThing will be sent a 'SHOT' message.
 */
jzt.things.ThingFactory.shoot = function(board, point, direction, fromPlayer) {

    // First, see if we need to spawn a bullet at all...
    var tile = board.getTile(point);

    // If an UpdateableThing is in the location, send it a shot message
    if((fromPlayer && tile instanceof jzt.things.UpdateableThing) ||
        tile instanceof jzt.things.Player || tile instanceof jzt.things.ScriptableThing) {
        tile.sendMessage('SHOT');
    }

    // If there's nothing there, or it's water, spawn a Bullet Thing
    else if(tile === undefined || tile instanceof jzt.things.Water) {
        
        var bullet = new jzt.things.Bullet(board);
        bullet.direction = direction;
        if(fromPlayer) {
            bullet.fromPlayer = fromPlayer;
        }

        if(tile instanceof jzt.things.Water) {
            bullet.under = tile;
        }

        board.addUpdateableThing(point, bullet);

    }

};