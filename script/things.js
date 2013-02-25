window.jzt = window.jzt || {};
jzt.things = jzt.things || {};

/*
 * Thing
 */
jzt.things.Thing = function(board) {
    this.name = undefined;
    this.spriteIndex = 63;
    this.board = board;
    this.point = new jzt.Point(0,0);
    this.foreground = jzt.colors.Colors['E'];
    this.background = jzt.colors.Colors['0'];
};

jzt.things.Thing.prototype.loadFromData = function(data) {
    
    this.name = data.name;
    this.spriteIndex = data.spriteIndex || 63;
    this.point.x = data.x || 0;
    this.point.y = data.y || 0;
    
    var backgroundCode = data.color.charAt(0);
    var foregroundCode = data.color.charAt(1);
    
    this.foreground = foregroundCode == '*' ? foregroundCode : jzt.colors.Colors[foregroundCode];
    this.background = jzt.colors.Colors[backgroundCode];
    
};

jzt.things.Thing.prototype.sendMessage = function(messageName) {};

jzt.things.Thing.prototype.isPushable = function(direction) {
    return false;
};

jzt.things.Thing.prototype.move = function(direction) {
    return this.board.moveTile(this.point, this.point.add(direction));
};

/*
 * Updateable Thing
 */
jzt.things.UpdateableThing = function(board) {
    jzt.things.Thing.call(this, board);
    this.setSpeed(10);
};
jzt.things.UpdateableThing.prototype = new jzt.things.Thing();
jzt.things.UpdateableThing.prototype.constructor = jzt.things.UpdateableThing;

jzt.things.UpdateableThing.prototype.loadFromData = function(data) {
    jzt.things.Thing.prototype.loadFromData.call(this, data);
    this.setSpeed(data.speed);
};

jzt.things.UpdateableThing.prototype.setSpeed = function(speed) {
    this.speed = speed;
    this.ticksPerCycle = Math.round(1000 / this.speed);
    this.nextTick = Date.now() + this.ticksPerCycle;
};

jzt.things.UpdateableThing.prototype.move = function(direction) {
    return this.board.moveTile(this.point, this.point.add(direction));
};

jzt.things.UpdateableThing.prototype.getPlayerDirection = function() {
    return this.point.directionTo(this.board.player.point);
};

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

jzt.things.UpdateableThing.prototype.update = function() {
    
};

/*
 * Scriptable Thing
 */
jzt.things.ScriptableThing = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    this.script = undefined;
    this.messageQueue = [];
    this.walkDirection = undefined;
    this.locked = false;
    this.orientation = undefined;
};
jzt.things.ScriptableThing.prototype = new jzt.things.UpdateableThing();
jzt.things.ScriptableThing.prototype.constructor = jzt.things.ScriptableThing;

jzt.things.ScriptableThing.prototype.loadFromData = function(data) {
    jzt.things.UpdateableThing.prototype.loadFromData.call(this, data);
    var scriptData = this.board.getScript(data.script);
    if(scriptData) {
        this.script = new jzt.Script(this, scriptData);
    }
};

jzt.things.ScriptableThing.prototype.sendMessage = function(message) {
    
    // If we are ready to receive a message...
    if(!this.locked) {
    
        // We disallow duplicate messages in a row
        if(this.messageQueue[this.messageQueue.length-1] != message) {
            this.messageQueue.push(message);
        }
        
    }
    
};

jzt.things.ScriptableThing.prototype.move = function(direction) {
    jzt.things.UpdateableThing.prototype.move.call(this, direction);
    this.orientation = direction;
};

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

jzt.things.ScriptableThing.prototype.update = function() {
    
    var now = Date.now();
    
    if(now > this.nextTick) {
        this.walk();
        this.script.executeTick();
        this.nextTick = now + this.ticksPerCycle;
    };
    
};

/*===============================================================
 * BUILT-IN THINGS
 *==============================================================*/
 
/*
 * Boulder
 */
jzt.things.Boulder = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 254;
};
jzt.things.Boulder.prototype = new jzt.things.Thing();
jzt.things.Boulder.prototype.constructor = jzt.things.Boulder;

jzt.things.Boulder.prototype.isPushable = function(direction) {
    return true;
};
 
/*
 * Player
 */ 
jzt.things.Player = function(board) {
    jzt.things.UpdateableThing.call(this, board);
    
    var now = Date.now();
    
    this.name = 'Player';
    this.spriteIndex = 2;
    this.point = new jzt.Point(1,1);
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

jzt.things.Player.prototype.isPushable = function(direction) {
    return true;
};

jzt.things.Player.prototype.move = function(direction) {
    
    var newLocation = this.point.add(direction);
    
    // Inspect the thing we're moving to
    var thing = this.board.getTile(newLocation);
    
    // If there's a tile there, send it a touch message
    if(thing) {
        thing.sendMessage('TOUCH');
    }
    
    // We can move again at the next cycle
    this.nextMove = Date.now() + Math.round(1000 / this.speed);

    return this.board.moveTile(this.point, newLocation);;
    
};

jzt.things.Player.prototype.update = function() {
    
    var now = Date.now();
        
    if(this.torch) {
        this.updateTorch(now);
    }
        
    // We can only move when permissable speed-wise
    if( now > this.nextMove ) {
        
        var k = this.game.keyboard;

        if (k.isPressed(k.UP)) this.move(jzt.Direction.North);
        else if (k.isPressed(k.LEFT)) this.move(jzt.Direction.West);
        else if (k.isPressed(k.DOWN)) this.move(jzt.Direction.South);
        else if (k.isPressed(k.RIGHT)) this.move(jzt.Direction.East);
        
    }
    
};

jzt.things.Player.prototype.useTorch = function() {
    this.torch = true;
    this.torchExpiry = Date.now() + this.TORCH_TTL;
    this.torchStrength = this.MAX_TORCH_STRENGTH;
};

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
        var torchModifier = this.MAX_TORCH_STRENGTH - this._torchStrength;
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

/*
 * Wall
 */ 
jzt.things.Wall = function(board) {
    jzt.things.Thing.call(this, board);
    this.spriteIndex = 178;
};
jzt.things.Wall.prototype = new jzt.things.Thing();
jzt.things.Wall.prototype.constructor = jzt.things.Wall;