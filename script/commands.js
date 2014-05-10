/**
 * JZT Commands
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt = jzt || {};
jzt.commands = (function(my) {
    
    'use strict';
    
    var _constructorError = jzt.ConstructorError;
    
    /**
     * {@code CommandResult} is an object containing definitions of
     * command results. The values are NORMAL, CONTINUE, and REPEAT.
     * NORMAL: Returned when a Command executes normally.
     * CONTINUE: Requests that the next command be executed immediately.
     * REPEAT: Requests that the same command be executed again next cycle.
     */
    var CommandResult = {
        NORMAL: 0,
        CONTINUE: 1,
        CONTINUE_AFTER_JUMP: 2,
        REPEAT: 3
    };

    /**
     * Direction Modifier Enumerated Types
     * 
     * Each direction modifier has an associated token value, a display name, and a process function.
     * The process function takes a direction and returns a final, calculated direction value.
     */
    var DirectionModifier = {
        CW:   {name: 'Clockwise',              process: function(d) {return jzt.Direction.clockwise(d);}},
        CCW:  {name: 'Counter-clockwise',      process: function(d) {return jzt.Direction.counterClockwise(d);}},
        OPP:  {name: 'Opposite',               process: function(d) {return jzt.Direction.opposite(d);}},
        RNDP: {name: 'Perpendicularly Random', process: function(d) {return jzt.Direction.randomPerpendicular(d);}}
    };

    /**
     * Direction Enumerated Types
     *
     * Each direction has an associated token value, a display name, and a process function.
     * The process function takes a JztObject and returns a final, calculated direction value.
     */
    var Direction = {

        SEEK:  {name: 'Toward player',            process: function(o) {return o.getPlayerDirection();}},
        SMART: {name: 'Smart seek',               process: function(o) {return o.getSmartDirection() || o.getPlayerDirection();}},
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
     * Become Command
     */
    function Become() {
        
        if(!(this instanceof Become)) {
            throw _constructorError;
        }
        
        this.thing = undefined;
        this.color = undefined;
    }

    Become.prototype.clone = function() {
        var clone = new Become();
        clone.thing = this.thing;
        clone.color = this.color;
        return clone;
    };

    Become.prototype.execute = function(owner) {

        // Create our new thing
        var data = {type: this.thing, color: jzt.colors.serialize(undefined, this.color)};
        var newThing = jzt.things.ThingFactory.deserialize(data, owner.board);

        // Replace our owner's tile with the new thing
        owner.board.replaceTile(owner.point, newThing);

    };

    /* 
     * Change Command
     */
    function Change() {
        
        if(!(this instanceof Change)) {
            throw _constructorError;
        }
        
        this.targetThing = undefined;
        this.targetColor = undefined;
        this.newThing = undefined;
        this.newColor = undefined;
    }

    Change.prototype.clone = function() {
        var clone = new Change();
        clone.targetThing = this.targetThing;
        clone.targetColor = this.targetColor;
        clone.newThing = this.newThing;
        clone.newColor = this.newColor;
        return clone;
    };

    Change.prototype.execute = function(owner) {

        var data = {type: this.newThing, color: jzt.colors.serialize(undefined, this.newColor)};
        var newThing = this.newThing === 'EMPTY' ? undefined : jzt.things.ThingFactory.deserialize(data, owner.board);

        /* If no new color was specified, take the unusual step of explicitly
         * Removing the default color from the cloned thing. The changeTiles
         * method will interpret this as inheriting the color from its target.
         */
        if(newThing && !this.newColor) {
            newThing.foreground = undefined;
        }

        owner.board.changeTiles(this.targetThing, this.targetColor, newThing);

        return CommandResult.CONTINUE;

    };

    /*
     * Char Command
     */
    function Char() {
        
        if(!(this instanceof Char)) {
            throw _constructorError;
        }
        
        this.character = undefined;
    }

    Char.prototype.clone = function() {
        var clone = new Char();
        clone.character = this.character;
        return clone;
    };

    Char.prototype.execute = function(owner) {
        owner.spriteIndex = this.character;
    };

    /*
     * Collect Command
     */
    function Collect() {}
    Collect.prototype.clone = function() {return this;};

    Collect.prototype.execute = function(owner) {
        var ownerPosition = owner.point;
        var playerPosition = owner.board.player.point;
        owner.remove();
        owner.board.moveTile(playerPosition, ownerPosition);
    };

    /*
     * Die Command
     */
    function Die() {}
    Die.prototype.clone = function() {return this;};

    Die.prototype.execute = function(owner) {
        owner.remove();
    };

    /*
     * Not Expression
     */
    function NotExpression() {
        
        if(!(this instanceof NotExpression)) {
            throw _constructorError;
        }
        
        this.expression = undefined;
    }

    NotExpression.prototype.clone = function() {
        var clone = new NotExpression();
        clone.expression = this.expression.clone();
        return clone;
    };

    NotExpression.prototype.getResult = function(owner) {
        return ! this.expression.getResult(owner);
    };

    /*
     * Directional Flag Expression
     */
    function DirectionalFlagExpression() {
        this.flagType = undefined;
        this.directionExpression = undefined;
    }

    DirectionalFlagExpression.prototype.clone = function() {
        var clone = new DirectionalFlagExpression();
        clone.flagType = this.flagType;
        clone.directionExpression = this.directionExpression ? this.directionExpression.clone() : undefined;
        return clone;
    };

    DirectionalFlagExpression.prototype.getResult = function(owner) {
        if(this.flagType === 'BLOCKED') {
            return owner.isBlocked(this.directionExpression.getResult(owner));
        }
        else if(this.flagType === 'ALIGNED') {
            return this.directionExpression ? owner.isPlayerAligned(1, this.directionExpression.getResult(owner)) : owner.isPlayerAligned(1);
        }
        else if(this.flagType === 'ADJACENT') {
            return owner.isPlayerAdjacent(this.directionExpression.getResult(owner));
        }
    };

    /*
     * Comparison Expression
     */
    function ComparisonExpression() {
        
        if(!(this instanceof ComparisonExpression)) {
            throw _constructorError;
        }
        
        this.counter = undefined;
        this.numericValue = 0;
        this.operator = 'eq';
    }

    ComparisonExpression.prototype.clone = function() {
        var clone = new ComparisonExpression();
        clone.counter = this.counter;
        clone.numericValue = this.numericValue;
        clone.operator = this.operator;
        return clone;
    };

    ComparisonExpression.prototype.getResult = function(owner) {

        // Get our counter value
        var counterValue = owner.getCounterValue(this.counter);

        switch(this.operator) {
            case 'GT':
                return counterValue > this.numericValue;
            case 'LT':
                return counterValue < this.numericValue;
            case 'GTE':
                return counterValue >= this.numericValue;
            case 'LTE':
                return counterValue <= this.numericValue;
            case 'EQ':
                return counterValue === this.numericValue;
        }

        return undefined;

    };

    /*
     * Direction Expression
     */
    function DirectionExpression() {
        
        if(!(this instanceof DirectionExpression)) {
            throw _constructorError;
        }
        
        this.modifiers = [];
        this.direction = undefined;
    }

    DirectionExpression.prototype.clone = function() {
        var clone = new DirectionExpression();
        clone.modifiers = this.modifiers.slice(0);
        clone.direction = this.direction;
        return clone;
    };

    DirectionExpression.prototype.getResult = function(owner) {

        // Get our direction from our expression
        var direction = this.direction.process(owner);

        // Evaluate our modifiers into a direction
        var modifiers = this.modifiers.slice(0);
        while(modifiers.length) {
            direction = modifiers.pop().process(direction);
        }

        // Return our result
        return direction;

    };

    /*
     * Peep Expression
     */
    function PeepExpression() {
        if(!(this instanceof PeepExpression)) {
            throw _constructorError;
        }
        this.distance = Infinity;
    }

    PeepExpression.prototype.clone = function() {
        var clone = new PeepExpression();
        clone.distance = this.distance;
        return clone;
    };

    PeepExpression.prototype.getResult = function(owner) {
        return owner.isPlayerVisible(this.distance);
    };

    /*
     * Exists Expression
     */
    function ExistsExpression() {
        
        if(!(this instanceof ExistsExpression)) {
            throw _constructorError;
        }
        
        this.count = 0;
        this.color = undefined;
        this.thing = undefined;
    }

    ExistsExpression.prototype.clone = function() {
        var clone = new ExistsExpression();
        clone.count = this.count;
        clone.color = this.color;
        clone.thing = this.thing;
        return clone;
    };

    ExistsExpression.prototype.getResult = function(owner) {

        return owner.board.hasTile(this.thing, this.color, this.count);

    };

    /*
     * End Command
     */
    function End() {}
    End.prototype.clone = function() {return this;};

    End.prototype.execute = function(owner) {
        owner.scriptContext.stop();
    };

    /*
     * Give Command
     */
    function Give() {
        if(!(this instanceof Give)) {
            throw _constructorError;
        }
        this.counter = undefined;
        this.amount = 0;
    }

    Give.prototype.clone = function() {
        var clone = new Give();
        clone.counter = this.counter;
        clone.amount = this.amount;
        return clone;
    };

    Give.prototype.execute = function(owner) {
        owner.board.game.adjustCounter(this.counter, this.amount);
        return CommandResult.CONTINUE;
    };

    /*
     * Go Command
     */
    function Go() {
        if(!(this instanceof Go)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
        this.count = 1;
    }

    Go.prototype.clone = function() {
        var clone = new Go();
        clone.directionExpression = this.directionExpression.clone();
        clone.count = this.count;
        return clone;
    };

    Go.prototype.execute = function(owner) {

        if(!owner.scriptContext.heap.count) {
            owner.scriptContext.heap.count = this.count;
        }

        // Get our direction from our expression
        var direction = this.directionExpression.getResult(owner);

        // If a direction is available
        if(direction) {

            owner.move(direction);

            // If we are to go a number of times...
            if(--owner.scriptContext.heap.count > 0) {
                return CommandResult.REPEAT;
            }
            else {
                delete owner.scriptContext.heap.count;
            }

        }

    };

    /*
     * If
     */
    function If() {
        if(!(this instanceof If)) {
            throw _constructorError;
        }
        this.label = undefined;
        this.expression = undefined;
    }

    If.prototype.clone = function() {
        var clone = new If();
        clone.label = this.label;
        clone.expression = this.expression.clone();
        return clone;
    };

    If.prototype.execute = function(owner) {

        if(this.expression.getResult(owner)) {
            owner.scriptContext.jumpToLabel(this.label);
            return CommandResult.CONTINUE_AFTER_JUMP;
        }

        return CommandResult.CONTINUE;

    };

    /*
     * Label
     */
    function Label() {
        if(!(this instanceof Label)) {
            throw _constructorError;
        }
        this.id = undefined;
        this.indicies = [];
        this.currentIndex = -1;
    }

    Label.prototype.clone = function() {
        var clone = new Label();
        clone.id = this.id;
        clone.indicies = this.indicies.slice(0);
        clone.currentIndex = this.currentIndex;
        return clone;
    };

    /*
     * Lock Command
     */
    function Lock() {}
    Lock.prototype.clone = function(){return this;};
    Lock.prototype.execute = function(owner) {
        owner.locked = true;
        return CommandResult.CONTINUE;
    };

    /*
     * Move Command
     */
    function Move() {
        if(!(this instanceof Move)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
        this.count = 1;
    }

    Move.prototype.clone = function() {
        var clone = new Move();
        clone.directionExpression = this.directionExpression.clone();
        clone.count = this.count;
        return clone;
    };

    Move.prototype.execute = function(owner) {

        var direction;

        if(!owner.scriptContext.heap.count) {
            owner.scriptContext.heap.count = this.count;
        }

        // If we aren't stuck, calculate our next direction
        if(!owner.scriptContext.heap.stuck) {

            direction = this.directionExpression.getResult(owner);

        }

        // If we are stuck, we will continue trying that direction
        else {
            direction = jzt.Direction.fromName(owner.scriptContext.heap.stuck);
        }

        // If a direction is available
        if(direction) {

            var success = owner.move(direction);

            // If we were not successful, we're stuck
            if(!success) {

                owner.scriptContext.heap.stuck = jzt.Direction.getShortName(direction);

                // We will try again until we're free
                return CommandResult.REPEAT;

            }

            // If we are to move a number of times...
            else if(--owner.scriptContext.heap.count > 0) {
                delete owner.scriptContext.heap.stuck;
                return CommandResult.REPEAT;
            }
            else {
                delete owner.scriptContext.heap.count;
                delete owner.scriptContext.heap.stuck;
            }

        }

    };

    /*
     * Play Command
     */
    function Play() {
        if(!(this instanceof Play)) {
            throw _constructorError;
        }
        this.song = undefined;
    }

    Play.prototype.clone = function() {
        var clone = new Play();
        clone.song = this.song;
        return clone;
    };

    Play.prototype.execute = function(owner) {
        owner.play(this.song, true);
        return CommandResult.CONTINUE;
    };

    /* 
     * Put Command
     */
    function Put() {
        if(!(this instanceof Put)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
        this.color = undefined;
        this.thing = undefined;
    }

    Put.prototype.clone = function() {
        var clone = new Put();
        clone.directionExpression = this.directionExpression.clone();
        clone.color = this.color;
        clone.thing = this.thing;
        return clone;
    };

    Put.prototype.execute = function(owner) {

        var data;
        var newThing;

        // Get our direction from our expression
        var direction = this.directionExpression.getResult(owner);

        // Get the point to which to add our new thing
        var point = owner.point.add(direction);

        var obstacle;
        var isFreeSpace;

        // If our point is off the board, return immediately
        if(owner.board.isOutside(point)) {
            return;
        }

        // If we're clearing a spot
        if(!this.thing) {

            obstacle = owner.board.getTile(point);

            if(!(obstacle instanceof jzt.things.Player)) {
                owner.board.deleteTile(point);
            }
        }

        // Otherwise, if we're putting a THING...
        else {

            // Get the tile in the way, if applicable
            obstacle = owner.board.getTile(point);

            // Determine if there is free space, or if we can make some by pushing an obstacle
            isFreeSpace = obstacle ? owner.board.moveTile(owner.point, point, false, true) : true;

            // If there is free space
            if(isFreeSpace) {

                // Create our new thing
                data = {type: this.thing, color: jzt.colors.serialize(undefined, this.color)};
                newThing = jzt.things.ThingFactory.deserialize(data, owner.board);

                owner.board.addThing(point, newThing);

            }
        }

    };

    /*
     * Restore Command
     */
    function Restore() {
        if(!(this instanceof Restore)) {
            throw _constructorError;
        }
        this.label = undefined;
    }

    Restore.prototype.clone = function() {
        var clone = new Restore();
        clone.label = this.label;
        return clone;
    };

    Restore.prototype.execute = function(owner) {
        owner.scriptContext.restoreLabel(this.label);
        return CommandResult.CONTINUE;
    };

    /*
     * Say Command
     */
    function Say() {
        if(!(this instanceof Say)) {
            throw _constructorError;
        }
        this.text = undefined;
    }

    Say.prototype.clone = function() {
        var clone = new Say();
        clone.text = this.text;
        return clone;
    };

    Say.prototype.execute = function(owner) {
        var message = jzt.i18n.getBoardMessage(owner.board, this.text);
        owner.board.setDisplayMessage(message);
        return CommandResult.CONTINUE;
    };

    /*
     * Scroll Command
     */
    function Scroll() {
        if(!(this instanceof Scroll)) {
            throw _constructorError;
        }
        this.text = undefined;
        this.label = undefined;
        this.modifiesScroll = true;
    }

    Scroll.prototype.clone = function() {
        var clone = new Scroll();
        clone.text = this.text;
        clone.label = this.label;
        return clone;
    };

    Scroll.prototype.execute = function(owner) {
        var message = jzt.i18n.getBoardMessage(owner.board, this.text);
        owner.scriptContext.addScrollContent(message, false, this.label);
        return CommandResult.CONTINUE;
    };

    /*
     * ScrollC Command
     */
    function ScrollC() {
        if(!(this instanceof ScrollC)) {
            throw _constructorError;
        }
        this.text = undefined;
        this.modifiesScroll = true;
    }

    ScrollC.prototype.clone = function() {
        var clone = new ScrollC();
        clone.text = this.text;
        return clone;
    };

    ScrollC.prototype.execute = function(owner) {
        var message = jzt.i18n.getBoardMessage(owner.board, this.text);
        owner.scriptContext.addScrollContent(message, true);
        return CommandResult.CONTINUE;
    };

    /*
     * Send Command
     */
    function Send() {
        if(!(this instanceof Send)) {
            throw _constructorError;
        }
        this.message = undefined;
        this.recipient = undefined;
    }

    Send.prototype.clone = function() {
        var clone = new Send();
        clone.message = this.message;
        clone.recipient = this.recipient;
        return clone;
    };

    Send.prototype.execute = function(owner) {

        var recipients;
        var index;

        if(this.recipient === undefined) {
            owner.scriptContext.jumpToLabel(this.message);
            return CommandResult.CONTINUE_AFTER_JUMP;
        }
        else if(this.recipient === 'all') {
            recipients = owner.board.getScripables();
        }
        else {
            recipients = owner.board.getScriptables(this.recipient);
        }

        for(index = 0; index < recipients.length; ++index) {
            recipients[index].sendMessage(this.message);
        }

        return CommandResult.CONTINUE;

    };

    /*
     * Set Command
     */
    function Set() {
        
        if(!(this instanceof Set)) {
            throw _constructorError;
        }
        
        this.counter = undefined;
        this.value = 1;
    }

    Set.prototype.clone = function() {
        var clone = new Set();
        clone.counter = this.counter;
        clone.value = this.value;
        return clone;
    };

    Set.prototype.execute = function(owner) {

        owner.board.game.setCounterValue(this.counter, this.value);

    };

    /*
     * Shoot Command
     */
    function Shoot() {
        if(!(this instanceof Shoot)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
    }

    Shoot.prototype.clone = function() {
        var clone = new Shoot();
        clone.directionExpression = this.directionExpression.clone();
        return clone;
    };

    Shoot.prototype.execute = function(owner) {

        // Get our final direction
        var direction = this.directionExpression.getResult(owner);

        // If a direction is available
        if(direction) {

            // Play a shooting noise
            owner.play('c-f#');

            // Shoot
            jzt.things.ThingFactory.shoot(owner.board, owner.point.add(direction), direction, false);

        }

    };

    /*
     * Stand Command
     */
    function Stand() {}
    Stand.prototype.clone = function(){return this;};
    Stand.prototype.execute = function(owner) {
        owner.walkDirection = undefined;
    };

    /*
     * Take Command
     */
    function Take() {
        if(!(this instanceof Take)) {
            throw _constructorError;
        }
        this.amount = 0;
        this.label = undefined;
        this.counter = undefined;
    }

    Take.prototype.clone = function() {
        var clone = new Take();
        clone.amount = this.amount;
        clone.label = this.label;
        clone.counter = this.counter;
        return clone;
    };

    Take.prototype.execute = function(owner) {

        // If we can't take an amount...
        if(owner.board.game.getCounterValue(this.counter) < this.amount) {

            // If we have a label, jump to it
            if(this.label) {
                owner.scriptContext.jumpToLabel(this.label);
                return CommandResult.CONTINUE_AFTER_JUMP;
            }

        }

        // If there is enough of the counter to take...
        else {

            // Take that amount
            owner.board.game.adjustCounter(this.counter, -1 * this.amount);
            return CommandResult.CONTINUE;

        }

    };

    /*
     * Throwstar Command
     */
    function ThrowStar() {
        if(!(this instanceof ThrowStar)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
    }

    ThrowStar.prototype.clone = function() {
        var clone = new ThrowStar();
        clone.directionExpression = this.directionExpression.clone();
        return clone;
    };

    ThrowStar.prototype.execute = function(owner) {

        // Get our final direction
        var direction = this.directionExpression.getResult(owner);

        // If a direction is available
        if(direction) {

            // Shoot
            jzt.things.ThingFactory.shoot(owner.board, owner.point.add(direction), direction, false, true);

        }

    };

    /*
     * Torch Command
     */
    function Torch() {
        if(!(this instanceof Torch)) {
            throw _constructorError;
        }
        this.radius = 0;
    }

    Torch.prototype.clone = function() {
        var clone = new Torch();
        clone.radius = this.radius;
        return clone;
    };
    Torch.prototype.execute = function(owner) {
        owner.setTorchRadius(this.radius);
    };

    /*
     * Try Command
     */
    function Try() {
        if(!(this instanceof Try)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
        this.label = undefined;
    }

    Try.prototype.clone = function() {
        var clone = new Try();
        clone.directionExpression = this.directionExpression.clone();
        clone.label = this.label;
        return clone;
    };

    Try.prototype.execute = function(owner) {
        var direction = this.directionExpression.getResult(owner);
        if(! owner.move(direction)) {
            owner.scriptContext.jumpToLabel(this.label);
            return CommandResult.CONTINUE_AFTER_JUMP;
        }
        return CommandResult.CONTINUE;
    };

    /*
     * Unlock Command
     */
    function Unlock() {}
    Unlock.prototype.clone = function(){return this;};
    Unlock.prototype.execute = function(owner) {
        owner.locked = false;
        return CommandResult.CONTINUE;
    };

    /**
     * Wait Command
     */
    function Wait() {
        if(!(this instanceof Wait)) {
            throw _constructorError;
        }
        this.cycles = 1;
    }

    Wait.prototype.clone = function() {
        var clone = new Wait();
        clone.cycles = this.cycles;
        return clone;
    };

    Wait.prototype.execute = function(owner) {

        if(!owner.scriptContext.heap.cycles) {
            owner.scriptContext.heap.cycles = this.cycles;
        }

        if(--owner.scriptContext.heap.cycles > 0) {
            return CommandResult.REPEAT;
        }
        else {
            delete owner.scriptContext.heap.cycles;
        }
    };

    /*
     * Walk Command
     */
    function Walk() {
        if(!(this instanceof Walk)) {
            throw _constructorError;
        }
        this.directionExpression = undefined;
    }

    Walk.prototype.clone = function() {
        var clone = new Walk();
        clone.directionExpression = this.directionExpression.clone();
        return clone;
    };

    Walk.prototype.execute = function(owner) {
        var direction = this.directionExpression.getResult(owner);
        owner.walkDirection = direction;
    };

    /*
     * Zap Command
     */
    function Zap() {
        if(!(this instanceof Zap)) {
            throw _constructorError;
        }
        this.label = undefined;
    }

    Zap.prototype.clone = function() {
        var clone = new Zap();
        clone.label = this.label;
        return clone;
    };

    Zap.prototype.execute = function(owner) {
        owner.scriptContext.zapLabel(this.label);
        return CommandResult.CONTINUE;
    };
    
    my.CommandResult = CommandResult;
    my.DirectionModifier = DirectionModifier;
    my.Direction = Direction;
    my.Become = Become;
    my.Change = Change;
    my.Char = Char;
    my.Collect = Collect;
    my.Die = Die;
    my.NotExpression = NotExpression;
    my.DirectionalFlagExpression = DirectionalFlagExpression;
    my.ComparisonExpression = ComparisonExpression;
    my.DirectionExpression = DirectionExpression;
    my.PeepExpression = PeepExpression;
    my.ExistsExpression = ExistsExpression;
    my.End = End;
    my.Give = Give;
    my.Go = Go;
    my.If = If;
    my.Label = Label;
    my.Lock = Lock;
    my.Move = Move;
    my.Play = Play;
    my.Put = Put;
    my.Restore = Restore;
    my.Say = Say;
    my.Scroll = Scroll;
    my.ScrollC = ScrollC;
    my.Send = Send;
    my.Set = Set;
    my.Shoot = Shoot;
    my.Stand = Stand;
    my.Take = Take;
    my.ThrowStar = ThrowStar;
    my.Torch = Torch;
    my.Try = Try;
    my.Unlock = Unlock;
    my.Wait = Wait;
    my.Walk = Walk;
    my.Zap = Zap;
    return my;
    
}(jzt.commands || {}));