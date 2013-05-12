/**
 * JZT Things
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jzt = jzt || {};
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
    this.spriteIndex = 63;
    this.board = board;
    this.point = new jzt.Point(0,0);
    this.foreground = jzt.colors.Yellow;
    this.background = jzt.colors.Black;
    this.x = 0;
    this.y = 0;
};

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.Thing.prototype.serialize = function() {
    var result = {};
    if(this.constructor.hasOwnProperty('serializationType')) {
        result.type = this.constructor.serializationType;
    }
    result.color = jzt.colors.serialize(this.background, this.foreground);
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
jzt.things.Thing.prototype.deserialize = function(data) {

    if(data.color) {
        this.foreground = jzt.colors.deserializeForeground(data.color);
        this.background = jzt.colors.deserializeBackground(data.color);
    }
    else {
        if(!this.foreground) {
            this.foreground = jzt.colors.Yellow;
        }
        if(!this.background) {
            this.background = jzt.colors.Black;
        }
    }

    if(data.under) {
        this.under = jzt.things.ThingFactory.deserialize(data.under, this.board);
    }
    
};

/**
 * Plays a given audio notation. This function is a convenient shorthand
 * for a full call chain.
 *
 * @param notation An audio notation to play.
 * @param uninterruptable Whether or not this notation can be interrupted by another.
 * @param defer If set, we do not even schedule our notation if another is already playing.
 */
jzt.things.Thing.prototype.play = function(notation, uninterruptable, defer) {

    /*
     * Deferring audio means we don't even attempt to play something if another
     * is already playing. This not only saves wasted time scheduling audio
     * that will be cancelled by a future sound, but also allows previously
     * triggered sounds to take priority even if that sound wasn't declared
     * uninterruptable.
     */
    if(!defer || !this.board.game.resources.audio.isPlaying()) {
        this.board.game.resources.audio.play(notation, uninterruptable);
    }

};

/**
 * Adjusts a game counter by a provided value offset. This offset may be
 * positive (to increase the counter), or negative (to decrease it).
 *
 * @param counter A name of a counter
 * @param value A value by which to adjust a counter
 */
jzt.things.Thing.prototype.adjustCounter = function(counter, value) {
    this.board.game.adjustCounter(counter, value);
};

jzt.things.Thing.prototype.setCounterValue = function(counter, value) {
    this.board.game.setCounterValue(counter, value);
};

jzt.things.Thing.prototype.getCounterValue = function(counter) {
    return this.board.game.getCounterValue(counter);
};

/**
 * Delivers a provided message to this Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Thing.prototype.sendMessage = function() {};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 * @param pusher A Thing that is requesting the push.
 * @return true if the push resulted in a teleportation, undefined otherwise.
 */
jzt.things.Thing.prototype.push = function() {};

/**
 * Returns whether or not this Thing declares itself to be surrenderable to
 * a given sender.
 *
 * A Thing that is surrenderable will allow another Thing to occupy its
 * space on a board and will agree to be 'under' that Thing.
 *
 * @param sender A Thing requesting a surrender
 * @return true if this Thing agrees to surrender, false otherwise.
 */
jzt.things.Thing.prototype.isSurrenderable = function() {
    return false;
};

/**
 * Retrieves whether or not this Thing instance is blocked in a given direction.
 * A Thing is defined as blocked if a tile appears at that direction that is occupied
 * and is not willing to surrender its position to another tile.
 * 
 * @param direction A direction in which to test if this Thing is blocked
 * @return true if this Thing is blocked, false otherwise.
 */
jzt.things.Thing.prototype.isBlocked = function(direction) {

    var newPoint = this.point.add(direction);

    if(this.board.isFree(newPoint)) {
        return false;
    }

    var obstacle = this.board.getTile(newPoint);
    if(obstacle) {
        return !obstacle.isSurrenderable(this);
    }

};

/**
 * Retrieves whether or not this Thing instance is directly adjacent to a Player Thing in
 * a provided direction.
 *
 * @param direction A direction in which to test if this Thing is player adjacent
 * @return true if a Player thing is directly adjacent in a given direction, false otherwise.
 */
jzt.things.Thing.prototype.isPlayerAdjacent = function(direction) {
    var tile = this.board.getTile(this.point.add(direction));
    return tile && tile instanceof jzt.things.Player;
};

/**
 * Returns whether or not this Thing is aligned to the player
 * with a certain spread.
 *
 * @return true if player is aligned, false otherwise.
 */
jzt.things.Thing.prototype.isPlayerAligned = function(spread) {
    return this.point.aligned(this.board.player.point, spread);
};

/**
 * Moves this Thing in a provided Direction and returns its success.
 * 
 * @param direction A Direction in which to move this Thing.
 * @param weak If true, we will move weakly.
 * @return true if the move was successful, false otherwise.
 */
jzt.things.Thing.prototype.move = function(direction, weak) {
    return this.board.moveTile(this.point, this.point.add(direction), weak);
};

/**
 * Removes this Thing from its owner board.
 */
jzt.things.Thing.prototype.remove = function() {
    this.board.deleteTile(this.point);
};

/**
 * Retrieves a sprite index to be used to represent this Thing.
 *
 * @return A sprite index.
 */
jzt.things.Thing.prototype.getSpriteIndex = function() {
    return this.spriteIndex;
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
    this.cycleCount = 0;
    this.speed = 3;
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
    if(data.speed) {
        this.speed = data.speed;
    }
    this.cycleCount = Math.floor(Math.random() * this.speed);
};

/**
 * Retrieves a Direction toward this UpdateableThing's Board's Player.
 *
 * @return a Direction toward a Player.
 */
jzt.things.UpdateableThing.prototype.getPlayerDirection = function(axis) {
    return this.point.directionTo(this.board.player.point, axis);
};

jzt.things.UpdateableThing.prototype.getSmartDirection = function() {
    return this.board.getSmartDirection(this.point);
};

/**
 * Returns whether or not a position in a provided direction is attackable
 * by this UpdateableThing. Attackable positions are defined as free spots
 * or spots occupied by a player.
 *
 * return true if a provided direction is attackable, false otherwise
 */
jzt.things.UpdateableThing.prototype.isAttackable = function(direction) {
    return !this.isBlocked(direction) || this.isPlayerAdjacent(direction);
};

/**
 * Retrieves an Array of Directions in which this UpdateableThing can attack.
 * An attackable direction is defined as any direction that is free, or is
 * occupied by the player.
 * 
 * @return An array of Directions
 */
jzt.things.UpdateableThing.prototype.getAttackableDirections = function() {

    var result = [];
    var instance = this;
    jzt.Direction.each(function(direction) {
        if(instance.isAttackable(direction)) {
            result.push(direction);
        }
    });
    return result;

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
jzt.things.UpdateableThing.prototype.update = function() {

    if(this.board.game.state === jzt.GameState.GameOver) {
        this.doTick();
        return;
    }

    this.cycleCount++;

    if(this.cycleCount >= this.speed * this.board.game.CYCLE_RATE) {
        this.cycleCount = 0;
        this.doTick();
    }

};

jzt.things.UpdateableThing.prototype.updateOnReverse = function() {
    return false;
};

/**
 * Updates this UpdateableThing on its tick update cycle.
 */
jzt.things.UpdateableThing.prototype.doTick = function() {};

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
    this.name = undefined;
    this.scriptContext = undefined;
    this.messageQueue = [];
    this.walkDirection = undefined;
    this.locked = false;
    this.orientation = undefined;
    this.spriteIndex = 1;
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
    result.name = this.name;
    result.spriteIndex = this.spriteIndex;
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
    this.name = data.name;
    if(data.spriteIndex) {
        this.spriteIndex = data.spriteIndex;
    }
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
        if(this.messageQueue[this.messageQueue.length-1] !== message) {
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
jzt.things.ScriptableThing.prototype.doTick = function() {

    this.walk();
    this.scriptContext.executeTick();
    
};

/*==================================================================================
 * BUILT-IN THINGS
 *=================================================================================*/
 
/**
 * Ammo is a Thing that acts as an item capable of increasing a Game's 'ammo' counter
 * by five units when collected.
 *
 * @param board A board to own this Ammo instance
 */
jzt.things.Ammo = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 132;
    this.foreground = jzt.colors.Cyan;
};
jzt.things.Ammo.prototype = new jzt.things.Thing();
jzt.things.Ammo.prototype.constructor = jzt.things.Ammo;
jzt.things.Ammo.serializationType = 'Ammo';

/**
 * Pushes this Ammo in a provided direction on its owner Board.
 * 
 * @param direction A direction in which to push this Ammo
 */
jzt.things.Ammo.prototype.push = function(direction) {
    this.move(direction);
};

/**
 * Sends a provided message to this Ammo instance. If a TOUCH message is received
 * then this Ammo instance will be removed and increase the Game's 'ammo' counter
 * by five units.
 */
jzt.things.Ammo.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('tcc#d');
        this.adjustCounter('ammo', 5);
        this.remove();
    }
};

//--------------------------------------------------------------------------------

/**
 * Bear represents an UpdateableThing that will attack a Player when it is aligned
 * vertically or horizontally within a defined sensitivity range.
 * 
 * @param board A Board to own this Bear.
 */
jzt.things.Bear = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 153;
    this.foreground = jzt.colors.Brown;
    this.sensitivity = 9;
    this.speed = 3;
};
jzt.things.Bear.prototype = new jzt.things.UpdateableThing();
jzt.things.Bear.prototype.constructor = jzt.things.Bear;
jzt.things.Bear.serializationType = 'Bear';

/**
 * Serializes this Bear to an Object.
 *
 * @return A serialized Bear
 */
jzt.things.Bear.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.sensitivity = this.sensitivity;
    return result;
};

/**
 * Deserializes this Bear from a provided data Object
 * 
 * @param data A data Bear object to be deserialized.
 */
jzt.things.Bear.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.sensitivity = jzt.util.getOption(data, 'sensitivity', 9);
};

/**
 * Pushes this Bear in a given direction. If this Bear cannot be pushed,
 * it will be squished and removed from its owner Board.
 * 
 * @param direction A direction in which to push this Bear.
 */
jzt.things.Bear.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.play('t+c---c++++c--c');
        this.remove();
    }
};

/**
 * Delivers a provided message to this Thing. If a SHOT message is received,
 * then this Bear will be deleted from the board. If a TOUCH message is 
 * received, then the player will be sent a SHOT message.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Bear.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }

};

/**
 * Updates this Bear for a provided timestamp. This Bear will move itself randomly
 * during updates. If a Player blocks its movement, then the player will be sent
 * a SHOT message and this Bear will be removed from its parent board.
 */
jzt.things.Bear.prototype.doTick = function() {

    if(this.isPlayerAligned(10-this.sensitivity)) {

        // X-Axis always gets priority
        var direction = this.getPlayerDirection('x');

        // If we are already aligned with the player...
        if(direction === undefined) {
            direction = this.getPlayerDirection('y');
        }

        var thing = this.board.getTile(this.point.add(direction));
        if(thing && (thing instanceof jzt.things.BreakableWall || thing instanceof jzt.things.Player)) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }
        this.move(direction, true);
    }
   
};

//--------------------------------------------------------------------------------

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

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Boulder.prototype.push = function(direction) {
    if(this.move(direction)) {
        this.play('t--f', false, true);
    }
};

//--------------------------------------------------------------------------------

/**
 * BreakableWall represents an obstacle for a player until it is shot, at which
 * point the wall is removed from its owner Board.
 *
 * @param board An owner board for this BreakableWall.
 */
jzt.things.BreakableWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 177;
    this.background = jzt.colors.Black;
    this.foreground = jzt.colors.BrightCyan;
};
jzt.things.BreakableWall.prototype = new jzt.things.Thing();
jzt.things.BreakableWall.prototype.constructor = jzt.things.BreakableWall;
jzt.things.BreakableWall.serializationType = 'BreakableWall';

/**
 * Sends a provided message to this BreakableWall. If a SHOT message
 * is received, then this BreakableWall will vanish.
 * 
 * @param message A message to receive.
 */
jzt.things.BreakableWall.prototype.sendMessage = function(message) {
    if(message === 'SHOT') {
        this.play('t-c');
        this.remove();
    }
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
    this.foreground = jzt.colors.BrightWhite;
    this.background = undefined;
    this.direction = jzt.Direction.North;
    this.speed = 1;
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
 * Sends a provided message to this Bullet instance. If a Touch message is
 * received then the player will be sent a shot message and this Bullet will
 * be removed from its owner Board.
 *
 * @param message A message to be delivered to this Bullet.
 */
jzt.things.Bullet.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }
 };

/**
 * Retrieves whether or not this Bullet instance wishes to be updated on its owner Board's
 * reverse update cycle.
 */
jzt.things.Bullet.prototype.updateOnReverse = function() {
    return this.direction === jzt.Direction.South || this.direction === jzt.Direction.East;
};

/**
 * Updates this bullet, moving it one tile in its associated
 * direction.
 */
jzt.things.Bullet.prototype.doTick = function() {

    if(!this.move(this.direction, true)) {
        this.attack();
    }

};

/**
 * Attempts to Attack a Thing in this Bullet's path. If a player, ScriptableThing, or BreakableWall is in 
 * its path, that Thing will be sent a SHOT message. Otherwise, this Bullet will be removed from its owner
 * board.
 */
jzt.things.Bullet.prototype.attack = function() {

    // See what was in our way.
    var thing = this.board.getTile(this.point.add(this.direction));

    /*
     * Send a SHOT message if the bullet was from the player and any UpdateableThing, 
     * otherwise we only send the SHOT message to the player itself or ScriptabelThings.
     */
    if(this.fromPlayer ||
            thing instanceof jzt.things.Player || thing instanceof jzt.things.ScriptableThing || thing instanceof jzt.things.BreakableWall) {
        thing.sendMessage('SHOT');
    }

    // Regardless of what we hit, we're done
    this.remove();

};

/**
 * Attempts to push this Bullet.
 */
jzt.things.Bullet.prototype.push = function() {
    this.remove();
};

//--------------------------------------------------------------------------------

/**
 * Centipede is an UpdateableThing capable of chaining itself to other
 * Centipedes and moving around the board as a unit.
 *
 * @param board An owner board for this Centipede
 */
jzt.things.Centipede = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 79;
    this.foreground = jzt.colors.BrightBlue;
    this.background = jzt.colors.Black;
    this.speed = 3;
    this.follower = undefined;
    this.head = false;
    this.leader = undefined;
    this.linked = false;
    this.firstTick = true;
    this.orientation = undefined;
    this.deviance = 0;
    this.intelligence = 0;
};
jzt.things.Centipede.prototype = new jzt.things.UpdateableThing();
jzt.things.Centipede.prototype.constructor = jzt.things.Centipede;
jzt.things.Centipede.serializationType = 'Centipede';

/**
 * Serializes this Thing to an object and returns it.
 *
 * @return A serialized version of this Thing.
 */
jzt.things.Centipede.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.head = this.head;
    result.deviance = this.deviance;
    result.intelligence = this.intelligence;
    return result;
};

/**
 * Deserializes a given data object and update's this Thing's state to
 * that data.
 *
 * @param data An object to be deserialized into this Thing.
 */
jzt.things.Centipede.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.head = data.head;
    this.intelligence = data.intelligence;
    this.deviance = data.deviance;
    if(this.deviance > 10) {
        this.deviance = 10;
    }
    if(this.head) {
        this.spriteIndex = 233;
    }
    this.cycleCount = 0;
};

/**
 * Retrieves an unlinked, non-head, adjacent Centipede segment.
 *
 * @return An unlineked, non-head, adjacent Centipede segment.
 */
jzt.things.Centipede.prototype.getAdjacentSegment = function() {

    /**
     * Returns true if a provided candidate Thing is a Centipede, is 
     * unlinked, and is not a head.
     *
     * @param candidate a Thing
     * @return true if a candidate is an unlinked, non-head Centipede
     */
    function isUnlinkedSegment(candidate) {
        return candidate && candidate instanceof jzt.things.Centipede && !candidate.linked && !candidate.head;
    }

    var result;

    // Try North
    result = this.board.getTile(this.point.add(jzt.Direction.North));
    if(isUnlinkedSegment(result)) {
        return result;
    }

    // East
    result = this.board.getTile(this.point.add(jzt.Direction.East));
    if(isUnlinkedSegment(result)) {
        return result;
    }

    // South
    result = this.board.getTile(this.point.add(jzt.Direction.South));
    if(isUnlinkedSegment(result)) {
        return result;
    }

    // West
    result = this.board.getTile(this.point.add(jzt.Direction.West));
    if(isUnlinkedSegment(result)) {
        return result;
    }

    return undefined;

};

/**
 * Recursively links adjacent segments to a provided Centipede.
 *
 * @param leader a Centipede
 */
jzt.things.Centipede.prototype.linkSegments = function(leader) {

    this.linked = true;
    this.leader = leader;

    if(this.leader) {
        this.deviance = leader.deviance;
        this.intelligence = leader.intelligence;
        this.cycleCount = leader.cycleCount;
    }

    this.follower = this.getAdjacentSegment();

    if(this.follower) {
        this.follower.linkSegments(this);
    }

};

/**
 * Reverses the follower/leader relationship of this Centipede
 * and its followers.
 */
jzt.things.Centipede.prototype.reverse = function() {

    if(this.head) {
        this.head = false;
        this.spriteIndex = 79;
    }

    var nextSegment = this.follower;

    var oldLeader = this.leader;
    this.leader = this.follower;
    this.follower = oldLeader;

    if(nextSegment) {
        nextSegment.reverse();
    }

    else {
        this.becomeHead();
    }

};

/**
 * Turns this Centipede into a head segment.
 */
jzt.things.Centipede.prototype.becomeHead = function() {
    this.head = true;
    this.spriteIndex = 233;
    this.cycleCount = Math.floor(Math.random() * this.speed);
};

/**
 * Moves this Centipede in a given direction. If a Player is
 * located in that direction, this Centipede will be deleted
 * and the player will be sent a SHOT message, otherwise this
 * Centipede and its followers will move one step.
 *
 * @param direction A direction in which to move. This direction
 * is expected to be free for movement, but may contain a Player.
 */
jzt.things.Centipede.prototype.move = function(direction) {

    var myPlace = this.point;

    // If we're a head, check to see if we're attacking the player
    if(this.head && this.isPlayerAdjacent(direction)) {
        this.board.player.sendMessage('SHOT');
        this.remove();
        return;
    }

    this.board.moveTile(this.point, this.point.add(direction), true);

    if(this.follower) {
        direction = this.follower.point.directionTo(myPlace);
        this.follower.move(direction);
    }

};

/**
 * Requests that this Centipede be pushed in a given direction. Since
 * Centipedes can't be pushed, the Centipede will be deleted instead.
 *
 * @param direction A given direction to push this Centipede.
 */
jzt.things.Centipede.prototype.push = function() {
    this.play('t+c---c++++c--c');
    this.remove();
};

/**
 * Deletes this Centipede from its Board. Any leader and follower 
 * Centipedes will be updates to no longer contain this Centipede
 * as well.
 */
jzt.things.Centipede.prototype.remove = function() {

    if(this.leader) {
        this.leader.follower = undefined;
    }
    if(this.follower) {
        this.follower.leader = undefined;
    }

    jzt.things.UpdateableThing.prototype.remove.call(this);

};

/**
 * Sends a provided message to this Centipede. If a SHOT message
 * is received, then this Centipede will be deleted from its board.
 * If a TOUCH message is received, then the board's player will be 
 * sent a SHOT message and this Centipede will be deleted.
 *
 * @param message A message to be sent to this Centipede.
 */
jzt.things.Centipede.prototype.sendMessage = function(message) {
    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }
};

/**
 * Returns whether or not this Centipede should deviate from
 * its orientation. This is a probability based on this
 * Centipedes deviance property.
 *
 * @return true if this Centipede should deviate now, false otherwise.
 */
jzt.things.Centipede.prototype.deviate = function() {

    if(this.deviance === 0) {
        return false;
    }

    var randomValue = Math.floor(Math.random()*20);
    return randomValue <= this.deviance;

};

/**
 * Returns whether or not this Centipede should seek the player
 * at this moment, or if it should move randomly. This is a
 * probability based on this Centipede's intelligence property.
 */
jzt.things.Centipede.prototype.seekPlayer = function() {

    if(this.isPlayerAligned()) {

        var randomValue = Math.floor(Math.random()*10);
        return randomValue <= this.intelligence;

    }

    return false;

};

/**
 * Performs a tick.
 */
jzt.things.Centipede.prototype.doTick = function() {
    
    // If this is our first tick...
    if(this.firstTick) {
        this.firstTick = false;
    }

    // If this isn't our first tick...
    else {

        // If we aren't a head and don't have a leader, become one
        if(!this.head && this.leader === undefined) {
            this.becomeHead();
        }

    }

    // Centipedes only update if they are a head
    if(!this.head) {
        return;
    }

    // If we haven't initialized our segments, do it now
    if(!this.linked) {
        this.linkSegments();
    }

    // If we're to see the player now...
    if(this.seekPlayer()) {

        // Set our orientation toward the player
        this.orientation = this.getPlayerDirection();

    }

    // If we've got an orientation and it's attackable, move there
    if(this.orientation && this.isAttackable(this.orientation) && !this.deviate()) {
        this.move(this.orientation);
    }

    // Otherwise...
    else {

        // Find all attackable directions
        var availableDirections = this.getAttackableDirections();

        // If directions are available...
        if(availableDirections.length > 0) {

            // Pick one and remember it as our orientation
            var direction = jzt.Direction.random(availableDirections);
            this.orientation = direction;
            this.move(direction);

        }

        // If no direction was available, reverse ourselves
        else {
            this.reverse();
        }

    }

    
};

//--------------------------------------------------------------------------------

/**
 * Door is a Thing that acts as an obstacle unless an associated Key has been 
 * collected first.
 */
jzt.things.Door = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 10;
    this.foreground = jzt.colors.BrightWhite;
    this.background = jzt.colors.Blue;
};
jzt.things.Door.prototype = new jzt.things.Thing();
jzt.things.Door.prototype.constructor = jzt.things.Door;
jzt.things.Door.serializationType = 'Door';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received, then
 * this Door will vanish if an associated Key has been previously collected.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Door.prototype.sendMessage = function(message) {

    var doorType;
    var matchingKeyCode;

    if(message === 'TOUCH') {

        // Get a readable door description
        doorType = jzt.i18n.getMessage('doors.' + this.background.code);

        // Determine a matching key code
        matchingKeyCode = 'key' + this.background.lighten().code;

        // If the player has the corresponding key type...
        if(this.getCounterValue(matchingKeyCode) > 0) {
            this.remove();
            this.adjustCounter(matchingKeyCode, -1);
            this.board.setDisplayMessage(jzt.i18n.getMessage('doors.open', doorType));
            this.play('tcgbcgb+ic');
        }

        // If the player does not have the correct key...
        else {
            this.board.setDisplayMessage(jzt.i18n.getMessage('doors.locked', doorType));
            this.play('t--gc');
        }

    }

};

//--------------------------------------------------------------------------------

/**
 * FakeWall looks like a normal Wall, but is surrenderable to whatever Thing wishes
 * to move there.
 *
 * @param board An owner board for this FakeWall
 */
jzt.things.FakeWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 178;
    this.foreground = jzt.colors.Yellow;
    this.background = jzt.colors.Black;
};
jzt.things.FakeWall.prototype = new jzt.things.Thing();
jzt.things.FakeWall.prototype.constructor = jzt.things.FakeWall;
jzt.things.FakeWall.serializationType = 'FakeWall';

/**
 * Returns whether or not this FakeWall is surrenderable to another thing.
 *
 * @param sender Another Thing that is requesting this Thing to surrender
 * @return true if this Thing is willing to surrender its position.
 */
jzt.things.FakeWall.prototype.isSurrenderable = function() {
    return true;
};

/**
 * Retrieves a sprite index used to represent this FakeWall on a rendered
 * Board. If this FakeWall's owner board's game is in debug mode, then a visible
 * representation will be used.
 */
jzt.things.FakeWall.prototype.getSpriteIndex = function() {
    return this.board.game.isDebugRendering ? 176 : 178;
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
    this.foreground = jzt.colors.Black;
    this.background = jzt.colors.Green;
};
jzt.things.Forest.prototype = new jzt.things.Thing();
jzt.things.Forest.prototype.constructor = jzt.things.Forest;
jzt.things.Forest.noteCycle = ['e','-b','f#','b','f','c','g','+c'];
jzt.things.Forest.noteIndex = 0;
jzt.things.Forest.serializationType = 'Forest';

/**
 * Deserializes a provided data Object into Forest.
 *
 * @param data A data object to be deserialized into Forest.
 */
jzt.things.Forest.prototype.deserialize = function(data) {
    jzt.things.Thing.prototype.deserialize.call(this, data);
};

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Forest will be deleted from the board, allowing movement onto its
 * space.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Forest.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {

        this.play(this.constructor.noteCycle[this.constructor.noteIndex++]);
        if(this.constructor.noteIndex >= this.constructor.noteCycle.length) {
            this.constructor.noteIndex = 0;
        }
        
        this.board.deleteTile(this.point);
    }
};

//--------------------------------------------------------------------------------

jzt.things.Gem = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 4;
    this.foreground = jzt.colors.BrightMagenta;
};
jzt.things.Gem.prototype = new jzt.things.Thing();
jzt.things.Gem.prototype.constructor = jzt.things.Gem;
jzt.things.Gem.serializationType = 'Gem';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then the game's Gems counter will increase by 1, the health counter will increase
 * by 1, and the score counter will inrease by 10.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Gem.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.remove();
        this.adjustCounter('health', 1);
        this.adjustCounter('gems', 1);
        this.adjustCounter('score', 10);
        this.play('t+c-gec');
    }
    else if(message === 'SHOT') {
        this.remove();
        this.play('t-c');
    }
};

/**
 * Pushes this Gem in a provided direction. If this Gem cannot be pushed,
 * then it will be squished and removed from its owner Board.
 *
 * @param direction A direction in which to push this Gem.
 */
jzt.things.Gem.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.remove();
    }
};

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
    this.foreground = jzt.colors.BrightGreen;
};
jzt.things.InvisibleWall.prototype = new jzt.things.Thing();
jzt.things.InvisibleWall.prototype.constructor = jzt.things.InvisibleWall;
jzt.things.InvisibleWall.serializationType = 'InvisibleWall';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Thing will turn into a Wall Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.InvisibleWall.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        var replacement = new jzt.things.Wall();
        replacement.foreground = this.foreground;
        replacement.background = this.background;
        this.board.replaceTile(this.point, replacement);
        this.play('t--dc');
    }
};

/**
 * Returns a sprite index to be used to represent this InvisibleWall.
 * If we detect that we are in a game editor, 176 will be used. Otherwise, 0.
 *
 * @return A sprite index.
 */
jzt.things.InvisibleWall.prototype.getSpriteIndex = function() {
    return this.board.game.isDebugRendering ? 176 : 0;
};

//--------------------------------------------------------------------------------

/**
 * Key is a Thing representing a collectable key item. One key of a given color
 * may be collected at a time. Keys are used to unlock Door Things.
 *
 * @param board An owner Board for this Key.
 */
jzt.things.Key = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 12;
    this.foreground = jzt.colors.BrightBlue;
};
jzt.things.Key.prototype = new jzt.things.Thing();
jzt.things.Key.prototype.constructor = jzt.things.Key;
jzt.things.Key.serializationType = 'Key';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is 
 * received, then this Key will be collected, if an existing Key of this
 * type has not already been collected.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Key.prototype.sendMessage = function(message) {

    var keyType;
    var keyCode;

    if(message === 'TOUCH') {

        // Get a readable description of this key type
        keyType = jzt.i18n.getMessage('keys.' + this.foreground.code);

        // If the player already has this key type...
        if(this.getCounterValue('key' + this.foreground.code) > 0) {
            this.board.setDisplayMessage(jzt.i18n.getMessage('keys.toomany', keyType));
            this.play('sc-c');
        }

        // If the player does not yet have this key type...
        else {
            this.remove();
            this.adjustCounter('key' + this.foreground.code, 1);
            this.board.setDisplayMessage(jzt.i18n.getMessage('keys.collect', keyType));
            this.play('t+cegcegceg+sc');
        }
        
    }
};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Key.prototype.push = function(direction, pusher) {
    if(!(pusher instanceof jzt.things.Player) && this.move(direction)) {
        this.play('t--f', false, true);
    }
};

//--------------------------------------------------------------------------------

/*
 * LineWall is a Thing representing an immoveable obstacle with line decoration.
 *
 * @param board An owner board for this LineWall.
 */ 
jzt.things.LineWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = undefined;
};
jzt.things.LineWall.prototype = new jzt.things.Thing();
jzt.things.LineWall.prototype.constructor = jzt.things.LineWall;
jzt.things.LineWall.serializationType = 'LineWall';
jzt.things.LineWall.lineMap = {
    '': 249,
    'N': 208,
    'E': 198,
    'S': 210,
    'W': 181,
    'NE': 200,
    'NS': 186,
    'NW': 188,
    'ES': 201,
    'EW': 205,
    'SW': 187,
    'NES': 204,
    'NEW': 202,
    'NSW': 185,
    'ESW': 203,
    'NESW': 206
};

/**
 * Retrieves a sprite index to be used when visually representing this LineWall on a rendered
 * game Board. The sprite index of this LineWall will depend on its surroundings, altering
 * its image when connecting LineWalls are found.
 */
jzt.things.LineWall.prototype.getSpriteIndex = function() {

    if(this.spriteIndex !== undefined && !this.board.game.isDebugRendering) {
        return this.spriteIndex;
    }

    function isLineAdjacent(source, direction) {
        return source.board.getTile(source.point.add(direction)) instanceof jzt.things.LineWall;
    }

    var surroundingPattern = '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.North) ? 'N' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.East) ? 'E' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.South) ? 'S' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.West) ? 'W' : '';

    this.spriteIndex = jzt.things.LineWall.lineMap[surroundingPattern];
    return this.spriteIndex;

};

//--------------------------------------------------------------------------------

/**
 * Lion is an UpdateableThing representing a lion enemy, which moves around
 * with a specified randomness and attacks the player.
 */
jzt.things.Lion = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.intelligence = 3;
    this.spriteIndex = 234;
    this.foreground = jzt.colors.BrightRed;
    this.background = jzt.colors.Black;
    this.speed = 2;
};
jzt.things.Lion.prototype = new jzt.things.UpdateableThing();
jzt.things.Lion.prototype.constructor = jzt.things.Lion;
jzt.things.Lion.serializationType = 'Lion';

/**
 * Serializes this Lion to an Object.
 *
 * @return A serialized Lion
 */
jzt.things.Lion.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    return result;
};

/**
 * Deserializes this Lion from a provided data Object
 * 
 * @param data A data Lion object to be deserialized.
 */
jzt.things.Lion.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = data.intelligence;
};

/**
 * Delivers a provided message to this Thing. If a SHOT message is received,
 * then this Lion will be deleted from the board. If a TOUCH message is 
 * received, then the player will be sent a SHOT message.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Lion.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }

};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Lion.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.play('t+c---c++++c--c');
        this.remove();
    }
};

/**
 * Returns whether or not this Lion should seek the player during its next move.
 * The probability of a true result depends on this Lion's intelligence
 * property.
 *
 * @return true if this Lion should seek the player, false otherwise.
 */
jzt.things.Lion.prototype.seekPlayer = function() {

    var randomValue = Math.floor(Math.random()*10);
    return randomValue <= this.intelligence;

};

/**
 * Updates this Lion for a provided timestamp. This Lion will move itself randomly
 * during updates. If a Player blocks its movement, then the player will be sent
 * a SHOT message and this Lion will be removed from its parent board.
 */
jzt.things.Lion.prototype.doTick = function() {

    var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();

    var thing = this.board.getTile(this.point.add(direction));
    if(thing && thing instanceof jzt.things.Player) {
        thing.sendMessage('SHOT');
        this.remove();
        return;
    }
    this.move(direction, true);
   
};

//--------------------------------------------------------------------------------

/**
 * Passage is a Thing capable of moving a player to its matching passage on a target board.
 * 
 * @param board An owner board for this Passage
 */
jzt.things.Passage = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 240;
    this.foreground = jzt.colors.BrightWhite;
    this.background = jzt.colors.Blue;
    this.targetBoard = undefined;
    this.passageId = 0;
};
jzt.things.Passage.prototype = new jzt.things.Thing();
jzt.things.Passage.prototype.constructor = jzt.things.Passage;
jzt.things.Passage.serializationType = 'Passage';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Passage will move the player to a matching Passage on its target board.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Passage.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('tceg tc#fg# tdf#a td#ga# teg#+c');
        this.board.game.movePlayerToPassage(this.passageId, this.targetBoard);
    }
};

/**
 * Serializes this Passage to an Object.
 *
 * @return A serialized Passage
 */
jzt.things.Passage.prototype.serialize = function() {
    var result = jzt.things.Thing.prototype.serialize.call(this);
    result.passageId = this.passageId;
    result.targetBoard = this.targetBoard;
    return result;
};

/**
 * Deserializes a provided data Object into a Passage.
 *
 * @param data A data object to be deserialized into a Passage.
 */
jzt.things.Passage.prototype.deserialize = function(data) {
    jzt.things.Thing.prototype.deserialize.call(this, data);
    this.targetBoard = data.targetBoard;
    this.passageId = data.passageId;
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
    
    this.name = 'Player';
    this.spriteIndex = 2;
    this.point = new jzt.Point(-1,-1);
    this.foreground = jzt.colors.BrightWhite;
    this.background = jzt.colors.Blue;
    this.nextAllowableMove = 0;

    this.torch = false;
    this.torchStrength = 0;
    this.torchExpiry = 0;
    this.game = undefined;
    this.speed = 1;
    this.nextAction = {
        type: undefined,
        direction: undefined
    };
    this.MOVE_ACTION = 0;
    this.SHOOT_ACTION = 1;
    
    this.TORCH_TTL = 60000; // One Minute
    this.MAX_TORCH_STRENGTH = 4;
    
};
jzt.things.Player.prototype = new jzt.things.UpdateableThing();
jzt.things.Player.prototype.constructor = jzt.things.Player;

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Player.prototype.push = function(direction) {
    this.move(direction);
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

    // First, check if the direction is outside the board
    if(this.board.isOutside(newLocation)) {

        // Find out which direction we're moving to
        direction = this.point.directionTo(newLocation);
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

    return this.board.moveTile(this.point, newLocation);
    
};

/**
 * Shoots a player bullet in a provided Direction.
 *
 * @param A Direction in which to shoot a player bullet.
 */
jzt.things.Player.prototype.shoot = function(direction) {
    if(this.getCounterValue('ammo') > 0) {
        this.adjustCounter('ammo', -1);
        jzt.things.ThingFactory.shoot(this.board, this.point.add(direction), direction, true);
    }
    else {
        this.board.setDisplayMessage(jzt.i18n.getMessage('status.noammo'));
    }
};

/**
 * Performs an update tick of this Player instance, moving or shooting
 * in its direction, as necessary.
 */
jzt.things.Player.prototype.doTick = function() {

    if(this.nextAction.type === this.MOVE_ACTION) {
        this.move(this.nextAction.direction);
    }
    else if(this.nextAction.type === this.SHOOT_ACTION) {
        this.shoot(this.nextAction.direction);
    }

    this.nextAction.type = undefined;

};

/**
 * Schedules a provided event for this Player instance to be performed at its
 * next tick update. 
 *
 * @param pressTime a timestamp at which time a press event occurred
 * @param eventType a type of event to schedule (MOVE_ACTION or SHOOT_ACTION)
 * @param direction A direction in which the movement or shooting should occur
 */
jzt.things.Player.prototype.scheduleEvent = function(pressTime, eventType, direction) {

    var now = Date.now();

    if(now > this.nextAllowableMove) {
        
        if(pressTime + this.game.CYCLE_TICKS *2 < now) {
            this.nextAllowableMove = now + this.game.CYCLE_TICKS;
        }
        else {
            this.nextAllowableMove = now + this.game.CYCLE_TICKS * 2;
        }

        this.nextAction.type = eventType;
        this.nextAction.direction = direction;
    }

};

/**
 * Updates this Player for a single execution cycle. During its update,
 * Player will check for keypresses and move accordingly.
 */
jzt.things.Player.prototype.update = function() {

    var k = this.game.keyboard;

    if(k.isPressed(k.SHIFT)) {

        if(k.isPressed(k.UP)) {
            this.scheduleEvent(k.isPressed(k.UP), this.SHOOT_ACTION, jzt.Direction.North);
        }
        else if(k.isPressed(k.RIGHT)) {
            this.scheduleEvent(k.isPressed(k.RIGHT), this.SHOOT_ACTION, jzt.Direction.East);
        }
        else if(k.isPressed(k.DOWN)) {
            this.scheduleEvent(k.isPressed(k.DOWN), this.SHOOT_ACTION, jzt.Direction.South);
        } 
        else if(k.isPressed(k.LEFT)) {
            this.scheduleEvent(k.isPressed(k.LEFT), this.SHOOT_ACTION, jzt.Direction.West);
        }
        else {
            this.nextAllowableMove = 0;
        }
    }
    else {
        if(k.isPressed(k.UP)) {
            this.scheduleEvent(k.isPressed(k.UP), this.MOVE_ACTION, jzt.Direction.North);
        }
        else if(k.isPressed(k.RIGHT)) {
            this.scheduleEvent(k.isPressed(k.RIGHT), this.MOVE_ACTION, jzt.Direction.East);
        }
        else if(k.isPressed(k.DOWN)) {
            this.scheduleEvent(k.isPressed(k.DOWN), this.MOVE_ACTION, jzt.Direction.South);
        }
        else if(k.isPressed(k.LEFT)) {
            this.scheduleEvent(k.isPressed(k.LEFT), this.MOVE_ACTION, jzt.Direction.West);
        }
        else {
            this.nextAllowableMove = 0;
        }
        if(k.isPressed([k.T])) {
            this.useTorch();
        }
    }

    if(this.torch) {
        this.updateTorch(Date.now());
    }

    jzt.things.UpdateableThing.prototype.update.call(this);
    
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
        return point.x === this.point.x && point.y === this.point.y;
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

/**
 * Delivers a provided message to this Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Player.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t--c+c-c+d#', true);
        this.board.setDisplayMessage(jzt.i18n.getMessage('status.hurt'));
        this.adjustCounter('health', -10);
    }

};

//--------------------------------------------------------------------------------

/**
 * Pusher represents an UpdateableThing that continually moves in a defined direction,
 * pushing obstacles in its path.
 * 
 * @param board An owner board for this Pusher.
 */
jzt.things.Pusher = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.orientation = jzt.Direction.South;
    this.speed = 3;
    this.initializeSprite();
};
jzt.things.Pusher.prototype = new jzt.things.UpdateableThing();
jzt.things.Pusher.prototype.constructor = jzt.things.Pusher;
jzt.things.Pusher.serializationType = 'Pusher';

/**
 * Initializes a spriteIndex for this Pusher based on its defined
 * direction.
 */
jzt.things.Pusher.prototype.initializeSprite = function() {
    if(this.orientation === jzt.Direction.North) {
        this.spriteIndex = 30;
    }
    else if(this.orientation === jzt.Direction.East) {
        this.spriteIndex = 16;
    }
    else if(this.orientation === jzt.Direction.South) {
        this.spriteIndex = 31;
    }
    else if(this.orientation === jzt.Direction.West) {
        this.spriteIndex = 17;
    }
};

/**
 * Serializes this Pusher instance to an object.
 *
 * @return A serialized Pusher
 */
jzt.things.Pusher.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.orientation = jzt.Direction.getName(this.orientation);
    return result;
};

/**
 * Deserializes a provided data object into a Pusher instance.
 * 
 * @param data Serializes Pusher data to be deserialized.
 */
jzt.things.Pusher.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    if(data.orientation) {
        this.orientation = jzt.Direction.fromName(data.orientation);
    }
    this.initializeSprite();
};

/**
 * Performs a tick update of this Pusher.
 */
jzt.things.Pusher.prototype.doTick = function() {
    if(this.move(this.orientation)) {
        this.play('t--f', false, true);
    }
};

//--------------------------------------------------------------------------------

/**
 * Ruffian is an UpdateableThing that attacks in a burst of movement, followed
 * by a wait time, then another burst of movement.
 *
 * @param board An owner board for this Ruffian.
 */
jzt.things.Ruffian = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 5;
    this.foreground = jzt.colors.BrightMagenta;
    this.intelligence = 5;
    this.restingTime = 5;
    this.moving = false;
    this.timeLeft = 0;
    this.speed = 1;
    this.orientation = jzt.Direction.North;
};
jzt.things.Ruffian.prototype = new jzt.things.UpdateableThing();
jzt.things.Ruffian.prototype.constructor = jzt.things.Ruffian;
jzt.things.Ruffian.serializationType = 'Ruffian';

/**
 * Serializes this Ruffian to a data object.
 * 
 * @return A serialized Ruffian.
 */
jzt.things.Ruffian.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.restingTime = this.restingTime;
    return result;
};

/**
 * Deserializes a provided data object, configuring this Ruffian.
 * 
 * @param data A data object to be deserialized into a Ruffian.
 */
jzt.things.Ruffian.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
    this.restingTime = jzt.util.getOption(data, 'restingTime', 5);
};

/** 
 * Pushes this Ruffian instance in a given direction. If this Ruffian
 * cannot be pushed, it will be squished and removed from its owner Board.
 * 
 * @param direction A direction in which to push this Ruffian.
 */
jzt.things.Ruffian.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.remove();
        this.play('t+c---c++++c--c');
    }
};

/**
 * Sends a provided message to this Ruffian.
 *
 * @param message A message to be delivered to this Ruffian.
 */
jzt.things.Ruffian.prototype.sendMessage = function(message) {
    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }
};

/**
 * Returns whether or not this Ruffian should seek the player during its next move.
 * The probability of a true result depends on this Ruffian's intelligence
 * property.
 *
 * @return true if this Ruffian should seek the player, false otherwise.
 */
jzt.things.Ruffian.prototype.seekPlayer = function() {

    var randomValue = Math.floor(Math.random()*10);
    return randomValue <= this.intelligence;

};

/**
 * Performs an update tick for this Ruffian instance.
 */
jzt.things.Ruffian.prototype.doTick = function() {

    // Decrement our remaining time and check if it has elapsed...
    if(--this.timeLeft <= 0) {

        // Toggle our movement status
        this.moving = ! this.moving;

        // If we're about to move, choose a direction and duration
        if(this.moving) {
            this.orientation = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();
            this.timeLeft = Math.floor(Math.random()*10);
        }

        // If we're waiting, choose a wait time
        else {
            this.timeLeft = Math.floor(Math.random()*10) - (10 - this.restingTime);
        }

    }

    // If we're moving...
    if(this.moving) {

        // Determine what's in our way
        var thing = this.board.getTile(this.point.add(this.orientation));

        // If it's the player, attack it
        if(thing && thing instanceof jzt.things.Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }

        // Otherwise just move
        this.move(this.orientation, true);

    }

};

//--------------------------------------------------------------------------------

/**
 * SliderEw is a Thing that is pushable only in the East and West direction.
 *
 * @param board An owner board.
 */
jzt.things.SliderEw = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 29;
};
jzt.things.SliderEw.prototype = new jzt.things.Thing();
jzt.things.SliderEw.prototype.constructor = jzt.things.SliderEw;
jzt.things.SliderEw.serializationType = 'SliderEw';

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.SliderEw.prototype.push = function(direction) {
    if(direction.equals(jzt.Direction.East) || direction.equals(jzt.Direction.West)) {
        if(this.move(direction)) {
            this.play('t--f', false, true);
        }
    }
};

//--------------------------------------------------------------------------------

/**
 * SliderNs is a Thing that is pushable only in the North and South direction.
 *
 * @param board An owner board.
 */
jzt.things.SliderNs = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 18;
};
jzt.things.SliderNs.prototype = new jzt.things.Thing();
jzt.things.SliderNs.prototype.constructor = jzt.things.SliderNs;
jzt.things.SliderNs.serializationType = 'SliderNs';

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.SliderNs.prototype.push = function(direction) {
    if(direction.equals(jzt.Direction.North) || direction.equals(jzt.Direction.South)) {
        if(this.move(direction)) {
            this.play('t--f', false, true);
        }
    }
};

//--------------------------------------------------------------------------------

/**
 * Snake is a touch baddie that intelligently finds the player along a precomputed
 * smart path.
 */
jzt.things.Snake = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 235;
    this.foreground = jzt.colors.Green;
    this.speed = 3;
};
jzt.things.Snake.prototype = new jzt.things.UpdateableThing();
jzt.things.Snake.prototype.constructor = jzt.things.Snake;
jzt.things.Snake.serializationType = 'Snake';

/**
 * Attempts to push this Snake in a provided direction.
 */
jzt.things.Snake.push = function(direction) {
    if(!this.move(direction)) {
        this.remove();
        this.play('t+c---c++++c--c');
    }
};

/**
 * Sends a provided message to this Ruffian.
 *
 * @param message A message to be delivered to this Ruffian.
 */
jzt.things.Snake.prototype.sendMessage = function(message) {
    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }
};

/**
 * Updates this Snake. This Snake will move itself along the board's current
 * smart path directly toward the player, going around walls and obstacles.
 * If there is no direct path to the player (including through bullets and
 * other baddies), then it will rest in place.
 */
jzt.things.Snake.prototype.doTick = function() {

    var direction = this.getSmartDirection();
    var thing;

    if(direction) {

        this.foreground = jzt.colors.BrightGreen;

        thing = this.board.getTile(this.point.add(direction));
        if(thing && thing instanceof jzt.things.Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }
        this.move(direction, true);
        
    }
    else {
        this.foreground = jzt.colors.Green;
    }
    
   
};

//--------------------------------------------------------------------------------

/*
 * SolidWall is a Thing representing an immoveable obstacle.
 *
 * @param board An owner board for this SolidWall.
 */ 
jzt.things.SolidWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 219;
};
jzt.things.SolidWall.prototype = new jzt.things.Thing();
jzt.things.SolidWall.prototype.constructor = jzt.things.SolidWall;
jzt.things.SolidWall.serializationType = 'SolidWall';

//--------------------------------------------------------------------------------

/**
 * Spider is an UpdateableThing that only moves along SpideWebs.
 *
 * @param board An owner Board for this Spider
 */
jzt.things.Spider = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 15;
    this.foreground = jzt.colors.BrightRed;
    this.background = jzt.colors.Black;
    this.intelligence = 5;
    this.speed = 1;
};
jzt.things.Spider.prototype = new jzt.things.UpdateableThing();
jzt.things.Spider.prototype.constructor = jzt.things.Spider;
jzt.things.Spider.serializationType = 'Spider';

/**
 * Serializes this Spider instance into a data object.
 * 
 * @return A serialized Spider
 */
jzt.things.Spider.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    return result;
};

/**
 * Deserializes a data object and configure this Spider instance.
 *
 * @param data A data object to be deserialized into a Spider.
 */
jzt.things.Spider.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = data.intelligence;
};

/**
 * Returns whether or not this Spider instance should seek the player
 * for an attack, or choose a random direction. This decision is weighted
 * based on this Spider's intelligence property.
 *
 * @return true if this Spider should seek the player, false otherwise
 */
jzt.things.Spider.prototype.seekPlayer = function() {

    var randomValue = Math.floor(Math.random()*10);
    return randomValue <= this.intelligence;

};

/**
 * Returns whether or not a position in a provided direction is attackable
 * by this Spider. Attackable positions are defined as spider webs
 * or spots occupied by a player.
 *
 * return true if a provided direction is attackable, false otherwise
 */
jzt.things.Spider.prototype.isAttackable = function(direction) {
    var thing = this.board.getTile(this.point.add(direction));
    return thing && (thing instanceof jzt.things.SpiderWeb || thing instanceof jzt.things.Player);
};

/**
 * Delivers a provided message to this Thing. If a SHOT message is received,
 * then this Lion will be deleted from the board. If a TOUCH message is 
 * received, then the player will be sent a SHOT message.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Spider.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }

};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Spider.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.play('t+c---c++++c--c');
        this.remove();
    }
};

/**
 * Performs an update tick for this Spider instance.
 */
jzt.things.Spider.prototype.doTick = function() {

    // Get a direction based on our intelligence
    var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random(this.getAttackableDirections());

    // If a direction was decided upon...
    if(direction !== undefined) {

        // Determine any obstacle in our way
        var thing = this.board.getTile(this.point.add(direction));

        // If it's a player, attack it
        if(thing && thing instanceof jzt.things.Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }

        // Otherwise, if it's a spider web, move in that direction
        else if(thing && thing instanceof jzt.things.SpiderWeb) {
            this.move(direction, true);
        }

    }
};

//--------------------------------------------------------------------------------

/**
 * SpiderWeb is a Thing that represents a path along which Spiders will travel.
 * 
 * @param board An owner Board for this SpiderWeb.
 */
jzt.things.SpiderWeb = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = undefined;
    this.foreground = jzt.colors.Grey;
    this.background = jzt.colors.Black;
};
jzt.things.SpiderWeb.prototype = new jzt.things.Thing();
jzt.things.SpiderWeb.prototype.constructor = jzt.things.SpiderWeb;
jzt.things.SpiderWeb.serializationType = 'SpiderWeb';
jzt.things.SpiderWeb.lineMap = {
    '': 249,
    'N': 179,
    'E': 196,
    'S': 179,
    'W': 196,
    'NE': 192,
    'NS': 179,
    'NW': 217,
    'ES': 218,
    'EW': 196,
    'SW': 191,
    'NES': 195,
    'NEW': 193,
    'NSW': 180,
    'ESW': 194,
    'NESW': 197
};

/**
 * Retrieves a sprite index to be used as a visual representation of this SpiderWeb.
 * The index returned depends on the surrounings of this SpiderWeb, which will appear
 * to connect with adjacent spider webs.
 */
jzt.things.SpiderWeb.prototype.getSpriteIndex = function() {

    if(this.spriteIndex !== undefined && !this.board.game.isDebugRendering) {
        return this.spriteIndex;
    }

    function isLineAdjacent(source, direction) {
        var tile = source.board.getTile(source.point.add(direction));
        return (tile && (tile instanceof jzt.things.SpiderWeb || (tile.under && (tile.under instanceof jzt.things.SpiderWeb))));
    }

    var surroundingPattern = '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.North) ? 'N' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.East) ? 'E' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.South) ? 'S' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.West) ? 'W' : '';

    this.spriteIndex = jzt.things.SpiderWeb.lineMap[surroundingPattern];
    return this.spriteIndex;

};

/**
 * Returns whether or not this SpiderWeb is surrenderable to another thing.
 *
 * @param sender Another Thing that is requesting this Thing to surrender
 * @return true if this Thing is willing to surrender its position.
 */
jzt.things.SpiderWeb.prototype.isSurrenderable = function() {
    return true;
};

//--------------------------------------------------------------------------------

/**
 * SpinningGun is an UpdateableThing that spins in place and shoots. Its shooting
 * behaviour will depend on its intelligence (which affects when it shoots) and its
 * firing rate (which affects how often it shoots).
 *
 * @param board An owner Board for this SpinningGun.
 */
jzt.things.SpinningGun = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.intelligence = 5;
    this.firingRate = 5;
    this.spriteIndex = 24;
    this.animationIndex = Math.floor(Math.random()*jzt.things.SpinningGun.animationFrames.length-1);
    this.speed = 2;
};
jzt.things.SpinningGun.prototype = new jzt.things.UpdateableThing();
jzt.things.SpinningGun.prototype.constructor = jzt.things.SpinningGun;
jzt.things.SpinningGun.serializationType = 'SpinningGun';
jzt.things.SpinningGun.animationFrames = [24, 26, 25, 27];

/**
 * Serializes this SpinningGun instance into a data object.
 *
 * @return A serialized SpinningGun.
 */
jzt.things.SpinningGun.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
};

/**
 * Deserializes a provided data object to configure this SpinningGun instance.
 *
 * @param data A serialized SpinningGun data object.
 */
jzt.things.SpinningGun.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
    this.firingRate = jzt.util.getOption(data, 'firingRate', 5);
};

/**
 * Performs a single update tick of this SpinningGun instance.
 */
jzt.things.SpinningGun.prototype.doTick = function() {

    var me = this;
    function shoot(random) {
        if(Math.floor(Math.random() * 10) <= me.firingRate) {
            var direction = random ? jzt.Direction.random() : me.getPlayerDirection();
            jzt.things.ThingFactory.shoot(me.board, me.point.add(direction), direction);
        }
    }

    if(++this.animationIndex >= jzt.things.SpinningGun.animationFrames.length) {
        this.animationIndex = 0;
    }
    this.spriteIndex = jzt.things.SpinningGun.animationFrames[this.animationIndex];

    if(Math.floor(Math.random()*9) <= this.intelligence) {
        if(this.isPlayerAligned(2)) {
            shoot();
        }
    }
    else {
        shoot(true);
    }

};

//--------------------------------------------------------------------------------

/**
 * Teleporter is an UpdateableThing capable of teleporting the player
 * to an associated opposite teleporter along the same directional axis.
 *
 * @param board An owner Board for this Teleporter.
 */
 jzt.things.Teleporter = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.orientation = jzt.Direction.East;
    this.animationFrame = 2;
    this.speed = 3;
 };
jzt.things.Teleporter.prototype = new jzt.things.UpdateableThing();
jzt.things.Teleporter.prototype.constructor = jzt.things.Teleporter;
jzt.things.Teleporter.serializationType = 'Teleporter';
jzt.things.Teleporter.animationFrames = {
    'North': [196, 126, 94, 126],
    'East': [179, 41, 62, 41],
    'South': [196, 126, 118, 126],
    'West': [179, 40, 60, 40]
};

/**
 * Serializes this Teleporter instance into a data object.
 *
 * @return A data object representing a serialized Teleporter.
 */
jzt.things.Teleporter.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.orientation = jzt.Direction.getName(this.orientation);
    return result;
};

/**
 * Deserializes a provided data object to configure this Teleporter instance.
 *
 * @param data A data object representing a serialized Teleporter.
 */
jzt.things.Teleporter.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    if(data.orientation) {
        this.orientation = jzt.Direction.fromName(data.orientation);
    }
};

/**
 * Performs a single update tick of this Teleporter instance.
 */
jzt.things.Teleporter.prototype.doTick = function() {
    this.animationFrame++;
    if(this.animationFrame >= jzt.things.Teleporter.animationFrames[jzt.Direction.getName(this.orientation)].length) {
        this.animationFrame = 0;
    }
};

/**
 * Retrieves a sprite index used to visually represent this Teleporter instance on 
 * a rendered game Board.
 *
 * @return a sprite index.
 */
jzt.things.Teleporter.prototype.getSpriteIndex = function() {
    return jzt.things.Teleporter.animationFrames[jzt.Direction.getName(this.orientation)][this.animationFrame];
};

/**
 * Attempts to push this Teleporter instance in a given direction. This teleporter, rather than
 * be pushed, may teleport the item being pushed to another location on its owner Board, based
 * on this Teleporter's orientation, and the location and orientation of other Teleporters on the board.
 * 
 * @param direction A direction in which to push this Teleporter.
 */
jzt.things.Teleporter.prototype.push = function(direction) {

    // We only teleport in our current direction
    if(!this.orientation.equals(direction)) {
        return;
    }

    var currentPoint = this.point.add(jzt.Direction.opposite(this.orientation));
    var destinationPoint = this.point.add(this.orientation);

    var success = this.board.moveTile(currentPoint, destinationPoint);

    // If we couldn't move the tile to the other side of this teleporter...
    if(!success) {

        // While we haven't reached the edge of the board...
        while(!this.board.isOutside(destinationPoint)) {

            // Look at the next tile in the direction
            destinationPoint = destinationPoint.add(this.orientation);

            // If we found a matching teleporter...
            var thing = this.board.getTile(destinationPoint);
            if(thing && thing instanceof jzt.things.Teleporter && thing.orientation === jzt.Direction.opposite(this.orientation)) {

                // Move the tile to the matching teleporter's destination
                if(this.board.moveTile(currentPoint, destinationPoint.add(this.orientation))) {
                    this.play('tc+d-e+f#-g#+a#c+d');
                    return true;
                }
                break;

            }

        }

    }

    else {
        this.play('tc+d-e+f#-g#+a#c+d');
        return true;
    }

};

//--------------------------------------------------------------------------------

/**
 * ThrowingStar is an UpdateableThing representing a projectile that seeks the player
 * continually with a spinning animation until its time to live has expired and it
 * is removed from its owner Board.
 *
 * @param board An owner board for this ThrowingStar.
 */
jzt.things.ThrowingStar = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.speed = 1;
    this.spriteIndex = 179;
    this.animationIndex = Math.floor(Math.random()*jzt.things.ThrowingStar.animationFrames.length-1);
    this.foreground = '*';
    this.timeToLive = 255;
    this.nextMove = Math.floor(Math.random()*2);
};
jzt.things.ThrowingStar.prototype = new jzt.things.UpdateableThing();
jzt.things.ThrowingStar.prototype.constructor = jzt.things.ThrowingStar;
jzt.things.ThrowingStar.serializationType = 'ThrowingStar';
jzt.things.ThrowingStar.animationFrames = [179, 47, 196, 92];

/**
 * Serializes this ThrowingStar into a data object.
 *
 * @return A data object representing a serialized ThrowingStar.
 */
jzt.things.ThrowingStar.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.timeToLive = this.timeToLive;
    return result;
};

/**
 * Deserializes a provided data object to configure this ThrowingStar instance.
 *
 * @param A data object representing a serialized ThrowingStar.
 */
jzt.things.ThrowingStar.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.timeToLove = jzt.util.getOption(data, 'timeToLive', 100);
};

/**
 * Sends a provided message to this ThrowingStar instance.
 *
 * @param message A message to send to this ThrowingStar.
 */
jzt.things.ThrowingStar.prototype.sendMessage = function(message)  {
    if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }
};

/**
 * Performs a single update tick of this ThrowingStar instance.
 */
jzt.things.ThrowingStar.prototype.doTick = function() {

    if(--this.timeToLive <= 0) {
        this.remove();
        return;
    }

    if(++this.animationIndex >= jzt.things.ThrowingStar.animationFrames.length) {
        this.animationIndex = 0;
    }
    this.spriteIndex = jzt.things.ThrowingStar.animationFrames[this.animationIndex];

    if(--this.nextMove <= 0) {

        this.nextMove = 2;

        var direction = this.getPlayerDirection();
        var thing = this.board.getTile(this.point.add(direction));
        if(thing instanceof jzt.things.BreakableWall || thing instanceof jzt.things.Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }
        this.move(this.getPlayerDirection());
    }

};

//--------------------------------------------------------------------------------

/**
 * Tiger is an UpdateableThing representing a creature that moves and shoots
 * bullets at a player.
 *
 * @param board An owner Board for this Tiger.
 */
jzt.things.Tiger = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 227;
    this.foreground = jzt.colors.BrightCyan;
    this.background = jzt.colors.Black;
    this.intelligence = 5;
    this.firingRate = 5;
    this.speed = 2;
};
jzt.things.Tiger.prototype = new jzt.things.UpdateableThing();
jzt.things.Tiger.prototype.constructor = jzt.things.Tiger;
jzt.things.Tiger.serializationType = 'Tiger';

/**
 * Serializes this Tiger into a data object.
 *
 * @return A data object representing a serialized Tiger.
 */
jzt.things.Tiger.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
};

/**
 * Deserializes a provided data object to configure this Tiger instance.
 * 
 * @param data A data object representing a serialized Tiger.
 */
jzt.things.Tiger.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize(this, data);
    this.intelligence = data.intelligence === undefined ? 5 : data.intelligence;
    this.firingRate = data.firingRate === undefined ? 5 : data.firingRate;
};

/**
 * Delivers a provided message to this Thing. If a SHOT message is received,
 * then this Tiger will be deleted from the board. If a TOUCH message is 
 * received, then the player will be sent a SHOT message.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Tiger.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.remove();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.remove();
    }

};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 */
jzt.things.Tiger.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.play('t+c---c++++c--c');
        this.remove();
    }
};

/**
 * Returns whether or not this Tiger should seek the player during its next move.
 * The probability of a true result depends on this Tiger's intelligence
 * property.
 *
 * @return true if this Tiger should seek the player, false otherwise.
 */
jzt.things.Tiger.prototype.seekPlayer = function() {

    var randomValue = Math.floor(Math.random()*10);
    return randomValue <= this.intelligence;

};

/**
 * Returns whether or not this Tiger should shoot the player during its next
 * move. The probability of a true result depends on this Tiger's firing rate
 * property.
 *
 * @return true if this Tiger should shoot the player, false otherwise.
 */
jzt.things.Tiger.prototype.shootPlayer = function() {
    var randomValue = Math.floor(Math.random()*20);
    return randomValue <= this.firingRate;
};

/**
 * Performs a single update tick of this Tiger.
 */
jzt.things.Tiger.prototype.doTick = function() {

    var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();

    var thing = this.board.getTile(this.point.add(direction));
    if(thing && thing instanceof jzt.things.Player) {
        thing.sendMessage('SHOT');
        this.remove();
        return;
    }

    this.move(direction, true);
 
    if(this.shootPlayer()) {
        var playerDirection = this.getPlayerDirection();
        jzt.things.ThingFactory.shoot(this.board, this.point.add(playerDirection), playerDirection);
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
jzt.things.Wall.serializationType = 'Wall';

//--------------------------------------------------------------------------------

/*
 * Water is a Thing representing an obstacle to most Things, except for
 * bullets and other potentially flying Things, which can pass over it.
 */
jzt.things.Water = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 176;
    this.background = jzt.colors.BrightWhite;
    this.foreground = jzt.colors.BrightBlue;
};
jzt.things.Water.prototype = new jzt.things.Thing();
jzt.things.Water.prototype.constructor = jzt.things.Water;
jzt.things.Water.serializationType = 'Water';

/**
 * Returns whether or not this Water is surrenderable to a provided
 * sender. Water will return true if the sender is a bullet or ThrowingStar,
 * but false otherwise.
 */
jzt.things.Water.prototype.isSurrenderable = function(sender) {
    if(sender instanceof jzt.things.Bullet || sender instanceof jzt.things.ThrowingStar) {
        return true;
    }
};

/**
 * Sends a provided message to this Water. If a TOUCH message is received, then 
 * a sound effect is played and a message indicating that players cannot
 * move through water is shown.
 *
 * @param message A message to be delivered to this Water.
 */
jzt.things.Water.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('t+c+c');
        this.board.setDisplayMessage(jzt.i18n.getMessage('obstacles.water'), 1);
    }
};

/*==================================================================================
 * THING FACTORY
 *=================================================================================*/
jzt.things.ThingFactory = jzt.things.ThingFactory || {};

/**
 * Creates a new Thing based on provided serialized data, and assigns it to a given board.
 * 
 * @param data Serialized data to turn into a Thing
 * @param board A board which should own the created Thing.
 */
jzt.things.ThingFactory.deserialize = function(data, board) {

    var thingMap = jzt.things.ThingFactory.getThingMap();

    var ThingFunction = thingMap[data.type];
    if(ThingFunction) {
        var result = new ThingFunction(board);
        result.deserialize(data);
        return result;
    }

};

/**
 * Lazily fetches a map of Things that have declared themself as serializeable .
 *
 * @return A map of Thing functions indexed by their symbols or serialization types.
 */ 
jzt.things.ThingFactory.getThingMap = function() {

    if(jzt.things.ThingFactory.thingMap === undefined) {

        jzt.things.ThingFactory.thingMap = {};

        for(var thing in jzt.things) {
            if(jzt.things.hasOwnProperty(thing)) {

                var thingProperty = jzt.things[thing];

                if(thingProperty.hasOwnProperty('serializationType')) {
                    jzt.things.ThingFactory.thingMap[thingProperty.serializationType] = thingProperty;
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
jzt.things.ThingFactory.shoot = function(board, point, direction, fromPlayer, throwingStar) {
 
    // First, get our destination tile
    var tile = board.getTile(point);

    // Create a bullet
    var bullet = throwingStar ? new jzt.things.ThrowingStar(board) : new jzt.things.Bullet(board);

    bullet.direction = direction;
    if(fromPlayer) {
        bullet.fromPlayer = fromPlayer;
    }

    // If we're allowed to spawn our bullet at our tile position...
    if(tile === undefined || tile.isSurrenderable(bullet)) {
        board.addThing(point, bullet, true);
        if(fromPlayer) {
            board.game.resources.audio.play('t+c-c-c');
        }
    }

    // Otherwise, if the bullet is from the player, or the tile is a Player or ScriptableThing
    else if(fromPlayer ||
        tile instanceof jzt.things.Player || tile instanceof jzt.things.ScriptableThing || tile instanceof jzt.things.BreakableWall) {
        tile.sendMessage('SHOT');
    } 

};