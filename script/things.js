/**
 * JZT Things
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt = jzt || {};
jzt.things = (function(my){
    
    'use strict';
    
    var ThingFactory = {};
    
    /*
     * Thing represents a single 'thing' that can be associated with a Board. This can
     * range from players, to walls, to Scriptables. Each Thing has a location,
     * sprite index, and foreground and background color. Each Thing should also
     * be able to handle its own serialization and deserialization. Things may also
     * receive messages and take actions accordingly, either altering its own state
     * or making requests to its owner Board.
     *
     * @param board A Board instance to "own" this Thing.
     */
    function Thing(board) {
        this.spriteIndex = 63;
        this.board = board;
        this.point = new jzt.Point(0,0);
        this.foreground = jzt.colors.Yellow;
        this.background = undefined;
        this.x = 0;
        this.y = 0;
    }

    /**
     * Serializes this Thing to an object and returns it.
     *
     * @return A serialized version of this Thing.
     */
    Thing.prototype.serialize = function() {
        var result = {};
        result.type = this.constructor.name;
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
    Thing.prototype.deserialize = function(data) {

        if(data.color) {
            this.foreground = jzt.colors.deserializeForeground(data.color);
            this.background = jzt.colors.deserializeBackground(data.color);
        }
        else {
            if(!this.foreground) {
                this.foreground = jzt.colors.Yellow;
            }
            this.background = undefined;
        }

        if(data.under) {
            this.under = ThingFactory.deserialize(data.under, this.board);
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
    Thing.prototype.play = function(notation, uninterruptable, defer) {

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
    Thing.prototype.adjustCounter = function(counter, value) {
        this.board.game.adjustCounter(counter, value);
    };

    Thing.prototype.setCounterValue = function(counter, value) {
        this.board.game.setCounterValue(counter, value);
    };

    Thing.prototype.getCounterValue = function(counter) {
        return this.board.game.getCounterValue(counter);
    };

    /**
     * Delivers a provided message to this Thing.
     *
     * @param messageName a name of a message to deliver.
     */
    Thing.prototype.sendMessage = function() {};

    /**
     * Receives a request to be pushed in a given direction.
     *
     * @param direction A direction in which this Thing is requested to move.
     * @param pusher A Thing that is requesting the push.
     * @return true if the push resulted in a teleportation, undefined otherwise.
     */
    Thing.prototype.push = function() {};

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
    Thing.prototype.isSurrenderable = function() {
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
    Thing.prototype.isBlocked = function(direction) {

        var newPoint = this.point.add(direction);

        if(this.board.isFree(newPoint)) {
            return false;
        }

        if(this.board.isOutside(newPoint)) {
            return true;
        }

        var obstacle = this.board.getTile(newPoint);
        if(obstacle) {
            return !obstacle.isSurrenderable(this);
        }

    };

    /**
     * Retrieves whether or not this Thing has a line of sight to a Player within a provided
     * distance. A line of sight may be broken by any Thing, in which case this function
     * returns false.
     *
     * @param distance a number of tiles determining the visibility distance
     * @return true if there is an uninterrupted straight line between this thing and a player.
     */
    Thing.prototype.isPlayerVisible = function(distance) {

        var line = jzt.util.generateLineData(this.point, this.board.player.point);
        var me = this;
        var currentPoint = this.point;
        var result = true;

        function isBlocked(point) {
            var tile = me.board.getTile(point);
            return tile && (tile !== me) && !(tile instanceof Player);
        }

        if(line.points.length > distance) {
            return false;
        }

        line.forEach(function(point) {

            // If we're doing a diagnoal step, test both paths to that step
            if(currentPoint.x !== point.x && currentPoint.y !== point.y) {

                if( isBlocked(new jzt.Point(currentPoint.x, point.y)) || isBlocked(new jzt.Point(point.x, currentPoint.y))) {
                    result = false;
                }

            }

            if(isBlocked(point)) {
                result = false;
            }

            currentPoint = point;

        });

        return result;

    };

    /**
     * Retrieves whether or not this Thing instance is directly adjacent to a Player Thing in
     * a provided direction.
     *
     * @param direction A direction in which to test if this Thing is player adjacent
     * @return true if a Player thing is directly adjacent in a given direction, false otherwise.
     */
    Thing.prototype.isPlayerAdjacent = function(direction) {
        var tile = this.board.getTile(this.point.add(direction));
        return tile && tile instanceof Player;
    };

    /**
     * Returns whether or not this Thing is aligned to the player
     * with a certain spread.
     *
     * @return true if player is aligned, false otherwise.
     */
    Thing.prototype.isPlayerAligned = function(spread, direction) {
        return this.point.aligned(this.board.player.point, spread, direction);
    };

    /**
     * Moves this Thing in a provided Direction and returns its success.
     * 
     * @param direction A Direction in which to move this Thing.
     * @param weak If true, we will move weakly.
     * @return true if the move was successful, false otherwise.
     */
    Thing.prototype.move = function(direction, weak) {
        return this.board.moveTile(this.point, this.point.add(direction), weak);
    };

    /**
     * Removes this Thing from its owner board.
     */
    Thing.prototype.remove = function() {
        this.board.deleteTile(this.point);
    };

    /**
     * Retrieves a sprite index to be used to represent this Thing.
     *
     * @return A sprite index.
     */
    Thing.prototype.getSpriteIndex = function() {
        return this.spriteIndex;
    };

    /**
     * Retrieves a Thing that is directly adjacent to this Thing in a given direction.
     *
     * @param direction A direction to retrieve another Thing.
     * @return a Thing, or undefined if no such Thing exists.
     */
    Thing.prototype.getAdjacentThing = function(direction) {
        return this.board.getTile(this.point.add(direction));
    };

    /**
     * Retrieves whether or not this Thing has the same type and color as provided.
     *
     * @param type a case-insensitive serializable type name
     * @param color An optional color
     * @return true if this Thing has a matching serializable type and color (if provided) 
     */
    Thing.prototype.equals = function(template) {

        var type = template.type.toUpperCase();
        var color = template.color ? jzt.colors.deserializeForeground(template.color) : undefined;

        if(this.constructor.name.toUpperCase() === type) {

            return color === undefined ? true : color === this.foreground;

        }

        return false;

    };

    /**
     * Displays a short, localizable message exactly once.
     *
     * @param messageKey A localization key for a message to display.
     */
    Thing.prototype.oneTimeMessage = function(messageKey) {

        this.board.game.oneTimeMessage(messageKey);

    };

    /**
     * Returns a new Thing instance with the same properties as this Thing.
     * This clone function works by serializing the current Thing and deserializing
     * the data as a new Thing, and should work for any serializable Thing.
     *
     * @return A clone of this Thing. 
     */
    Thing.prototype.clone = function() {
        var clone = this.serialize();
        return ThingFactory.deserialize(clone, this.board);
    };

    // ------------------------------------------------------------------------------

    /*
     * Updateable Thing is a Thing that can be updated during an execution cycle 
     * of its owner board. UpdateableThings may take different actions during updates.
     * 
     * @param board A Board to which this UpdateableThing belongs.
     */
    function UpdateableThing(board) {
        Thing.call(this, board);
        this.cycleCount = 0;
        this.speed = 3;
    }
    UpdateableThing.prototype = new Thing();

    /**
     * Serializes this Thing to an object and returns it.
     *
     * @return A serialized version of this Thing.
     */
    UpdateableThing.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this) || {};
        result.speed = this.speed;
        return result;
    };

    /**
     * Deserializes a given data object and update's this Thing's state to
     * that data.
     *
     * @param data An object to be deserialized into this Thing.
     */
    UpdateableThing.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
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
    UpdateableThing.prototype.getPlayerDirection = function(axis) {
        return this.point.directionTo(this.board.player.point, axis);
    };

    UpdateableThing.prototype.getSmartDirection = function() {
        return this.board.getSmartDirection(this.point);
    };

    UpdateableThing.prototype.influenceSmartPath = function() {};

    /**
     * Returns whether or not a position in a provided direction is attackable
     * by this UpdateableThing. Attackable positions are defined as free spots
     * or spots occupied by a player.
     *
     * return true if a provided direction is attackable, false otherwise
     */
    UpdateableThing.prototype.isAttackable = function(direction) {
        return !this.isBlocked(direction) || this.isPlayerAdjacent(direction);
    };

    /**
     * Retrieves an Array of Directions in which this UpdateableThing can attack.
     * An attackable direction is defined as any direction that is free, or is
     * occupied by the player.
     * 
     * @return An array of Directions
     */
    UpdateableThing.prototype.getAttackableDirections = function() {

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
    UpdateableThing.prototype.getFreeDirections = function() {

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
    UpdateableThing.prototype.getBlockedDirections = function() {

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
    UpdateableThing.prototype.update = function() {

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

    UpdateableThing.prototype.updateOnReverse = function() {
        return false;
    };

    /**
     * Updates this UpdateableThing on its tick update cycle.
     */
    UpdateableThing.prototype.doTick = function() {};

    // ------------------------------------------------------------------------------

    /*
     * Scriptable Thing is an UpdateableThing capable of executing a Script instance
     * for its update cycles. This Script will be updated in a ScriptContext unique
     * to this Scriptable.
     *
     * @param board An owner board for this Scriptable.
     */
    function Scriptable(board) {
        UpdateableThing.call(this, board);
        this.name = 'UnknownScriptable';
        this.scriptContext = undefined;
        this.messageQueue = [];
        this.walkDirection = undefined;
        this.locked = false;
        this.orientation = undefined;
        this.spriteIndex = 1;
        this.torchRadius = undefined;
        this.pushable = false;
    }
    Scriptable.prototype = new UpdateableThing();
    Scriptable.prototype.constructor = Scriptable;

    /**
     * Serializes this Thing to an object and returns it.
     *
     * @return A serialized version of this Thing.
     */
    Scriptable.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this) || {};

        result.name = this.name;
        result.spriteIndex = this.spriteIndex;
        result.script = this.scriptName;

        jzt.util.storeOption(result, 'pushable', this.pushable, false);

        if(this.torchRadius > 0) {
            result.torchRadius = this.torchRadius;
        }

        if(this.scriptContext) {

            if(this.scriptContext.commandIndex !== 0) {
                result.scriptContext = this.scriptContext.serialize();
            }
            if(this.messageQueue.length > 0) {
                result.messageQueue = this.messageQueue.slice(0);
            }
            jzt.util.storeOption(result, 'walkDirection', jzt.Direction.getName(this.walkDirection));
            jzt.util.storeOption(result, 'locked', this.locked, false);
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
    Scriptable.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.name = jzt.util.getOption(data, 'name', 'UnknownScriptable');
        this.spriteIndex = jzt.util.getOption(data, 'spriteIndex', 1);
        this.setTorchRadius(jzt.util.getOption(data, 'torchRadius', 0));
        this.pushable = jzt.util.getOption(data, 'pushable', false);
        this.locked = data.locked;
        if(data.walkDirection) {
            this.walkDirection = jzt.Direction.fromName(data.walkDirection);
        }
        if(data.orientation) {
            this.orientation = jzt.Direction.fromName(data.orientation);
        }
        this.scriptName = data.script;
        var script = this.board.getScript(this.scriptName);
        if(script) {
            this.scriptContext = new jzt.jztscript.JztScriptContext(script, this);
            if(data.scriptContext) {
                this.scriptContext.deserialize(data.scriptContext);
            }

            if(data.messageQueue instanceof Array && data.messageQueue.length > 0) {
                this.messageQueue = data.messageQueue.slice(0);
            }

        }
    };

    /**
     * Delivers a message to this Scriptable. This message will be passed 
     * on to its Script during its next execution cycle if this ScriptableInstance
     * is not in a locked state.
     *
     * @param message A message to be delivered to this Scriptable.
     */
    Scriptable.prototype.sendMessage = function(message) {

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
    Scriptable.prototype.move = function(direction) {
        this.orientation = direction;
        return UpdateableThing.prototype.move.call(this, direction);
    };

    /**
     * Pushes this Scriptable in a provided Direction.
     */
    Scriptable.prototype.push = function(direction) {
        if(this.pushable) {
            this.move(direction);
        }
    };

    /**
     * Makes this Scriptable walk in its current walking direction.
     * Scriptables can walk while executing other instructions. If this
     * Scriptable walks into an obsticle and cannot continue walking,
     * it will receive a 'THUD' message and halt its walking direction.
     */
    Scriptable.prototype.walk = function() {
        if(this.walkDirection) {

            if(!this.move(this.walkDirection)) {
                this.sendMessage('THUD');
            }

        }
    };

    /**
     * Updates this Scriptable for a single execution cycle, including its
     * associated Script.
     */
    Scriptable.prototype.doTick = function() {

        this.walk();
        if(this.scriptContext) {
            this.scriptContext.executeTick();
        }

    };

    Scriptable.prototype.setTorchRadius = function(radius) {
        this.torchRadius = radius;
    };

    Scriptable.prototype.getTorch = function() {
        if(this.torchRadius > 0) {
            return jzt.util.generateCircleData(this.point, this.torchRadius);
        }
    };

    /*==================================================================================
     * BUILT-IN THINGS
     *=================================================================================*/

     /**
      * ActiveBomb is an UpdateableThing that counts down from 9 to 0 before exploding.
      *
      * @param board A board to own this ActiveBomb
      */
    function ActiveBomb(board) {
        UpdateableThing.call(this, board);
        this.timeToLive = 9;
        this.speed = 6;
        this.spriteIndex = 57;
        this.radius = 4;
        this.conveyable = true;
    }
    ActiveBomb.prototype = new UpdateableThing();
    ActiveBomb.prototype.constructor = ActiveBomb;

    ActiveBomb.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.timeToLive = this.timeToLive;
        result.radius = this.radius;
        return result;
    };

    ActiveBomb.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.timeToLive = jzt.util.getOption(data, 'timeToLive', 9);
        this.radius = jzt.util.getOption(data, 'radius', 4);
    };

    ActiveBomb.prototype.push = function(direction) {
        this.move(direction);
    };

    ActiveBomb.prototype.getSpriteIndex = function() {
        return 57 - (9 - this.timeToLive);
    };

    ActiveBomb.prototype.doTick = function() {

        var explosion;
        this.play(this.timeToLive % 2 ? '8' : '5');

        if(--this.timeToLive < 0) {
            explosion = new Explosion(this.board);
            explosion.radius = this.radius;
            this.board.replaceTile(this.point, explosion);
        }

    };


    //--------------------------------------------------------------------------------


    /**
     * Ammo is a Thing that acts as an item capable of increasing a Game's 'ammo' counter
     * by five units when collected.
     *
     * @param board A board to own this Ammo instance
     */
    function Ammo(board) {
        Thing.call(this, board);
        this.spriteIndex = 132;
        this.background = undefined;
        this.foreground = jzt.colors.Cyan;
    }
    Ammo.prototype = new Thing();
    Ammo.prototype.constructor = Ammo;

    Ammo.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    Ammo.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.Cyan;
    };

    /**
     * Pushes this Ammo in a provided direction on its owner Board.
     * 
     * @param direction A direction in which to push this Ammo
     */
    Ammo.prototype.push = function(direction) {
        this.move(direction);
    };

    /**
     * Sends a provided message to this Ammo instance. If a TOUCH message is received
     * then this Ammo instance will be removed and increase the Game's 'ammo' counter
     * by five units.
     */
    Ammo.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.oneTimeMessage('status.ammo');
            this.play('tcc#d');
            this.adjustCounter('AMMO', 5);
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
    function Bear(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 153;
        this.background = undefined;
        this.foreground = jzt.colors.Brown;
        this.sensitivity = 9;
        this.speed = 3;
        this.conveyable = true;
    }
    Bear.prototype = new UpdateableThing();
    Bear.prototype.constructor = Bear;

    /**
     * Serializes this Bear to an Object.
     *
     * @return A serialized Bear
     */
    Bear.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.sensitivity = this.sensitivity;
        return result;
    };

    /**
     * Deserializes this Bear from a provided data Object
     * 
     * @param data A data Bear object to be deserialized.
     */
    Bear.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.Brown;
        this.sensitivity = jzt.util.getOption(data, 'sensitivity', 9);
    };

    /**
     * Pushes this Bear in a given direction. If this Bear cannot be pushed,
     * it will be squished and removed from its owner Board.
     * 
     * @param direction A direction in which to push this Bear.
     */
    Bear.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!this.move(direction)) {
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
    Bear.prototype.sendMessage = function(message) {

        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Bear.prototype.doTick = function() {

        if(this.isPlayerAligned(10-this.sensitivity)) {

            // X-Axis always gets priority
            var direction = this.getPlayerDirection('x');

            // If we are already aligned with the player...
            if(direction === undefined) {
                direction = this.getPlayerDirection('y');
            }

            var thing = this.board.getTile(this.point.add(direction));
            if(thing && (thing instanceof BreakableWall || thing instanceof Player)) {
                thing.sendMessage('SHOT');
                this.remove();
                return;
            }

            // Don't attempt to move in the direction of a river
            else if(thing && thing instanceof River && thing.direction === jzt.Direction.opposite(direction)) {
                return;
            }

            this.move(direction, true);
        }

    };

    //--------------------------------------------------------------------------------

    function Blinker(board) {
        UpdateableThing.call(this, board);
        this.direction = jzt.Direction.North;
        this.period = 3;
        this.delay = 0;
        this.currentTick = 0;
        this.spriteIndex = 206;
        this.background = undefined;
        this.foreground = jzt.colors.Yellow;
        this.blinkState = false;
    }
    Blinker.prototype = new UpdateableThing();
    Blinker.prototype.constructor = Blinker;

    Blinker.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.period = this.period;
        result.delay = this.delay;
        result.direction = jzt.Direction.getShortName(this.direction);
        return result;
    };

    Blinker.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.cycleCount = 0;
        this.period = data.period;
        this.delay = data.delay;
        this.currentTick = this.period - this.delay - 1;
        this.direction = jzt.Direction.fromName(data.direction);
    };

    Blinker.prototype.doTick = function() {

        if(++this.currentTick >= this.period) {
            this.currentTick = 0;
            this.blinkState = !this.blinkState;
            this.blink();
        }

    };

    Blinker.prototype.blink = function() {

        var point = this.point;
        var tile;
        var moved;

        while(true) {

            // Increment our point of interest
            point = point.add(this.direction);

            // If it's off the board, stop immediately
            if(this.board.isOutside(point)) {
                break;
            }

            // Grab our tile of interest
            tile = this.board.getTile(point);


            // If we actually found a tile...
            if(tile) {

                // If we're not blinking, and it's a blinkwall, then remove it
                if(!this.blinkState && tile instanceof BlinkWall) {
                    tile.remove();
                }

                // If it's the player...
                else if(tile instanceof Player) {

                    // Harm the player
                    tile.sendMessage('SHOT');

                    // Shove the player out of the way if possible
                    if(!tile.isBlocked(jzt.Direction.clockwise(this.direction))) {
                        moved = tile.move(jzt.Direction.clockwise(this.direction));
                    }
                    else if(!tile.isBlocked(jzt.Direction.counterClockwise(this.direction))) {
                        moved = tile.move(jzt.Direction.counterClockwise(this.direction));
                    }

                    // If we weren't able to move our player
                    if(!moved) {
                        break;
                    }

                }

                // If it was any other tile...
                else {
                    break;
                }

            }

            // If we are blinking...
            if(this.blinkState) {

                // Add a blinkwall
                this.board.addThing(point, this.createBlinkWall());

            }

        }

    };

    Blinker.prototype.createBlinkWall = function() {
        var blinkWall = new BlinkWall(this.board);
        blinkWall.horizontal = (this.direction === jzt.Direction.North || this.direction === jzt.Direction.South) ? false : true;
        blinkWall.foreground = this.foreground;
        return blinkWall;
    };

    //--------------------------------------------------------------------------------

    /**
     * BlinkWall is a special type of wall generated by Blinkers.
     */
    function BlinkWall(board) {
        Thing.call(this, board);
        this.horizontal = false;
        this.background = undefined;
        this.foreground = jzt.colors.Yellow;
    }
    BlinkWall.prototype = new Thing();
    BlinkWall.prototype.constructor = BlinkWall;

    BlinkWall.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        if(this.horizontal) {
            result.horizontal = this.horizontal;
        }
        return result;
    };

    BlinkWall.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.horizontal = jzt.util.getOption(data, 'horizontal', false);
    };

    BlinkWall.prototype.getSpriteIndex = function() {
        return this.horizontal ? 205 : 186;
    };

    //--------------------------------------------------------------------------------

    /**
     * A Bomb is a Thing that becomes an ActiveBomb when touched.
     *
     * @param board An owner board for this Bomb
     */
    function Bomb(board) {
        Thing.call(this, board);
        this.radius = 4;
        this.spriteIndex = 11;
        this.conveyable = true;
    }
    Bomb.prototype = new Thing();
    Bomb.prototype.constructor = Bomb;

    Bomb.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.radius = jzt.util.getOption(data, 'radius', 4);
    };

    Bomb.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        result.radius = this.radius;
        return result;
    };

    Bomb.prototype.push = function(direction) {
        this.move(direction);
    };

    Bomb.prototype.sendMessage = function(message) {
        var bomb;
        if(message === 'TOUCH') {
            this.play('tcf+cf+c');
            bomb = new ActiveBomb(this.board);
            bomb.radius = this.radius;
            bomb.foreground = this.foreground;
            bomb.background = this.background;
            this.board.replaceTile(this.point, bomb);
        }
    };

    //--------------------------------------------------------------------------------

    /*
     * A Boulder is a Thing that is pushable in all directions.
     * 
     * @param board An owner board for this Boulder.
     */
    function Boulder(board) {
        Thing.call(this, board);
        this.conveyable = true;
        this.spriteIndex = 254;
    }
    Boulder.prototype = new Thing();
    Boulder.prototype.constructor = Boulder;

    /**
     * Receives a request to be pushed in a given direction.
     *
     * @param direction A direction in which this Thing is requested to move.
     */
    Boulder.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(this.move(direction)) {
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
    function BreakableWall(board) {
        Thing.call(this, board);
        this.spriteIndex = 177;
        this.background = jzt.colors.Black;
        this.foreground = jzt.colors.BrightCyan;
    }
    BreakableWall.prototype = new Thing();
    BreakableWall.prototype.constructor = BreakableWall;

    /**
     * Sends a provided message to this BreakableWall. If a SHOT message
     * is received, then this BreakableWall will vanish.
     * 
     * @param message A message to receive.
     */
    BreakableWall.prototype.sendMessage = function(message) {
        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t-c');
            this.remove();
        }
        else if(message === 'TOUCH') {
            this.oneTimeMessage('status.breakable');
        }
    };

    //--------------------------------------------------------------------------------

    /**
     * A Bullet is an UpdateableThing that represents a projectile.
     *
     * @param board An owner board for this Bullet
     */
    function Bullet(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 248;
        this.foreground = jzt.colors.BrightWhite;
        this.background = undefined;
        this.direction = jzt.Direction.North;
        this.speed = 1;
    }
    Bullet.prototype = new UpdateableThing();
    Bullet.prototype.constructor = Bullet;

    /**
     * Serializes this Thing to an object and returns it.
     *
     * @return A serialized version of this Thing.
     */
    Bullet.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this) || {};
        delete result.color;
        result.direction = jzt.Direction.getShortName(this.direction);
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
    Bullet.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightWhite;
        this.direction = jzt.Direction.fromName(data.direction);
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
    Bullet.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.board.player.sendMessage('SHOT');
            this.remove();
        }
    };

    /**
     * Retrieves whether or not this Bullet instance wishes to be updated on its owner Board's
     * reverse update cycle.
     */
    Bullet.prototype.updateOnReverse = function() {
        return this.direction === jzt.Direction.South || this.direction === jzt.Direction.East;
    };

    Bullet.prototype.influenceSmartPath = function() {

        var point;
        var index;

        // If we are a player bullet...
        if(this.fromPlayer) {

            point = this.point;

            // Weight the ten spaces in front of our bullet as aversion points
            for(index = 0; index < 10; ++index) {
                point = point.add(this.direction);
                this.board.adjustSmartPathWeight(point, 100 - (index * 10));
            }

        }

    };

    /**
     * Updates this bullet, moving it one tile in its associated
     * direction.
     */
    Bullet.prototype.doTick = function() {

        // If we are unable to move, attack our obstacle
        if(!this.move(this.direction, true)) {
            this.attack();
            this.react();
        }

    };

    /**
     * Attempts to Attack a Thing in this Bullet's path. If a player, Scriptable, or BreakableWall is in 
     * its path, that Thing will be sent a SHOT message.
     */
    Bullet.prototype.attack = function() {

        // See what was in our way.
        var thing = this.board.getTile(this.point.add(this.direction));

        /*
         * Send a SHOT message if the bullet was from the player 
         * otherwise we only send the SHOT message to the player, Scriptables, and BreakableWalls.
         */
        if(thing && this.fromPlayer ||
                thing instanceof Player || thing instanceof Scriptable || thing instanceof BreakableWall) {
            thing.sendMessage('SHOT');
        }

    };

    /**
     * Make this Bullet react to its environment by looking for ricochet points or removing itself
     * from the board.
     */
    Bullet.prototype.react = function() {

        // If we are still blocked (by a non-player), check if we should ricochet
        var thing = this.getAdjacentThing(this.direction);
        if(thing && !(thing instanceof Player)) {

            // If there is a ricochet in our direction, reflect in the opposite direction if we're not blocked that way
            if(thing instanceof Ricochet) {
                this.ricochet(jzt.Direction.opposite(this.direction));
                return;
            }

            // If there is a ricochet to our right, reflect to the left if we're not blocked that way
            else if(this.getAdjacentThing(jzt.Direction.clockwise(this.direction)) instanceof Ricochet) {
                this.ricochet(jzt.Direction.counterClockwise(this.direction));
                return;
            }

            // If there is a ricochet to our left, reflect to our right if we're not blocked that way
            else if(this.getAdjacentThing(jzt.Direction.counterClockwise(this.direction)) instanceof Ricochet) {
                this.ricochet(jzt.Direction.clockwise(this.direction));
                return;
            }

        }

        // Otherwise remove this bullet...
        this.remove();

    };

    /**
     * Change the direction of this bullet (with a ricochet sound) if we're capable of moving that way.
     *
     * @param A direction in which to ricochet
     */
    Bullet.prototype.ricochet = function(direction) {

        // Change directions
        this.direction = direction;

        // If we're free to ricochet in the provided direction...
        if(this.move(direction, true)) {

            // Play our ricochet sound
            this.play('9', false, true);

        }

        // If we're not free to ricochet, attack and then remove ourselves
        else {
            this.attack();
            this.remove();
        }
    };

    /**
     * Attempts to push this Bullet.
     */
    Bullet.prototype.push = function() {
        this.remove();
    };

    //--------------------------------------------------------------------------------

    /**
     * Centipede is an UpdateableThing capable of chaining itself to other
     * Centipedes and moving around the board as a unit.
     *
     * @param board An owner board for this Centipede
     */
    function Centipede(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 79;
        this.foreground = jzt.colors.BrightBlue;
        this.background = undefined;
        this.speed = 3;
        this.follower = undefined;
        this.head = false;
        this.leader = undefined;
        this.linked = false;
        this.firstTick = true;
        this.orientation = undefined;
        this.deviance = 0;
        this.intelligence = 0;
    }
    Centipede.prototype = new UpdateableThing();
    Centipede.prototype.constructor = Centipede;

    /**
     * Serializes this Thing to an object and returns it.
     *
     * @return A serialized version of this Thing.
     */
    Centipede.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.head = this.head;
        result.deviance = this.deviance;
        result.intelligence = this.intelligence;
        if(this.orientation) {
            result.orientation = jzt.Direction.getShortName(this.orientation);
        }
        if(this.follower) {
            result.nextSegment = jzt.Direction.getShortName(this.point.directionTo(this.follower.point));
        }
        return result;
    };

    /**
     * Deserializes a given data object and update's this Thing's state to
     * that data.
     *
     * @param data An object to be deserialized into this Thing.
     */
    Centipede.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.head = data.head;
        this.intelligence = data.intelligence;
        this.deviance = data.deviance;
        if(data.orientation) {
            this.orientation = jzt.Direction.fromName(data.orientation);
        }
        if(data.nextSegment) {
            this.nextSegment = jzt.Direction.fromName(data.nextSegment);
        }
        if(this.deviance > 10) {
            this.deviance = 10;
        }
        if(this.intelligence > 10) {
            this.intelligence = 10;
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
    Centipede.prototype.getAdjacentSegment = function() {

        /**
         * Returns true if a provided candidate Thing is a Centipede, is 
         * unlinked, and is not a head.
         *
         * @param candidate a Thing
         * @return true if a candidate is an unlinked, non-head Centipede
         */
        function isUnlinkedSegment(candidate) {
            return candidate && (candidate instanceof Centipede) && !candidate.linked && !candidate.nextSegment && !candidate.head;
        }

        var result;

        // If a next segment direction was explicitly defined...
        if(this.nextSegment) {
            result = this.board.getTile(this.point.add(this.nextSegment));
            delete this.nextSegment;

            // Sanity check before returning our result
            if((result instanceof Centipede) && !result.head) {
                return result;
            }

        }

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
    Centipede.prototype.linkSegments = function(leader) {

        this.linked = true;
        this.leader = leader;

        if(this.leader) {
            this.deviance = leader.deviance;
            this.intelligence = leader.intelligence;
            this.cycleCount = leader.cycleCount;
            this.speed = leader.speed;
        }

        this.follower = this.getAdjacentSegment();

        if(this.follower) {

            if(this.head) {
                // Choose a natural initial orientation
                this.orientation = this.follower.point.directionTo(this.point);
            }

            this.follower.linkSegments(this);

        }

    };

    /**
     * Reverses the follower/leader relationship of this Centipede
     * and its followers.
     */
    Centipede.prototype.reverse = function() {

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
    Centipede.prototype.becomeHead = function() {

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
    Centipede.prototype.move = function(direction) {

        var myPlace = this.point.clone();

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
    Centipede.prototype.push = function() {
        this.play('t+c---c++++c--c');
        this.remove();
    };

    /**
     * Deletes this Centipede from its Board. Any leader and follower 
     * Centipedes will be updates to no longer contain this Centipede
     * as well.
     */
    Centipede.prototype.remove = function() {

        if(this.leader) {
            this.leader.follower = undefined;
        }
        if(this.follower) {
            this.follower.leader = undefined;
        }

        UpdateableThing.prototype.remove.call(this);

    };

    /**
     * Sends a provided message to this Centipede. If a SHOT message
     * is received, then this Centipede will be deleted from its board.
     * If a TOUCH message is received, then the board's player will be 
     * sent a SHOT message and this Centipede will be deleted.
     *
     * @param message A message to be sent to this Centipede.
     */
    Centipede.prototype.sendMessage = function(message) {
        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Centipede.prototype.deviate = function() {

        if(this.deviance <= 0) {
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
    Centipede.prototype.seekPlayer = function() {

        if(this.intelligence <= 0) {
            return false;
        }

        if(this.isPlayerAligned()) {

            var randomValue = Math.floor(Math.random()*10);
            return randomValue <= this.intelligence;

        }

        return false;

    };

    /**
     * Performs a tick.
     */
    Centipede.prototype.doTick = function() {

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

    function Conveyor(board) {
        UpdateableThing.call(this, board);
        this.clockwise = true;
        this.animationIndex = Math.floor(Math.random()*Conveyor.animationFrames.length-1);
        this.spriteIndex = 179;
    }
    Conveyor.prototype = new UpdateableThing();
    Conveyor.prototype.constructor = Conveyor;
    Conveyor.animationFrames = [179, 47, 45, 92];
    Conveyor.MoveAction = {MOVE: 1, TENTATIVE: 2};

    Conveyor.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.clockwise = this.clockwise;
        return result;
    };

    Conveyor.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.clockwise = data.clockwise;
    };

    Conveyor.prototype.markPath = function(path) {

        var index;
        var tile;
        var obstacle;
        var MoveAction = Conveyor.MoveAction;

        for(index = path.length-1; index >= 0; --index) {

            // Grab our tile of interest
            tile = this.board.getTile(path[index]);

            // If it exists and is conveyable...
            if(tile && tile.conveyable) {

                // If we're starting, our move is tentative on the final move
                if(index === path.length-1) {
                    path[index].action = MoveAction.TENTATIVE;
                }

                // If we're not just starting...
                else {

                    // If the path isn't off the board...
                    if(!this.board.isOutside(path[index+1])) {

                        // Grab our obstacle
                        obstacle = this.board.getTile(path[index+1]);

                        // If there is no obstacle, or it's surrenderable, then set our action to MOVE
                        if(!obstacle || (!obstacle.conveyable && obstacle.surrenderable)) {
                            path[index].action = MoveAction.MOVE;
                        }

                        // Otherwise set it to the same action as the previous path point
                        else {
                            path[index].action = path[index+1].action;
                        }

                    }

                }

            }

        }

        // If the last position is free, or if the last path action is MOVE or TENTATIVE...
        if(this.board.isFreeOrSurrenderable(path[0]) || path[0].action === MoveAction.MOVE || path[0].action === MoveAction.TENTATIVE) {

            // Convert all TENTATIVE actions to MOVE actions
            for(index = 0; index < path.length; index++) {
                if( path[index].action === MoveAction.TENTATIVE) {
                    path[index].action = MoveAction.MOVE;
                }
            }

        }

    };

    Conveyor.prototype.executePath = function(path) {

        var index;
        var heldThing;
        var thing;

        for(index = path.length-1; index >= 0; --index) {

            if(path[index].action === Conveyor.MoveAction.MOVE) {

                thing = this.board.getTile(path[index]);
                this.board.deleteTile(path[index]);

                if(index === path.length-1) {
                    heldThing = thing;
                }
                else {
                    this.board.addThing(path[index+1], thing);
                }

            }

        }

        if(heldThing) {
            this.board.addThing(path[0], heldThing);
        }

    };

    Conveyor.prototype.doTick = function() {

        var path;

        if(this.clockwise) {

            if(++this.animationIndex >= Conveyor.animationFrames.length) {
                this.animationIndex = 0;
            }


            path = [
                new jzt.Point(this.point.x-1, this.point.y-1),
                new jzt.Point(this.point.x, this.point.y-1),
                new jzt.Point(this.point.x+1, this.point.y-1),
                new jzt.Point(this.point.x+1, this.point.y),
                new jzt.Point(this.point.x+1, this.point.y+1),
                new jzt.Point(this.point.x, this.point.y+1),
                new jzt.Point(this.point.x-1, this.point.y+1),
                new jzt.Point(this.point.x-1, this.point.y)
            ];

        }
        else {

            if(--this.animationIndex < 0) {
                this.animationIndex = Conveyor.animationFrames.length-1;
            }

            path = [
                new jzt.Point(this.point.x-1, this.point.y-1),
                new jzt.Point(this.point.x-1, this.point.y),
                new jzt.Point(this.point.x-1, this.point.y+1),
                new jzt.Point(this.point.x, this.point.y+1),
                new jzt.Point(this.point.x+1, this.point.y+1),
                new jzt.Point(this.point.x+1, this.point.y),
                new jzt.Point(this.point.x+1, this.point.y-1),
                new jzt.Point(this.point.x, this.point.y-1)
            ];

        }

        this.markPath(path);
        this.executePath(path);

        this.spriteIndex = Conveyor.animationFrames[this.animationIndex];

    };

    //--------------------------------------------------------------------------------

    /**
     * Door is a Thing that acts as an obstacle unless an associated Key has been 
     * collected first.
     */
    function Door(board) {
        Thing.call(this, board);
        this.spriteIndex = 10;
        this.foreground = jzt.colors.BrightWhite;
        this.background = jzt.colors.Blue;
    }
    Door.prototype = new Thing();
    Door.prototype.constructor = Door;

    Door.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.foreground = jzt.colors.BrightWhite;
    };

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is received, then
     * this Door will vanish if an associated Key has been previously collected.
     *
     * @param messageName a name of a message to deliver.
     */
    Door.prototype.sendMessage = function(message) {

        var doorType;
        var matchingKeyCode;

        if(message === 'TOUCH') {

            // Get a readable door description
            doorType = jzt.i18n.getMessage('doors.' + this.background.code);

            // Determine a matching key code
            matchingKeyCode = 'KEY' + this.background.lighten().code;

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

    function Duplicator(board) {
        UpdateableThing.call(this, board);
        this.MAX_STEPS = 20;
        this.copyDirection = jzt.Direction.East;
        this.speed = 10;
        this.spriteIndex = 250;
        this.background = undefined;
        this.currentStep = 0;
        this.foreground = jzt.colors.BrightWhite;
    }
    Duplicator.prototype = new UpdateableThing();
    Duplicator.prototype.constructor = Duplicator;
    Duplicator.animationFrames = [250, 249, 7, 9, 111, 79];

    Duplicator.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.copyDirection = jzt.Direction.getShortName(this.copyDirection);
        return result;
    };

    Duplicator.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightWhite;
        this.copyDirection = jzt.Direction.fromName(data.copyDirection);
    };

    Duplicator.prototype.doTick = function() {

        var cloneThing;
        var targetThing;
        var isFreeSpace;
        var clonePoint;
        var targetPoint;
        var cloned = false;

        if(++this.currentStep >= this.MAX_STEPS) {

            this.currentStep = 0;

            // Grab our clone point and thing
            clonePoint = this.point.add(this.copyDirection);
            cloneThing = this.board.getTile(clonePoint);

            // Grab our target point
            targetPoint = this.point.add(jzt.Direction.opposite(this.copyDirection));

            // If our target point is on the board, see what's already there
            if(!this.board.isOutside(targetPoint)) {
                targetThing = this.board.getTile(targetPoint);
            }

            // Otherwise, cancel the clone
            else {
                cloneThing = undefined;
            }

            // If we got a thing to clone...
            if(cloneThing) {

                // Determine if there is free space, or if we can make some by pushing an obstacle
                isFreeSpace = targetThing ? this.board.moveTile(this.point, targetPoint, false, true) : true;

                // If there is free space
                if(isFreeSpace) {

                    cloned = true;

                    // Create our new thing
                    this.board.addThing(targetPoint, cloneThing.clone());

                }

            }


            this.play(cloned ? 'scdefg' : '--g#f#');



        }

        this.spriteIndex = Duplicator.animationFrames[Math.round((this.currentStep / this.MAX_STEPS) * (Duplicator.animationFrames.length-1))];

    };

    //--------------------------------------------------------------------------------

    function Explosion(board) {
        UpdateableThing.call(this, board);
        this.radius = 4;
        this.timeToLive = Explosion.MAX_TTL;
        this.speed = 1;
        this.spriteIndex = 0;
    }
    Explosion.prototype = new UpdateableThing();
    Explosion.prototype.constructor = Explosion;
    Explosion.MAX_TTL = 5;

    Explosion.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.radius = jzt.getOption(data, 'radius', 4);
        this.timeToLive = jzt.getOption(data, 'timeToLive', Explosion.MAX_TTL);
    };

    Explosion.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize(this);
        result.radius = this.radius;
        result.timeToLive = this.timeToLive;
        return result;
    };

    Explosion.prototype.doTick = function() {

        var points;
        var index;
        var tile;

        // If we're at the start of our explosion, send a BOMBED message to all affected Things
        if(this.timeToLive === Explosion.MAX_TTL) {

            this.play('t+++c-c-c-c-c-c', true);

            points = jzt.util.pointsInCircle(this.point, this.radius);

            for(index = 0; index < points.length; ++index) {
                tile = this.board.getTile(points[index]);
                if(tile) {
                    tile.sendMessage('BOMBED');
                }
            }
        }

        // After our time to live, remove ourselves
        if(--this.timeToLive <= 0) {
            this.remove();
        }

    };

    Explosion.prototype.getTorch = function() {
        return jzt.util.generateCircleData(this.point, Math.round((this.radius * this.timeToLive) / (Explosion.MAX_TTL - 1))+2);
    };

    Explosion.prototype.render = function(context) {

        var points;
        var index;
        var sprite = this.board.game.resources.graphics.getSprite(176 + Math.round((2 * this.timeToLive) / Explosion.MAX_TTL));
        var radius;

        if(this.timeToLive === Explosion.MAX_TTL) {
            radius = Math.round(this.radius / 2);
        }
        else {
            radius = Math.round((this.radius * this.timeToLive) / (Explosion.MAX_TTL - 1));
        }

        points = jzt.util.pointsInCircle(this.point, radius);

        for(index = 0; index < points.length; ++index) {
            sprite.draw(context, points[index].subtract(this.board.windowOrigin), jzt.colors.Yellow, jzt.colors.Red);
        }

    };

    //--------------------------------------------------------------------------------

    /**
     * FakeWall looks like a normal Wall, but is surrenderable to whatever Thing wishes
     * to move there.
     *
     * @param board An owner board for this FakeWall
     */
    function FakeWall(board) {
        Thing.call(this, board);
        this.spriteIndex = 178;
        this.foreground = jzt.colors.Yellow;
        this.background = jzt.colors.Black;
    }
    FakeWall.prototype = new Thing();
    FakeWall.prototype.constructor = FakeWall;

    /**
     * Returns whether or not this FakeWall is surrenderable to another thing.
     *
     * @param sender Another Thing that is requesting this Thing to surrender
     * @return true if this Thing is willing to surrender its position.
     */
    FakeWall.prototype.isSurrenderable = function() {
        return true;
    };

    /**
     * Retrieves a sprite index used to represent this FakeWall on a rendered
     * Board. If this FakeWall's owner board's game is in debug mode, then a visible
     * representation will be used.
     */
    FakeWall.prototype.getSpriteIndex = function() {
        return this.board.game.isEditor ? 176 : 178;
    };

    //--------------------------------------------------------------------------------

    /*
     * Forest acts as a non-pushable obstacle, like a wall, but it vanishes when the 
     * player attempts to move to its location, clearing this Thing from the board.
     *
     * @param board An owner board for this Forest
     */
    function Forest(board) {
        Thing.call(this, board);
        this.spriteIndex = 176;
        this.foreground = jzt.colors.Black;
        this.background = jzt.colors.Green;
    }
    Forest.prototype = new Thing();
    Forest.noteCycle = ['e','-b','f#','b','f','c','g','+c'];
    Forest.noteIndex = 0;
    Forest.prototype.constructor = Forest;

    /**
     * Serializes this Forest into a data object.
     */
    Forest.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    /**
     * Deserializes a provided data Object into Forest.
     *
     * @param data A data object to be deserialized into Forest.
     */
    Forest.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = jzt.colors.Green;
        this.foreground = jzt.colors.Black;
    };

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is received,
     * then this Forest will be deleted from the board, allowing movement onto its
     * space.
     *
     * @param messageName a name of a message to deliver.
     */
    Forest.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {

            this.oneTimeMessage('status.forest');

            this.play(Forest.noteCycle[Forest.noteIndex++]);
            if(Forest.noteIndex >= Forest.noteCycle.length) {
                Forest.noteIndex = 0;
            }

            this.board.deleteTile(this.point);
        }
    };

    //--------------------------------------------------------------------------------

    function Gem(board) {
        Thing.call(this, board);
        this.spriteIndex = 4;
        this.background = undefined;
        this.foreground = jzt.colors.BrightMagenta;
        this.conveyable = true;
    }
    Gem.prototype = new Thing();
    Gem.prototype.constructor = Gem;

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is received,
     * then the game's Gems counter will increase by 1, the health counter will increase
     * by 1, and the score counter will inrease by 10.
     *
     * @param messageName a name of a message to deliver.
     */
    Gem.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.oneTimeMessage('status.gem');
            this.remove();
            this.adjustCounter('HEALTH', 1);
            this.adjustCounter('GEMS', 1);
            this.adjustCounter('SCORE', 10);
            this.play('t+c-gec');
        }
        else if(message === 'SHOT' || message === 'BOMBED') {
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
    Gem.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!this.move(direction)) {
            this.remove();
        }

    };

    //--------------------------------------------------------------------------------

    function Heart(board) {
        Thing.call(this, board);
        this.spriteIndex = 3;
        this.foreground = jzt.colors.BrightRed;
        this.background = undefined;
        this.conveyable = true;
    }
    Heart.prototype = new Thing();
    Heart.prototype.constructor = Heart;

    Heart.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    Heart.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.foreground = jzt.colors.BrightRed;
        this.background = undefined;
    };

    Heart.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.remove();
            this.play('tcefg+ceg');
            this.adjustCounter('HEALTH_MAX', 10);
            this.adjustCounter('HEALTH', 10);
            this.adjustCounter('SCORE', 500);
            this.board.setDisplayMessage(jzt.i18n.getMessage('status.heart'));
        }
    };

    Heart.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }
        else {
            this.move(direction);
        }

    };

    //--------------------------------------------------------------------------------

    /*
     * InvisibleWall will appear invisible until it is touched, at which point it
     * becomes a regular Wall.
     * 
     * @param board An owner Board.
     */
    function InvisibleWall(board) {
        Thing.call(this, board);
        this.spriteIndex = 0;
        this.foreground = jzt.colors.BrightGreen;
    }
    InvisibleWall.prototype = new Thing();
    InvisibleWall.prototype.constructor = InvisibleWall;

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is received,
     * then this Thing will turn into a Wall Thing.
     *
     * @param messageName a name of a message to deliver.
     */
    InvisibleWall.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            var replacement = new Wall();
            replacement.foreground = this.foreground;
            replacement.background = this.background;
            this.oneTimeMessage('status.invisible');
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
    InvisibleWall.prototype.getSpriteIndex = function() {
        return this.board.game.isEditor ? 176 : 0;
    };

    //--------------------------------------------------------------------------------

    /**
     * Key is a Thing representing a collectable key item. One key of a given color
     * may be collected at a time. Keys are used to unlock Door Things.
     *
     * @param board An owner Board for this Key.
     */
    function Key(board) {
        Thing.call(this, board);
        this.spriteIndex = 12;
        this.background = undefined;
        this.foreground = jzt.colors.BrightBlue;
        this.conveyable = true;
    }
    Key.prototype = new Thing();
    Key.prototype.constructor = Key;

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is 
     * received, then this Key will be collected, if an existing Key of this
     * type has not already been collected.
     *
     * @param messageName a name of a message to deliver.
     */
    Key.prototype.sendMessage = function(message) {

        var keyType;

        if(message === 'TOUCH') {

            // Get a readable description of this key type
            keyType = jzt.i18n.getMessage('keys.' + this.foreground.code);

            // If the player already has this key type...
            if(this.getCounterValue('KEY' + this.foreground.code) > 0) {
                this.board.setDisplayMessage(jzt.i18n.getMessage('keys.toomany', keyType));
                this.play('sc-c');
            }

            // If the player does not yet have this key type...
            else {
                this.remove();
                this.adjustCounter('KEY' + this.foreground.code, 1);
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
    Key.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!(pusher instanceof Player) && this.move(direction)) {
            this.play('t--f', false, true);
        }
    };

    //--------------------------------------------------------------------------------
    function Lava(board) {
        Thing.call(this, board);
        this.background = jzt.colors.BrightRed;
        this.foreground = jzt.colors.BrightRed;
        this.cycleCount = 0;
        this.cycleRate = board.game.CYCLE_RATE * 5;
        this.spriteIndex = 176;
    }
    Lava.prototype = new Thing();
    Lava.prototype.constructor = Lava;

    Lava.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    Lava.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = jzt.colors.BrightRed;
        this.foreground = jzt.colors.BrightRed;
    };

    Lava.prototype.updateWhileUnder = function() {

        var thing = this.board.getTile(this.point);

        // If a player stepped on the lava...
        if(thing instanceof Player) {

            // Damage the player every five cycles
            if(++this.cycleCount > this.cycleRate) {
                this.cycleCount = 0;
                thing.sendMessage('SHOT');
            }

        }

        // Scriptables get sent a LAVA message
        else if(thing instanceof Scriptable) {
            thing.sendMessage('LAVA');
        }

        // Any other thing that isn't immune gets damaged immediately
        else if(! thing.lavaWalker) {
            thing.sendMessage('SHOT');
        }

    };

    Lava.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.cycleCount = 0;
            this.board.player.sendMessage('SHOT');
        }
    };

    Lava.prototype.isSurrenderable = function() {
        return true;
    };

    //--------------------------------------------------------------------------------

    /*
     * LineWall is a Thing representing an immoveable obstacle with line decoration.
     *
     * @param board An owner board for this LineWall.
     */
    function LineWall(board) {
        Thing.call(this, board);
        this.spriteIndex = undefined;
    }
    LineWall.prototype = new Thing();
    LineWall.prototype.constructor = LineWall;
    LineWall.lineMap = {
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
    LineWall.prototype.getSpriteIndex = function() {

        if(this.spriteIndex !== undefined && !this.board.game.isEditor) {
            return this.spriteIndex;
        }

        function isLineAdjacent(source, direction) {
            return source.board.getTile(source.point.add(direction)) instanceof LineWall;
        }

        var surroundingPattern = '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.North) ? 'N' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.East) ? 'E' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.South) ? 'S' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.West) ? 'W' : '';

        this.spriteIndex = LineWall.lineMap[surroundingPattern];
        return this.spriteIndex;

    };

    //--------------------------------------------------------------------------------

    /**
     * Lion is an UpdateableThing representing a lion enemy, which moves around
     * with a specified randomness and attacks the player.
     */
    function Lion(board) {
        UpdateableThing.call(this, board);
        this.intelligence = 3;
        this.spriteIndex = 234;
        this.foreground = jzt.colors.BrightRed;
        this.background = undefined;
        this.speed = 2;
        this.conveyable = true;
    }
    Lion.prototype = new UpdateableThing();
    Lion.prototype.constructor = Lion;

    /**
     * Serializes this Lion to an Object.
     *
     * @return A serialized Lion
     */
    Lion.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.intelligence = this.intelligence;
        return result;
    };

    /**
     * Deserializes this Lion from a provided data Object
     * 
     * @param data A data Lion object to be deserialized.
     */
    Lion.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightRed;
        this.intelligence = data.intelligence;
    };

    /**
     * Delivers a provided message to this Thing. If a SHOT message is received,
     * then this Lion will be deleted from the board. If a TOUCH message is 
     * received, then the player will be sent a SHOT message.
     *
     * @param messageName a name of a message to deliver.
     */
    Lion.prototype.sendMessage = function(message) {

        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Lion.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!this.move(direction)) {
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
    Lion.prototype.seekPlayer = function() {

        var randomValue = Math.floor(Math.random()*10);
        return randomValue <= this.intelligence;

    };

    /**
     * Updates this Lion for a provided timestamp. This Lion will move itself randomly
     * during updates. If a Player blocks its movement, then the player will be sent
     * a SHOT message and this Lion will be removed from its parent board.
     */
    Lion.prototype.doTick = function() {

        var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();

        var thing = this.board.getTile(this.point.add(direction));
        if(thing && thing instanceof Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }

        // Don't attempt to move in the direction of a river
        else if(thing && thing instanceof River && thing.direction === jzt.Direction.opposite(direction)) {
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
    function Passage(board) {
        Thing.call(this, board);
        this.spriteIndex = 240;
        this.foreground = jzt.colors.BrightWhite;
        this.background = jzt.colors.Blue;
        this.targetBoard = undefined;
        this.passageId = 0;
        this.glow = true;
    }
    Passage.prototype = new Thing();
    Passage.prototype.constructor = Passage;

    /**
     * Delivers a provided message to this Thing. If a TOUCH message is received,
     * then this Passage will move the player to a matching Passage on its target board.
     *
     * @param messageName a name of a message to deliver.
     */
    Passage.prototype.sendMessage = function(message) {
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
    Passage.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        result.passageId = this.passageId;
        result.targetBoard = this.targetBoard;
        return result;
    };

    /**
     * Deserializes a provided data Object into a Passage.
     *
     * @param data A data object to be deserialized into a Passage.
     */
    Passage.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
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
    function Player(board) {
        UpdateableThing.call(this, board);

        this.name = 'Player';
        this.spriteIndex = 2;
        this.point = new jzt.Point(-1,-1);
        this.foreground = jzt.colors.BrightWhite;
        this.background = jzt.colors.Blue;
        this.conveyable = true;

        if(board) {
            this.eventScheduler = new jzt.DelayedEventScheduler(board.game.CYCLE_TICKS * 2, 0);
        }

        this.torch = undefined;
        this.torchStrength = 0;
        this.torchExpiry = 0;
        this.game = undefined;
        this.speed = 1;
        this.MOVE_ACTION = 0;
        this.SHOOT_ACTION = 1;
        this.glow = true;

        this.TORCH_TTL = 60000; // One Minute
        this.MAX_TORCH_STRENGTH = 4;

    }
    Player.prototype = new UpdateableThing();
    Player.prototype.constructor = Player;

    /**
     * Serializes this Player instance. Note that serializing a Player does not
     * return data.
     */
    Player.prototype.serialize = function() {
        return 0;
    };

    /**
     * Retrieves exportable properties from this Player.
     *
     * @return Player properties
     */
    Player.prototype.getProperties = function() {
        return {
            torch: this.torch,
            torchExpiry: this.torchExpiry,
            torchStrength: this.torchStrength
        };
    };

    /**
     * Assigns properties to this Player from an exported properties object.
     *
     * @param properties Exported Player properties.
     */
    Player.prototype.setProperties = function(properties) {
        this.torch = jzt.util.getOption(properties, 'torch', this.torch);
        this.torchExpiry = jzt.util.getOption(properties, 'torchExpiry', this.torchExpiry);
        this.torchStrength = jzt.util.getOption(properties, 'torchStrength', this.torchStrength);
    };

    /**
     * Receives a request to be pushed in a given direction.
     *
     * @param direction A direction in which this Thing is requested to move.
     */
    Player.prototype.push = function(direction) {
        this.move(direction);
    };

    /**
     * Moves this Thing in a provided Direction and returns its success.
     * 
     * @param direction A Direction in which to move this Thing.
     * @return true if the move was successful, false otherwise.
     */
    Player.prototype.move = function(direction) {

        // Remember our current location
        var startingPoint = this.point.clone();

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

        // If the player wasn't already moved as a result of above actions, do our move
        if(this.point.equals(startingPoint)) {
            return this.board.moveTile(this.point, newLocation);
        }

        // Otherwise this wasn't a typical move anymore
        return false;

    };

    /**
     * Shoots a player bullet in a provided Direction.
     *
     * @param A Direction in which to shoot a player bullet.
     */
    Player.prototype.shoot = function(direction) {

        // If we can't shoot on this board, return
        if(this.board.canPlayerShoot(true) <= 0) {
            return;
        }

        if(this.getCounterValue('AMMO') > 0) {
            this.adjustCounter('AMMO', -1);
            ThingFactory.shoot(this.board, this.point.add(direction), direction, true);
        }
        else {
            this.board.setDisplayMessage(jzt.i18n.getMessage('status.noammo'));
        }
    };

    /**
     * Performs an update tick of this Player instance, moving or shooting
     * in its direction, as necessary.
     */
    Player.prototype.doTick = function() {

        var event = this.eventScheduler.takeEvent();

        if(event) {
            if(event.type === this.MOVE_ACTION) {
                this.move(event.direction);
            }
            else if(event.type === this.SHOOT_ACTION) {
                this.shoot(event.direction);
            }
        }

        if(this.torch) {
            this.updateTorch(Date.now());
        }

    };


    /**
     * Updates this Player for a single execution cycle. During its update,
     * Player will check for keypresses and move accordingly.
     */
    Player.prototype.update = function() {

        var k = this.game.keyboard;
        var key = k.getMostRecentPress([k.UP, k.RIGHT, k.DOWN, k.LEFT]);

        if(k.isPressed(k.SHIFT) || k.isPressed(k.SPACE)) {

            if(key === k.UP) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.UP), {'type': this.SHOOT_ACTION,  'direction': jzt.Direction.North});
            }
            else if(key === k.RIGHT) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.RIGHT), {'type': this.SHOOT_ACTION, 'direction': jzt.Direction.East});
            }
            else if(key === k.DOWN) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), {'type': this.SHOOT_ACTION, 'direction': jzt.Direction.South});
            }
            else if(key === k.LEFT) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.LEFT), {'type': this.SHOOT_ACTION, 'direction': jzt.Direction.West});
            }
            else {
                this.eventScheduler.cancelEvent();
            }
        }
        else {
            if(key === k.UP) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.UP), {'type': this.MOVE_ACTION, 'direction': jzt.Direction.North});
            }
            else if(key === k.RIGHT) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.RIGHT), {'type': this.MOVE_ACTION, 'direction': jzt.Direction.East});
            }
            else if(key === k.DOWN) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), {'type': this.MOVE_ACTION, 'direction': jzt.Direction.South});
            }
            else if(key === k.LEFT) {
                this.eventScheduler.scheduleEvent(k.isPressed(k.LEFT), {'type': this.MOVE_ACTION, 'direction': jzt.Direction.West});
            }
            else {
                this.eventScheduler.cancelEvent();
            }

            // If T has been pressed, and we have 10 seconds or less on our current torch
            if(k.isPressed([k.T]) && ((!this.torch || (this.torchExpiry - Date.now()) < 10000))) {
                this.useTorch();
            }

        }

        UpdateableThing.prototype.update.call(this);

        // To stay sufficiently responsive, the player torch has to be initialized explicitly here
        this.board.initializeTorch(this);

    };

    /**
     * Uses a torch, illuminating surrounding tiles if a given board is
     * dark.
     */
    Player.prototype.useTorch = function() {

        // If the player has torches available...
        if(this.game.getCounterValue('TORCHES') > 0) {

            // If the room isn't dark, let the player keep the torch
            if(!this.board.dark) {
                this.board.setDisplayMessage(jzt.i18n.getMessage('status.notdark'));
                return;
            }

            // Decrease our torch count
            this.game.adjustCounter('TORCHES', -1);

            // Specify that we're now using a torch
            this.torch = true;
            this.torchExpiry = Date.now() + this.TORCH_TTL;
            this.torchStrength = this.MAX_TORCH_STRENGTH;

        }

        // Otherwise, if there are no torches available...
        else {

            // Display a message indicating we have no torches
            this.board.setDisplayMessage(jzt.i18n.getMessage('status.notorches'));

        }


    };

    /**
     * An event handler to be called when the game is unpaused.
     */
    Player.prototype.onUnpause = function(pauseDuration) {
        if(this.torch) {
            this.torchExpiry = this.torchExpiry + pauseDuration;
        }
    };

    /**
     * Updates this Player's torch as of a provided timestamp moment, dimming
     * the surrounding area as the torch ages.
     *
     * @param timeStamp A moment representing a new reality for this Player's torch.
     */
    Player.prototype.updateTorch = function(timeStamp) {

        var torchLife;

        // If we've already past our torch expiry date
        if(timeStamp > this.torchExpiry) {
            this.play('tc-c-c');
            this.torch = false;
        }

        // Otherwise...
        else {

            // Calculate our torche's life remaining
            torchLife = this.torchExpiry - timeStamp;

            if(torchLife < 20000) {
                this.torchStrength = Math.ceil((torchLife * this.MAX_TORCH_STRENGTH) / 20000);
            }

        }

    };

    Player.prototype.getTorch = function() {
        if(this.torch) {
            return jzt.util.generateCircleData(this.point, this.torchStrength);
        }
    };

    /**
     * Delivers a provided message to this Thing.
     *
     * @param messageName a name of a message to deliver.
     */
    Player.prototype.sendMessage = function(message) {

        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t--c+c-c+d#', true);
            this.adjustCounter('HEALTH', -10);
            this.board.playerHurt();
        }

    };

    //--------------------------------------------------------------------------------

    /**
     * Pusher represents an UpdateableThing that continually moves in a defined direction,
     * pushing obstacles in its path.
     * 
     * @param board An owner board for this Pusher.
     */
    function Pusher(board) {
        UpdateableThing.call(this, board);
        this.orientation = jzt.Direction.South;
        this.speed = 3;
        this.initializeSprite();
    }
    Pusher.prototype = new UpdateableThing();
    Pusher.prototype.constructor = Pusher;

    /**
     * Initializes a spriteIndex for this Pusher based on its defined
     * direction.
     */
    Pusher.prototype.initializeSprite = function() {
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
    Pusher.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.orientation = jzt.Direction.getName(this.orientation);
        return result;
    };

    /**
     * Deserializes a provided data object into a Pusher instance.
     * 
     * @param data Serializes Pusher data to be deserialized.
     */
    Pusher.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        if(data.orientation) {
            this.orientation = jzt.Direction.fromName(data.orientation);
        }
        this.initializeSprite();
    };

    /**
     * Performs a tick update of this Pusher.
     */
    Pusher.prototype.doTick = function() {
        if(this.move(this.orientation)) {
            this.play('t--f', false, true);
        }
    };

    //--------------------------------------------------------------------------------

    /**
     * Ricochet is a Thing that reflects bullets.
     *
     * @param board An owner board for this Ricochet.
     */
    function Ricochet(board) {
        Thing.call(this, board);
        this.spriteIndex = 42;
        this.background = undefined;
        this.foreground = jzt.colors.BrightGreen;
    }
    Ricochet.prototype = new Thing();
    Ricochet.prototype.constructor = Ricochet;

    /**
     * Serializes this Ricochet to a data object.
     */
    Ricochet.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    /**
     * Deserializes this Ricochet from a data object.
     */
    Ricochet.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightGreen;
    };

    //--------------------------------------------------------------------------------

    function River(board) {
        Thing.call(this, board);
        this.direction = jzt.Direction.North;
        this.background = jzt.colors.Blue;
        this.foreground = jzt.colors.BrightBlue;
        this.speed = 1;
        this.initialize();
    }
    River.prototype = new Thing();
    River.prototype.constructor = River;

    River.prototype.initialize = function() {
        switch(jzt.Direction.getShortName(this.direction)) {
            case 'N':
                this.spriteIndex = 30;
                break;
            case 'E':
                this.spriteIndex = 16;
                break;
            case 'S':
                this.spriteIndex = 31;
                break;
            case 'W':
                this.spriteIndex = 17;
                break;
        }
    };

    River.prototype.updateWhileUnder = function() {
        UpdateableThing.prototype.update.call(this);
    };

    River.prototype.doTick = function() {

        var thing = this.board.getTile(this.point);

        if(thing.conveyable) {
            thing.push(this.direction, this);
        }

    };

    River.prototype.isSurrenderable = function() {
        return true;
    };

    River.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        delete result.speed;
        result.direction = jzt.Direction.getShortName(this.direction);
        return result;
    };

    River.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = jzt.colors.Blue;
        this.foreground = jzt.colors.BrightBlue;
        this.direction = jzt.Direction.fromName(data.direction);
        this.initialize();
    };

    //--------------------------------------------------------------------------------


    /**
     * Ruffian is an UpdateableThing that attacks in a burst of movement, followed
     * by a wait time, then another burst of movement.
     *
     * @param board An owner board for this Ruffian.
     */
    function Ruffian(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 5;
        this.background = undefined;
        this.foreground = jzt.colors.BrightMagenta;
        this.intelligence = 5;
        this.restingTime = 5;
        this.moving = false;
        this.timeLeft = 0;
        this.speed = 1;
        this.orientation = jzt.Direction.North;
        this.conveyable = true;
    }
    Ruffian.prototype = new UpdateableThing();
    Ruffian.prototype.constructor = Ruffian;

    /**
     * Serializes this Ruffian to a data object.
     * 
     * @return A serialized Ruffian.
     */
    Ruffian.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.intelligence = this.intelligence;
        result.restingTime = this.restingTime;
        return result;
    };

    /**
     * Deserializes a provided data object, configuring this Ruffian.
     * 
     * @param data A data object to be deserialized into a Ruffian.
     */
    Ruffian.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightMagenta;
        this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
        this.restingTime = jzt.util.getOption(data, 'restingTime', 5);
    };

    /** 
     * Pushes this Ruffian instance in a given direction. If this Ruffian
     * cannot be pushed, it will be squished and removed from its owner Board.
     * 
     * @param direction A direction in which to push this Ruffian.
     */
    Ruffian.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!this.move(direction)) {
            this.remove();
            this.play('t+c---c++++c--c');
        }

    };

    /**
     * Sends a provided message to this Ruffian.
     *
     * @param message A message to be delivered to this Ruffian.
     */
    Ruffian.prototype.sendMessage = function(message) {
        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Ruffian.prototype.seekPlayer = function() {

        var randomValue = Math.floor(Math.random()*10);
        return randomValue <= this.intelligence;

    };

    /**
     * Performs an update tick for this Ruffian instance.
     */
    Ruffian.prototype.doTick = function() {

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
            if(thing && thing instanceof Player) {
                thing.sendMessage('SHOT');
                this.remove();
                return;
            }

            // Don't attempt to move in the direction of a river
            else if(thing && thing instanceof River && thing.direction === jzt.Direction.opposite(this.orientation)) {
                return;
            }

            // Otherwise just move
            this.move(this.orientation, true);

        }

    };

    //--------------------------------------------------------------------------------

    /**
     * Signpost is a Thing that displays a message when touched.
     *
     * @param board An owner board
     */
    function Signpost(board) {
        Thing.call(this, board);
        this.spriteIndex = 209;
        this.background = undefined;
        this.foreground = jzt.colors.Brown;
        this.text = undefined;
    }
    Signpost.prototype = new Thing();
    Signpost.prototype.constructor = Signpost;

    Signpost.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        result.text = this.text;
        return result;
    };

    Signpost.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.Brown;
        this.text = data.text;
    };

    Signpost.prototype.sendMessage = function(message) {

        var lines;
        var index;
        var text;

        if(message === 'TOUCH') {

            this.board.game.scroll.setTitle(jzt.i18n.getMessage('obstacles.signpost'));
            this.board.game.scroll.clearLines();

            if(!this.text) {
                this.text = jzt.i18n.getMessage('obstacles.signpostmessage');
            }

            lines = this.text.split('\n');
            for(index = 0; index < lines.length; ++index) {
                text = jzt.i18n.getBoardMessage(this.board, lines[index]);
                this.board.game.scroll.addLine(text);
            }

            this.play('tc-c+d-d+e-e+f-f+g-g');
            this.board.game.setState(jzt.GameState.Reading);

        }

    };

    //--------------------------------------------------------------------------------

    /**
     * SliderEw is a Thing that is pushable only in the East and West direction.
     *
     * @param board An owner board.
     */
    function SliderEw(board) {
        Thing.call(this, board);
        this.spriteIndex = 29;
        this.background = undefined;
        this.foreground = jzt.colors.BrightWhite;
    }
    SliderEw.prototype = new Thing();
    SliderEw.prototype.constructor = SliderEw;

    /**
     * Receives a request to be pushed in a given direction.
     *
     * @param direction A direction in which this Thing is requested to move.
     */
    SliderEw.prototype.push = function(direction) {
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
    function SliderNs(board) {
        Thing.call(this, board);
        this.spriteIndex = 18;
        this.background = undefined;
        this.foreground = jzt.colors.BrightWhite;
    }
    SliderNs.prototype = new Thing();
    SliderNs.prototype.constructor = SliderNs;

    /**
     * Receives a request to be pushed in a given direction.
     *
     * @param direction A direction in which this Thing is requested to move.
     */
    SliderNs.prototype.push = function(direction) {
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
    function Snake(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 235;
        this.background = undefined;
        this.foreground = jzt.colors.Green;
        this.conveyable = true;
        this.speed = 3;
    }
    Snake.prototype = new UpdateableThing();
    Snake.prototype.constructor = Snake;

    Snake.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    /**
     * Attempts to push this Snake in a provided direction.
     */
    Snake.prototype.push = function(direction) {
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
    Snake.prototype.sendMessage = function(message) {
        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Snake.prototype.doTick = function() {

        var direction = this.getSmartDirection();
        var thing;

        if(direction) {

            this.foreground = jzt.colors.BrightGreen;

            thing = this.board.getTile(this.point.add(direction));
            if(thing && thing instanceof Player) {
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
    function SolidWall(board) {
        Thing.call(this, board);
        this.spriteIndex = 219;
    }
    SolidWall.prototype = new Thing();
    SolidWall.prototype.constructor = SolidWall;

    //--------------------------------------------------------------------------------

    /**
     * Spider is an UpdateableThing that only moves along SpideWebs.
     *
     * @param board An owner Board for this Spider
     */
    function Spider(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 15;
        this.foreground = jzt.colors.BrightRed;
        this.background = undefined;
        this.intelligence = 5;
        this.speed = 1;
    }
    Spider.prototype = new UpdateableThing();
    Spider.prototype.constructor = Spider;

    /**
     * Serializes this Spider instance into a data object.
     * 
     * @return A serialized Spider
     */
    Spider.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.intelligence = this.intelligence;
        return result;
    };

    /**
     * Deserializes a data object and configure this Spider instance.
     *
     * @param data A data object to be deserialized into a Spider.
     */
    Spider.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.intelligence = data.intelligence;
    };

    /**
     * Returns whether or not this Spider instance should seek the player
     * for an attack, or choose a random direction. This decision is weighted
     * based on this Spider's intelligence property.
     *
     * @return true if this Spider should seek the player, false otherwise
     */
    Spider.prototype.seekPlayer = function() {

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
    Spider.prototype.isAttackable = function(direction) {
        var thing = this.board.getTile(this.point.add(direction));
        return thing && (thing instanceof SpiderWeb || thing instanceof Player);
    };

    /**
     * Delivers a provided message to this Thing. If a SHOT message is received,
     * then this Lion will be deleted from the board. If a TOUCH message is 
     * received, then the player will be sent a SHOT message.
     *
     * @param messageName a name of a message to deliver.
     */
    Spider.prototype.sendMessage = function(message) {

        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Spider.prototype.push = function(direction) {
        if(!this.move(direction)) {
            this.play('t+c---c++++c--c');
            this.remove();
        }
    };

    /**
     * Performs an update tick for this Spider instance.
     */
    Spider.prototype.doTick = function() {

        // Get a direction based on our intelligence
        var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random(this.getAttackableDirections());

        // If a direction was decided upon...
        if(direction !== undefined) {

            // Determine any obstacle in our way
            var thing = this.board.getTile(this.point.add(direction));

            // If it's a player, attack it
            if(thing && thing instanceof Player) {
                thing.sendMessage('SHOT');
                this.remove();
                return;
            }

            // Otherwise, if it's a spider web, move in that direction
            else if(thing && thing instanceof SpiderWeb) {
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
    function SpiderWeb(board) {
        Thing.call(this, board);
        this.spriteIndex = undefined;
        this.foreground = jzt.colors.Grey;
        this.background = undefined;
    }
    SpiderWeb.prototype = new Thing();
    SpiderWeb.prototype.constructor = SpiderWeb;
    SpiderWeb.lineMap = {
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
    SpiderWeb.prototype.getSpriteIndex = function() {

        if(this.spriteIndex !== undefined && !this.board.game.isEditor) {
            return this.spriteIndex;
        }

        function isLineAdjacent(source, direction) {
            var tile = source.board.getTile(source.point.add(direction));
            return (tile && (tile instanceof SpiderWeb || (tile.under && (tile.under instanceof SpiderWeb))));
        }

        var surroundingPattern = '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.North) ? 'N' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.East) ? 'E' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.South) ? 'S' : '';
        surroundingPattern += isLineAdjacent(this, jzt.Direction.West) ? 'W' : '';

        this.spriteIndex = SpiderWeb.lineMap[surroundingPattern];
        return this.spriteIndex;

    };

    /**
     * Returns whether or not this SpiderWeb is surrenderable to another thing.
     *
     * @param sender Another Thing that is requesting this Thing to surrender
     * @return true if this Thing is willing to surrender its position.
     */
    SpiderWeb.prototype.isSurrenderable = function() {
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
    function SpinningGun(board) {
        UpdateableThing.call(this, board);
        this.intelligence = 5;
        this.firingRate = 5;
        this.spriteIndex = 24;
        this.animationIndex = Math.floor(Math.random()*SpinningGun.animationFrames.length-1);
        this.speed = 2;
    }
    SpinningGun.prototype = new UpdateableThing();
    SpinningGun.prototype.constructor = SpinningGun;
    SpinningGun.animationFrames = [24, 26, 25, 27];

    /**
     * Serializes this SpinningGun instance into a data object.
     *
     * @return A serialized SpinningGun.
     */
    SpinningGun.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.intelligence = this.intelligence;
        result.firingRate = this.firingRate;
        return result;
    };

    /**
     * Deserializes a provided data object to configure this SpinningGun instance.
     *
     * @param data A serialized SpinningGun data object.
     */
    SpinningGun.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.intelligence = jzt.util.getOption(data, 'intelligence', 5);
        this.firingRate = jzt.util.getOption(data, 'firingRate', 5);
    };

    /**
     * Performs a single update tick of this SpinningGun instance.
     */
    SpinningGun.prototype.doTick = function() {

        var me = this;
        function shoot(random) {
            if(Math.floor(Math.random() * 10) <= me.firingRate) {
                var direction = random ? jzt.Direction.random() : me.getPlayerDirection();
                ThingFactory.shoot(me.board, me.point.add(direction), direction);
            }
        }

        if(++this.animationIndex >= SpinningGun.animationFrames.length) {
            this.animationIndex = 0;
        }
        this.spriteIndex = SpinningGun.animationFrames[this.animationIndex];

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
    function Teleporter(board) {
        UpdateableThing.call(this, board);
        this.orientation = jzt.Direction.East;
        this.animationFrame = 2;
        this.speed = 3;
    }
    Teleporter.prototype = new UpdateableThing();
    Teleporter.prototype.constructor = Teleporter;
    Teleporter.animationFrames = {
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
    Teleporter.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        result.orientation = jzt.Direction.getName(this.orientation);
        return result;
    };

    /**
     * Deserializes a provided data object to configure this Teleporter instance.
     *
     * @param data A data object representing a serialized Teleporter.
     */
    Teleporter.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        if(data.orientation) {
            this.orientation = jzt.Direction.fromName(data.orientation);
        }
    };

    /**
     * Performs a single update tick of this Teleporter instance.
     */
    Teleporter.prototype.doTick = function() {
        this.animationFrame++;
        if(this.animationFrame >= Teleporter.animationFrames[jzt.Direction.getName(this.orientation)].length) {
            this.animationFrame = 0;
        }
    };

    /**
     * Retrieves a sprite index used to visually represent this Teleporter instance on 
     * a rendered game Board.
     *
     * @return a sprite index.
     */
    Teleporter.prototype.getSpriteIndex = function() {
        return Teleporter.animationFrames[jzt.Direction.getName(this.orientation)][this.animationFrame];
    };

    /**
     * Attempts to push this Teleporter instance in a given direction. This teleporter, rather than
     * be pushed, may teleport the item being pushed to another location on its owner Board, based
     * on this Teleporter's orientation, and the location and orientation of other Teleporters on the board.
     * 
     * @param direction A direction in which to push this Teleporter.
     */
    Teleporter.prototype.push = function(direction) {

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
                if(thing && thing instanceof Teleporter && thing.orientation === jzt.Direction.opposite(this.orientation)) {

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
     * Text is a Thing that displays a character depending on the locale of the game.
     *
     * @param board An owner board for this Thing.
     */
    function Text(board) {
        Thing.call(this, board);
        this.i18n = {
            en: 0
        };
        this.foreground = jzt.colors.BrightWhite;
        this.background = jzt.colors.Blue;
    }
    Text.prototype = new Thing();
    Text.prototype.constructor = Text;

    /**
     * Serializes this Text into a data object.
     *
     * @return A data object representing a serialized Text.
     */
    Text.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        result.i18n = this.i18n;
        return result;
    };

    /**
     * Deserializes a provided data object to configure this Text instance.
     *
     * @param A data object representing a serialized Text.
     */
    Text.prototype.deserialize = function(data) {

        Thing.prototype.deserialize.call(this, data);
        this.i18n = data.i18n;
        this.foreground = jzt.colors.BrightWhite;

    };

    Text.prototype.getSpriteIndex = function() {

        var result;

        if(this.i18n.hasOwnProperty(jzt.i18n.getLanguage())) {
            result = this.i18n[jzt.i18n.getLanguage()];
        }
        else {
            result = this.i18n[jzt.i18n.DefaultLanguage];
        }

        return result ? result : 0;

    };


    //--------------------------------------------------------------------------------

    /**
     * ThrowingStar is an UpdateableThing representing a projectile that seeks the player
     * continually with a spinning animation until its time to live has expired and it
     * is removed from its owner Board.
     *
     * @param board An owner board for this ThrowingStar.
     */
    function ThrowingStar(board) {
        UpdateableThing.call(this, board);
        this.speed = 1;
        this.spriteIndex = 179;
        this.animationIndex = Math.floor(Math.random()*ThrowingStar.animationFrames.length-1);
        this.foreground = jzt.colors.Cycle;
        this.timeToLive = 255;
        this.nextMove = Math.floor(Math.random()*2);
    }
    ThrowingStar.prototype = new UpdateableThing();
    ThrowingStar.prototype.constructor = ThrowingStar;
    ThrowingStar.animationFrames = [179, 47, 196, 92];

    /**
     * Serializes this ThrowingStar into a data object.
     *
     * @return A data object representing a serialized ThrowingStar.
     */
    ThrowingStar.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.timeToLive = this.timeToLive;
        return result;
    };

    /**
     * Deserializes a provided data object to configure this ThrowingStar instance.
     *
     * @param A data object representing a serialized ThrowingStar.
     */
    ThrowingStar.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize.call(this, data);
        this.foreground = jzt.colors.Cycle;
        this.background = undefined;
        this.timeToLove = jzt.util.getOption(data, 'timeToLive', 100);
    };

    /**
     * Sends a provided message to this ThrowingStar instance.
     *
     * @param message A message to send to this ThrowingStar.
     */
    ThrowingStar.prototype.sendMessage = function(message)  {
        if(message === 'TOUCH') {
            this.board.player.sendMessage('SHOT');
            this.remove();
        }
    };

    /**
     * Performs a single update tick of this ThrowingStar instance.
     */
    ThrowingStar.prototype.doTick = function() {

        if(--this.timeToLive <= 0) {
            this.remove();
            return;
        }

        if(++this.animationIndex >= ThrowingStar.animationFrames.length) {
            this.animationIndex = 0;
        }
        this.spriteIndex = ThrowingStar.animationFrames[this.animationIndex];

        if(--this.nextMove <= 0) {

            this.nextMove = 2;

            var direction = this.getPlayerDirection();
            var thing = this.board.getTile(this.point.add(direction));
            if(thing instanceof BreakableWall || thing instanceof Player) {
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
    function Tiger(board) {
        UpdateableThing.call(this, board);
        this.spriteIndex = 227;
        this.foreground = jzt.colors.BrightCyan;
        this.background = undefined;
        this.intelligence = 5;
        this.firingRate = 5;
        this.speed = 2;
        this.conveyable = true;
    }
    Tiger.prototype = new UpdateableThing();
    Tiger.prototype.constructor = Tiger;

    /**
     * Serializes this Tiger into a data object.
     *
     * @return A data object representing a serialized Tiger.
     */
    Tiger.prototype.serialize = function() {
        var result = UpdateableThing.prototype.serialize.call(this);
        delete result.color;
        result.intelligence = this.intelligence;
        result.firingRate = this.firingRate;
        return result;
    };

    /**
     * Deserializes a provided data object to configure this Tiger instance.
     * 
     * @param data A data object representing a serialized Tiger.
     */
    Tiger.prototype.deserialize = function(data) {
        UpdateableThing.prototype.deserialize(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.BrightCyan;
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
    Tiger.prototype.sendMessage = function(message) {

        if(message === 'SHOT' || message === 'BOMBED') {
            this.play('t+c---c++++c--c', true);
            this.adjustCounter('SCORE', 10);
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
    Tiger.prototype.push = function(direction, pusher) {

        if(pusher instanceof River) {
            this.move(direction, true);
        }

        else if(!this.move(direction)) {
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
    Tiger.prototype.seekPlayer = function() {

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
    Tiger.prototype.shootPlayer = function() {
        var randomValue = Math.floor(Math.random()*20);
        return randomValue <= this.firingRate;
    };

    /**
     * Performs a single update tick of this Tiger.
     */
    Tiger.prototype.doTick = function() {

        var direction = this.seekPlayer() ? this.getPlayerDirection() : jzt.Direction.random();

        var thing = this.board.getTile(this.point.add(direction));
        if(thing && thing instanceof Player) {
            thing.sendMessage('SHOT');
            this.remove();
            return;
        }

        // Don't attempt to move in the direction of a river
        else if(!(thing && thing instanceof River && thing.direction === jzt.Direction.opposite(direction))) {
            this.move(direction, true);
        }

        if(this.shootPlayer()) {
            var playerDirection = this.getPlayerDirection();
            ThingFactory.shoot(this.board, this.point.add(playerDirection), playerDirection);
        }

    };

    //--------------------------------------------------------------------------------

    /*
     *
     */
    function Torch(board) {
        Thing.call(this, board);
        this.spriteIndex = 157;
        this.glow = true;
    }
    Torch.prototype = new Thing();
    Torch.prototype.constructor = Torch;

    Torch.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    Torch.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = undefined;
        this.foreground = jzt.colors.Brown;
    };

    /**
     * Pushes this Torch in a provided direction on its owner Board.
     * 
     * @param direction A direction in which to push this Torch
     */
    Torch.prototype.push = function(direction) {
        this.move(direction);
    };

    /**
     * Sends a provided message to this Torch instance. If a TOUCH message is received
     * then this Torch instance will be removed and increase the Game's 'torches' counter
     * by five units.
     */
    Torch.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.oneTimeMessage('status.torch');
            this.play('tcase');
            this.adjustCounter('TORCHES', 1);
            this.remove();
        }
    };

    //--------------------------------------------------------------------------------

    /*
     * Wall is a Thing representing an immoveable obstacle.
     *
     * @param board An owner board for this Wall.
     */
    function Wall(board) {
        Thing.call(this, board);
        this.spriteIndex = 178;
    }
    Wall.prototype = new Thing();
    Wall.prototype.constructor = Wall;

    //--------------------------------------------------------------------------------

    /*
     * Water is a Thing representing an obstacle to most Things, except for
     * bullets and other potentially flying Things, which can pass over it.
     */
    function Water(board) {
        Thing.call(this, board);
        this.spriteIndex = 176;
        this.background = jzt.colors.BrightWhite;
        this.foreground = jzt.colors.BrightBlue;
    }
    Water.prototype = new Thing();
    Water.prototype.constructor = Water;

    Water.prototype.serialize = function() {
        var result = Thing.prototype.serialize.call(this);
        delete result.color;
        return result;
    };

    Water.prototype.deserialize = function(data) {
        Thing.prototype.deserialize.call(this, data);
        this.background = jzt.colors.BrightWhite;
        this.foreground = jzt.colors.BrightBlue;
    };

    /**
     * Returns whether or not this Water is surrenderable to a provided
     * sender. Water will return true if the sender is a bullet or ThrowingStar,
     * but false otherwise.
     */
    Water.prototype.isSurrenderable = function(sender) {
        if(sender instanceof Bullet || sender instanceof ThrowingStar) {
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
    Water.prototype.sendMessage = function(message) {
        if(message === 'TOUCH') {
            this.play('t+c+c');
            this.board.setDisplayMessage(jzt.i18n.getMessage('obstacles.water'), 1);
        }
    };

    /*==================================================================================
     * THING FACTORY
     *=================================================================================*/

    /**
     * Creates a new Thing based on provided serialized data, and assigns it to a given board.
     * 
     * @param data Serialized data to turn into a Thing
     * @param board A board which should own the created Thing.
     */
    ThingFactory.deserialize = function(data, board) {

        if(data && data.type) {

            var thingMap = ThingFactory.getThingMap();

            var ThingFunction = thingMap[data.type.toUpperCase()];
            if(ThingFunction) {
                var result = new ThingFunction(board);
                result.deserialize(data);
                return result;
            }

        }

    };

    /**
     * Tests if a provided name corresponds to a known thing that is capable of being deserialized.
     *
     * @param thingName A name of a thing
     * @return true if a Thing of a given name exists, false otherwise
     */
    ThingFactory.isKnownThing = function(thingName) {

        var thingMap = ThingFactory.getThingMap();

        return (thingMap[thingName.toUpperCase()] !== undefined);

    };

    /**
     * Lazily fetches a map of Things that have declared themself as serializeable .
     *
     * @return A map of Thing functions indexed by their symbols or serialization types.
     */
    ThingFactory.getThingMap = function() {
        
        var thing;

        // If we haven't yet constructed our thing map...
        if(ThingFactory.thingMap === undefined) {

            // Create a new thing map
            ThingFactory.thingMap = {};

            // For each thing defined in this module...
            for(thing in my) {
                
                // If it's a thing (but not Thing) whose constructor has been defined as itself...
                if(my.hasOwnProperty(thing) && my[thing].prototype && my[thing].prototype.constructor === my[thing]) {

                    // Add it to our thing map by its uppercase name
                    ThingFactory.thingMap[my[thing].prototype.constructor.name.toUpperCase()] = my[thing];

                }
            }
        }

        return ThingFactory.thingMap;

    };


    /**
     * Creates a new Bullet Thing on a provided board at a given point, oriented in
     * a provided direction. If the provided point is blocked by another UpdateableThing,
     * then that UpdateableThing will be sent a 'SHOT' message.
     */
    ThingFactory.shoot = function(board, point, direction, fromPlayer, throwingStar) {

        // First, get our destination tile
        var tile = board.getTile(point);

        // Create a bullet
        var bullet = throwingStar ? new ThrowingStar(board) : new Bullet(board);

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

        // Otherwise, if the bullet is from the player and the tile is a Ricochet, shoot the messenger
        else if(fromPlayer && tile instanceof Ricochet) {
            board.player.sendMessage('SHOT');
        }

        // Otherwise, if the bullet is from the player, or the tile is a Player or Scriptable
        else if(fromPlayer ||
            tile instanceof Player || tile instanceof Scriptable || tile instanceof BreakableWall) {
            if(fromPlayer) {
                board.game.resources.audio.play('t+c-c-c');
            }
            tile.sendMessage('SHOT');
        }

    };
    
    my.Thing = Thing;
    my.UpdateableThing = UpdateableThing;
    my.Scriptable = Scriptable;
    my.ActiveBomb = ActiveBomb;
    my.Ammo = Ammo;
    my.Bear = Bear;
    my.Blinker = Blinker;
    my.BlinkWall = BlinkWall;
    my.Bomb = Bomb;
    my.Boulder = Boulder;
    my.BreakableWall = BreakableWall;
    my.Bullet = Bullet;
    my.Centipede = Centipede;
    my.Conveyor = Conveyor;
    my.Door = Door;
    my.Duplicator = Duplicator;
    my.Explosion = Explosion;
    my.FakeWall = FakeWall;
    my.Forest = Forest;
    my.Gem = Gem;
    my.Heart = Heart;
    my.InvisibleWall = InvisibleWall;
    my.Key = Key;
    my.Lava = Lava;
    my.LineWall = LineWall;
    my.Lion = Lion;
    my.Passage = Passage;
    my.Player = Player;
    my.Pusher = Pusher;
    my.Ricochet = Ricochet;
    my.River = River;
    my.Ruffian = Ruffian;
    my.Signpost = Signpost;
    my.SliderEw = SliderEw;
    my.SliderNs = SliderNs;
    my.Snake = Snake;
    my.SolidWall = SolidWall;
    my.Spider = Spider;
    my.SpiderWeb = SpiderWeb;
    my.SpinningGun = SpinningGun;
    my.Teleporter = Teleporter;
    my.Text = Text;
    my.ThrowingStar = ThrowingStar;
    my.Tiger = Tiger;
    my.Torch = Torch;
    my.Wall = Wall;
    my.Water = Water;
    
    my.ThingFactory = ThingFactory;
    
    return my;
    
}(jzt.things || {}));