window.jzt = window.jzt || {};

jzt.JztObject = function(objectData) {

    this.name = objectData.name || undefined;
    this.spriteIndex = objectData.spriteIndex || 63;
    this.scriptName = objectData.script;
    this.setSpeed(objectData.speed);
    this.pushable = objectData.pushable || undefined;
    this.walkDirection = undefined;
    this.locked = false;
    
    this.point = new jzt.Point(objectData.x || -1, objectData.y || -1);
    
    this.foregroundColor = objectData.foregroundColor || '#ffff00';
    this.backgroundColor = objectData.backgroundColor || '#000000';
    
};
    
jzt.JztObject.prototype.setOwnerBoard = function(board) {
    this.board = board;
};
    
jzt.JztObject.prototype.playerDirection = function() {
    if(this.board) {
        return this.point.directionTo(this.board.player.point);
    }
};

jzt.JztObject.prototype.getFreeDirections = function() {
    
    var result = [];
    var instance = this;
    
    jzt.Direction.each(function(direction) {
        if(!instance.isBlocked(direction)) {
            result.push(direction);
        }
    });
    
    return result;

};

jzt.JztObject.prototype.getBlockedDirections = function() {
  
    var result = [];
    var instance = this;
    
    jzt.Direction.each(function(direction) {
       if(instance.isBlocked(direction)) {
           result.push(direction);
       }
    });
    
    return result;
 
};
    
jzt.JztObject.prototype.hasScript = function() {
    return this.script != undefined;
};

jzt.JztObject.prototype.stopScript = function() {
    if(this.hasScript()) {
        this.script.stop();
    }
};
    
jzt.JztObject.prototype.isWillingToMove = function(direction) {
    if(this.pushable) {
        return true;
    }
};

jzt.JztObject.prototype.isBlocked = function(direction) {
    
    if(this.board) {
        return !this.board.isPassable(this.point.add(direction));
    }
    
};

jzt.JztObject.prototype.setLocked = function(locked) {
    this.locked = locked;
};
    
jzt.JztObject.prototype.move = function(direction) {
    if(this.board) {
        this.orientation = direction;
        return this.board.moveTile(this.point, this.point.add(direction));
    }
};
    
jzt.JztObject.prototype.addMessage = function(message) {
    if(this.hasScript() && !this.locked) {

        // We disallow duplicate messages in a row
        if(this._messageQueue[this._messageQueue.length-1] != message) {
            this._messageQueue.push(message);
        }

    }
};

jzt.JztObject.prototype.hasMessage = function() {
    return this._messageQueue.length > 0;
}

jzt.JztObject.prototype.getMessage = function() {
    return this._messageQueue.shift();
}
    
jzt.JztObject.prototype.setScriptData = function(scriptData) {
    
    if(scriptData && scriptData.lines && scriptData.name) {
        this.script = new jzt.Script(this, scriptData);
        this._messageQueue = [];
        this._nextTick = Date.now();
    }
    
};

jzt.JztObject.prototype.die = function() {
    this.isDead = true;
};
    
jzt.JztObject.prototype.setSpeed = function(speed) {
    speed = speed ? speed : 10;
    this._ticksPerCycle = 1000 / speed;
};
    
jzt.JztObject.prototype.walk = function() {
    if(this.walkDirection) {
        
        if(this.isBlocked(this.walkDirection)) {
            this.addMessage('THUD');
        }
        else {
            jzt.debug.log('%s is walking %s', this.name, jzt.Direction.getName(this.walkDirection));
            this.move(this.walkDirection);
        }
    }
};
    
jzt.JztObject.prototype.update = function() {
        
    if(this.hasScript() && this._ticksPerCycle && Date.now() > this._nextTick) {
            
        this.walk();
        this.script.executeTick();
        this._nextTick = Date.now() + this._ticksPerCycle;
            
    }
        
};