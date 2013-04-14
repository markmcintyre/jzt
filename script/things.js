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
    this.spriteIndex = 63;
    this.board = board;
    this.point = new jzt.Point(0,0);
    this.foreground = jzt.colors.Colors['E'];
    this.background = jzt.colors.Colors['0'];
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
    result.color = (this.background === undefined ? '*' : this.background.code) + (this.foreground == '*' ? '*' : this.foreground.code);
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
        var backgroundCode = data.color.charAt(0);
        var foregroundCode = data.color.charAt(1);

        this.foreground = foregroundCode == '*' ? foregroundCode : jzt.colors.Colors[foregroundCode];
        this.background = backgroundCode == '*' ? undefined : jzt.colors.Colors[backgroundCode];
    }
    else {
        if(!this.foreground) {
            this.foreground = jzt.colors.Colors['E'];
        }
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
jzt.things.Thing.prototype.sendMessage = function(messageName) {};

/**
 * Receives a request to be pushed in a given direction.
 *
 * @param direction A direction in which this Thing is requested to move.
 * @return true if the push resulted in a teleportation, undefined otherwise.
 */
jzt.things.Thing.prototype.push = function(direction) {};

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
jzt.things.Thing.prototype.isSurrenderable = function(sender) {
    return false;
};

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

jzt.things.Thing.prototype.isPlayerAdjacent = function(direction) {
    var tile = this.board.getTile(this.point.add(direction));
    return tile && tile instanceof jzt.things.Player;
};

/**
 * Returns whether or not this Thing is aligned to the player
 * with a certain sensitivity.
 *
 * @return true if player is aligned, false otherwise.
 */
jzt.things.Thing.prototype.isPlayerAligned = function(sensitivity) {
    return this.point.aligned(this.board.player.point, sensitivity);
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
jzt.things.Thing.prototype.delete = function() {
    this.board.deleteTile(this.point);
};

/**
 * Retrieves a sprite index to be used to represent this Thing.
 *
 * @return A sprite index.
 */
jzt.things.Thing.prototype.getSpriteIndex = function() {
    return this.spriteIndex;
}

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
    this.spriteIndex = data.spriteIndex;
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
jzt.things.ScriptableThing.prototype.doTick = function() {

    this.walk();
    this.scriptContext.executeTick();
    
};

/*==================================================================================
 * BUILT-IN THINGS
 *=================================================================================*/
 
jzt.things.Ammo = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 132;
    this.foreground = jzt.colors.Colors['3'];
}
jzt.things.Ammo.prototype = new jzt.things.Thing();
jzt.things.Ammo.prototype.constructor = jzt.things.Ammo;
jzt.things.Ammo.serializationType = 'Ammo';

jzt.things.Ammo.prototype.push = function(direction) {
    this.move(direction);
};

jzt.things.Ammo.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('tcc#d');
        this.adjustCounter('ammo', 5);
        this.delete();
    }
};

//--------------------------------------------------------------------------------

jzt.things.Bear = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 153;
    this.foreground = jzt.colors.Colors['6'];
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
    this.sensitivity = data.sensitivity;
};

jzt.things.Bear.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.play('t+c---c++++c--c');
        this.delete();
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
        this.delete();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
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
            this.delete();
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

jzt.things.BreakableWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 177;
    this.background = jzt.colors.Colors['0'];
    this.foreground = jzt.colors.Colors['B'];
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
        this.delete();
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
    this.foreground = jzt.colors.Colors['F'];
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

 jzt.things.Bullet.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
    }
 };

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
    this.delete();

};

jzt.things.Bullet.prototype.push = function(direction) {
    this.delete();
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
    this.foreground = jzt.colors.Colors['9'];
    this.background = jzt.colors.Colors['0'];
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

    var result = undefined;

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
        this.delete();
        return;
    }

    this.board.moveTile(this.point, this.point.add(direction), true);

    if(this.follower) {
        var direction  = this.follower.point.directionTo(myPlace);
        this.follower.move(direction);
    }

};

/**
 * Requests that this Centipede be pushed in a given direction. Since
 * Centipedes can't be pushed, the Centipede will be deleted instead.
 *
 * @param direction A given direction to push this Centipede.
 */
jzt.things.Centipede.prototype.push = function(direction) {
    this.play('t+c---c++++c--c');
    this.delete();
};

/**
 * Deletes this Centipede from its Board. Any leader and follower 
 * Centipedes will be updates to no longer contain this Centipede
 * as well.
 */
jzt.things.Centipede.prototype.delete = function() {

    if(this.leader) {
        this.leader.follower = undefined;
    }
    if(this.follower) {
        this.follower.leader = undefined;
    }

    jzt.things.UpdateableThing.prototype.delete.call(this);

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
        this.delete();
    }
    if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
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

    };

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
 * Door is a Thing capable of moving a player to its matching door on a target board.
 * 
 * @param board An owner board for this Door
 */
jzt.things.Door = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 240;
    this.foreground = jzt.colors.Colors['F'];
    this.background = jzt.colors.Colors['1'];
    this.targetBoard = undefined;
    this.doorId = 0;
};
jzt.things.Door.prototype = new jzt.things.Thing();
jzt.things.Door.prototype.constructor = jzt.things.Door;
jzt.things.Door.serializationType = 'Door';

/**
 * Delivers a provided message to this Thing. If a TOUCH message is received,
 * then this Door will move the player to a matching Door on its target board.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Door.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('tceg tc#fg# tdf#a td#ga# teg#+c');
        this.board.game.movePlayerToDoor(this.doorId, this.targetBoard);
    }
};

/**
 * Serializes this Door to an Object.
 *
 * @return A serialized Door
 */
jzt.things.Door.prototype.serialize = function() {
    var result = jzt.things.Thing.prototype.serialize.call(this);
    result.doorId = this.doorId;
    result.targetBoard = this.targetBoard;
    return result;
};

/**
 * Deserializes a provided data Object into a Door.
 *
 * @param data A data object to be deserialized into a Door.
 */
jzt.things.Door.prototype.deserialize = function(data) {
    jzt.things.Thing.prototype.deserialize.call(this, data);
    this.targetBoard = data.targetBoard;
    this.doorId = data.doorId;
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
    this.foreground = jzt.colors.Colors['E'];
    this.background = jzt.colors.Colors['0'];
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
jzt.things.FakeWall.prototype.isSurrenderable = function(sender) {
    return true;
};

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
    this.foreground = jzt.colors.Colors['0'];
    this.background = jzt.colors.Colors['2'];
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
    if(message == 'TOUCH') {

        this.play(this.constructor.noteCycle[this.constructor.noteIndex++]);
        if(this.constructor.noteIndex >= this.constructor.noteCycle.length) {
            this.constructor.noteIndex = 0;
        }
        
        this.board.deleteTile(this.point);
    }
}

//--------------------------------------------------------------------------------

jzt.things.Gem = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 4;
    this.foreground = jzt.colors.Colors['D'];
}
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
        this.delete();
        this.adjustCounter('health', 1);
        this.adjustCounter('gems', 1);
        this.adjustCounter('score', 10);
        this.play('t+c-gec');
    }
    else if(message === 'SHOT') {
        this.delete();
        this.play('t-c');
    }
};

jzt.things.Gem.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.delete();
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

/*
 * LineWall is a Thing representing an immoveable obstacle with line decoration.
 *
 * @param board An owner board for this LineWall.
 */ 
jzt.things.LineWall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 178;
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
    'NESW': 206,
};

jzt.things.LineWall.prototype.getSpriteIndex = function() {

    function isLineAdjacent(source, direction) {
        return source.board.getTile(source.point.add(direction)) instanceof jzt.things.LineWall;
    }

    var surroundingPattern = '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.North) ? 'N' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.East) ? 'E' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.South) ? 'S' : '';
    surroundingPattern += isLineAdjacent(this, jzt.Direction.West) ? 'W' : '';

    return jzt.things.LineWall.lineMap[surroundingPattern];

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
    this.foreground = jzt.colors.Colors['C'];
    this.background = jzt.colors.Colors['0'];
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
        this.delete();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
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
        this.delete();
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
        this.delete();
        return;
    }
    this.move(direction, true);
   
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
    this.foreground = jzt.colors.Colors['F'];
    this.background = jzt.colors.Colors['1'];
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
        this.board.setDisplayMessage('You don\'t have any ammo!');
    }
};

jzt.things.Player.prototype.doTick = function() {

    if(this.nextAction.type === this.MOVE_ACTION) {
        this.move(this.nextAction.direction);
    }
    else if(this.nextAction.type === this.SHOOT_ACTION) {
        this.shoot(this.nextAction.direction);
    }

    this.nextAction.type = undefined;

};

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
    var now = Date.now();
    if(k.isPressed(k.SHIFT)) {

        var pressTime = undefined;

        if(pressTime = k.isPressed(k.UP)) {
            this.scheduleEvent(pressTime, this.SHOOT_ACTION, jzt.Direction.North);
        }
        else if(pressTime = k.isPressed(k.RIGHT)) {
            this.scheduleEvent(pressTime, this.SHOOT_ACTION, jzt.Direction.East);
        }
        else if(pressTime = k.isPressed(k.DOWN)) {
            this.scheduleEvent(pressTime, this.SHOOT_ACTION, jzt.Direction.South);
        } 
        else if(pressTime = k.isPressed(k.LEFT)) {
            this.scheduleEvent(pressTime, this.SHOOT_ACTION, jzt.Direction.West);
        }
        else {
            this.nextAllowableMove = 0;
        }
    }
    else {
        if(pressTime = k.isPressed(k.UP)) {
            this.scheduleEvent(pressTime, this.MOVE_ACTION, jzt.Direction.North);
        }
        else if(pressTime = k.isPressed(k.RIGHT)) {
            this.scheduleEvent(pressTime, this.MOVE_ACTION, jzt.Direction.East);
        }
        else if(pressTime = k.isPressed(k.DOWN)) {
            this.scheduleEvent(pressTime, this.MOVE_ACTION, jzt.Direction.South);
        }
        else if(pressTime = k.isPressed(k.LEFT)) {
            this.scheduleEvent(pressTime, this.MOVE_ACTION, jzt.Direction.West);
        }
        else {
            this.nextAllowableMove = 0;
        }
        if(k.isPressed([k.T])) this.useTorch();
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

/**
 * Delivers a provided message to this Thing.
 *
 * @param messageName a name of a message to deliver.
 */
jzt.things.Player.prototype.sendMessage = function(message) {

    if(message === 'SHOT') {
        this.play('t--c+c-c+d#', true);
        this.board.setDisplayMessage('Ouch!');
        this.adjustCounter('health', -10);
    }

};

jzt.things.Player.prototype.updateOnReverse = function() {
    return true;
}

//--------------------------------------------------------------------------------

jzt.things.Pusher = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.orientation = jzt.Direction.South;
    this.speed = 3;
    this.initializeSprite();
};
jzt.things.Pusher.prototype = new jzt.things.UpdateableThing();
jzt.things.Pusher.prototype.constructor = jzt.things.Pusher;
jzt.things.Pusher.serializationType = 'Pusher';

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

jzt.things.Pusher.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.orientation = jzt.Direction.getName(this.orientation);
    return result;
};

jzt.things.Pusher.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    if(data.orientation) {
        this.orientation = jzt.Direction.fromName(data.orientation);
    }
    this.initializeSprite();
};

jzt.things.Pusher.prototype.doTick = function() {
    if(this.move(this.orientation)) {
        this.play('t--f', false, true);
    }
};

//--------------------------------------------------------------------------------
jzt.things.Ruffian = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 5;
    this.foreground = jzt.colors.Colors['D'];
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

jzt.things.Ruffian.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.restingTime = this.restingTime;
    return result;
};

jzt.things.Ruffian.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
    this.restingTime = jzt.util.getOption(data, 'restingTime', 5);
};

jzt.things.Ruffian.prototype.push = function(direction) {
    if(!this.move(direction)) {
        this.delete();
        this.play('t+c---c++++c--c');
    }
};

jzt.things.Ruffian.prototype.sendMessage = function(message) {
    if(message === 'SHOT') {
        this.play('t+c---c++++c--c', true);
        this.delete();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
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

jzt.things.Ruffian.prototype.doTick = function() {

    if(--this.timeLeft <= 0) {

        this.moving = ! this.moving;

        if(this.moving) {
            this.orientation = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();
            this.timeLeft = Math.floor(Math.random()*10);
        }
        else {
            this.timeLeft = Math.floor(Math.random()*10) - (10 - this.restingTime);
        }

    }

    if(this.moving) {

        var thing = this.board.getTile(this.point.add(this.orientation));
        if(thing && thing instanceof jzt.things.Player) {
            thing.sendMessage('SHOT');
            this.delete();
            return;
        }

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
}
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
}
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

jzt.things.SpinningGun.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
};

jzt.things.SpinningGun.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
    this.firingRate = jzt.util.getOption(data, 'firingRate', 5);
};

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

jzt.things.Teleporter.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.orientation = jzt.Direction.getName(this.orientation);
    return result;
};

jzt.things.Teleporter.prototype.deserialize = function(data) {
    jzt.things.UpdateableThing.prototype.deserialize.call(this, data);
    if(data.orientation) {
        this.orientation = jzt.Direction.fromName(data.orientation);
    }
};

jzt.things.Teleporter.prototype.doTick = function() {
    this.animationFrame++;
    if(this.animationFrame >= jzt.things.Teleporter.animationFrames[jzt.Direction.getName(this.orientation)].length) {
        this.animationFrame = 0;
    }
};

jzt.things.Teleporter.prototype.getSpriteIndex = function() {
    return jzt.things.Teleporter.animationFrames[jzt.Direction.getName(this.orientation)][this.animationFrame];
};

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

jzt.things.Tiger = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.spriteIndex = 227;
    this.foreground = jzt.colors.Colors['B'];
    this.background = jzt.colors.Colors['0'];
    this.intelligence = 5;
    this.firingRate = 5;
    this.speed = 2;
}
jzt.things.Tiger.prototype = new jzt.things.UpdateableThing();
jzt.things.Tiger.prototype.constructor = jzt.things.Tiger;
jzt.things.Tiger.serializationType = 'Tiger';

jzt.things.Tiger.prototype.serialize = function() {
    var result = jzt.things.UpdateableThing.prototype.serialize.call(this);
    result.intelligence = this.intelligence;
    result.firingRate = this.firingRate;
    return result;
};

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
        this.delete();
    }
    else if(message === 'TOUCH') {
        this.board.player.sendMessage('SHOT');
        this.delete();
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
        this.delete();
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

jzt.things.Tiger.prototype.shootPlayer = function() {
    var randomValue = Math.floor(Math.random()*20);
    return randomValue <= this.firingRate;
};

jzt.things.Tiger.prototype.doTick = function() {

    var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();

    var thing = this.board.getTile(this.point.add(direction));
    if(thing && thing instanceof jzt.things.Player) {
        thing.sendMessage('SHOT');
        this.delete();
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
    this.background = jzt.colors.Colors['F'];
    this.foreground = jzt.colors.Colors['9'];
};
jzt.things.Water.prototype = new jzt.things.Thing();
jzt.things.Water.prototype.constructor = jzt.things.Water;
jzt.things.Water.serializationType = 'Water';

jzt.things.Water.prototype.isSurrenderable = function(sender) {
    if(sender instanceof jzt.things.Bullet) {
        return true;
    }
};

jzt.things.Water.prototype.sendMessage = function(message) {
    if(message === 'TOUCH') {
        this.play('t+c+c');
        this.board.setDisplayMessage('Your way is blocked by water.');
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

    var thingFunction = thingMap[data.type];
    if(thingFunction) {
        var result = new thingFunction(board);
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

        for(thing in jzt.things) {
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
jzt.things.ThingFactory.shoot = function(board, point, direction, fromPlayer) {

    // First, get our destination tile
    var tile = board.getTile(point);

    // Create a bullet
    var bullet = new jzt.things.Bullet(board);
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