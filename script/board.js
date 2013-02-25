window.jzt = window.jzt || {};

jzt.Board = function(boardData, game) {

    this.boardData = boardData;
    this.game = game;
    this.width = boardData.width;
    this.height = boardData.height;
    this.messages = [];
    this.tiles = new Array(this.width * this.height);
    this.scripts = boardData.scripts;
    this.updateableThings = [];
    this.dark = boardData.dark;
    
    this._displayMessage = undefined;
    this._displayMessageTick = 0;
    this.DISPLAY_MESSAGE_TTL = game.CPS * 3; // 3 seconds
    this.DARK_SPRITE = game.resources.graphics.getSprite(176);
    this.DARK_SPRITE_COLOR = '08';
    
    this.initializeTiles(boardData.tiles);
    this.initializeScriptableThings(boardData.scriptables);
    this.initializePlayer(game.player);
    
};

jzt.Board.prototype.initializePlayer = function(player) {
    this.player = player;
    this.setTile(player.point, player);
}

/*
 * Intializes tile data given a collection of serialized tiles.
 */
jzt.Board.prototype.initializeTiles = function(tileDataCollection) {
    
    for(var row = 0; row < this.height; ++row) {
        
        var rowString = tileDataCollection[row];
        
        for(var column = 0; column < this.width; ++column) {
            
            var thing;
            
            switch(rowString.charAt(column)) {
                case '#':
                    thing = new jzt.things.Wall(this);
                    break;
                case '@':
                    thing = new jzt.things.Boulder(this);
                    break;
                case ' ':
                    thing = undefined;
                    break;
            }
            
            if(thing) {
                thing.board = this;
                this.setTile(new jzt.Point(column, row), thing);
            }
            
        }
    }
};

/*
 * Initializes object data given a collection of serialized JZT
 * objects.
 */
jzt.Board.prototype.initializeScriptableThings = function(scriptableDataCollection) {
    
    if(!scriptableDataCollection) {
        return;
    }
    
    for(var index = 0; index < scriptableDataCollection.length; ++index) {
        
        var scriptableData = scriptableDataCollection[index];
        var scriptableThing = new jzt.things.ScriptableThing(this);
        scriptableThing.loadFromData(scriptableData);
        this.setTile(scriptableThing.point, scriptableThing);
        this.updateableThings.push(scriptableThing);
        
    }
    
};

jzt.Board.prototype.getScript = function(scriptName) {
    
    if(scriptName && this.scripts) {
        
        for(var index = 0; index < this.scripts.length; ++index) {
            var script = this.scripts[index];
            if(scriptName == script.name) {
                return script;
            }
        }
        
    }
    
    return undefined;
    
};
    
jzt.Board.prototype.each = function(callback) {
    var point = new jzt.Point(0,0);
    for(var y = 0; y < this.height; ++y) {
        for(var x = 0; x < this.width; ++x) {
            point.x = x;
            point.y = y;
            var tile = this.getTile(point);
            callback(tile, point);
        }
    }
}
    
jzt.Board.prototype.moveTile = function(oldPoint, newPoint) {
    
    
    if(this.isPassable(newPoint)) {
        this.setTile(newPoint, this.getTile(oldPoint));
        this.setTile(oldPoint, undefined);
        return true;
    }
    
    // If we couldn't move, see if we can push
    else {
        
        var thing = this.getTile(newPoint);
        if(thing) {
            
            var moveDirection = oldPoint.directionTo(newPoint);
            
            if(thing.isPushable(moveDirection)) {
                
                // Try to move the pushable tile
                var success = thing.move(moveDirection);
            
                // If the tile pushed, try moving again
                if(success) {
                    return this.moveTile(oldPoint, newPoint);
                }
                
            }
            
        }
    }
    
    return false;
}
    
jzt.Board.prototype.setTile = function(point, tile) {
    
    if(tile) {
        tile.point = point;
    }
    
    this.tiles[point.x + point.y * this.width] = tile;
    
}
    
jzt.Board.prototype.getTile = function(point) {
    
    if(point.x >= this.width || point.x < 0 || point.y >= this.height || point.y < 0) {
        return undefined;
    }
    
    return this.tiles[point.x + point.y * this.width];
    
}
    
jzt.Board.prototype.isPassable = function(point) {
        
    if(point.y < 0 || point.y >= this.height) {
        return false;
    }
    else if(point.x < 0 || point.x >= this.width) {
        return false;
    }
        
    return !this.getTile(point);
        
};
    
jzt.Board.prototype.addMessage = function(message) {
    this.messageQueue.push(message);
};
    
jzt.Board.prototype.update = function() {
        
    // Iterate backwards in case a thing needs to be removed
    for(var index = this.updateableThings.length-1; index >= 0; --index) {
        
        // Grab our moveable thing
        var updateableThing = this.updateableThings[index];
        
        // Update the thing
        updateableThing.update();
        
        // If our object died, remove it now
        if(updateableThing.isDead) {
            this.removeUpdatableThing(index);
        }
        
    }
        
};

jzt.Board.prototype.setDisplayMessage = function(message) {
    this._displayMessage = message;
    if(this._displayMessage.length > this.width) {
        this._displayMessage = this._displayMessage.substring(0, this.width);
    }
    this._displayMessageTick = this.DISPLAY_MESSAGE_TTL;
};

jzt.Board.prototype.removeUpdatableThing = function(index) {
    
    var moveableThing = this.updateableThings[index];
    
    if(moveableThing) {
        
        // Update our tile to contain nothing
        this.setTile(moveableThing.point, undefined);
    
        // Remove our thing from our array
        this.updateableThings.splice(index,1);
        
    }
    
};
    
jzt.Board.prototype.render = function(c) {
        
    var instance = this;
    
    c.fillStyle = '#000000';
    c.fillRect(0, 0, this.width * this.game.TILE_SIZE.x, this.height * this.game.TILE_SIZE.y);
    
    this.each( function(thing, point) {
        if(instance.dark && !instance.game.player.inVisibleRadius(point)) {
            instance.DARK_SPRITE.draw(c, point, instance.DARK_SPRITE_COLOR);
        }
        else if(thing) {
            var sprite = instance.game.resources.graphics.getSprite(thing.spriteIndex);
            sprite.draw(c, thing.point, thing.foreground, thing.background);
        }
    });

    if(this._displayMessage != undefined) {
        this._renderMessage(c);
    }
    
};

jzt.Board.prototype._renderMessage = function(c) {
    
    var messagePoint = new jzt.Point();
    messagePoint.x = Math.floor((this.width - this._displayMessage.length) / 2);
    messagePoint.y = this.height-1;
    
    for(var index = 0; index < this._displayMessage.length; ++index) {
        var spriteIndex = this._displayMessage.charCodeAt(index);
        if(spriteIndex >= 32 && spriteIndex <= 126) {
            sprite = this.game.resources.graphics.getSprite(spriteIndex);
            sprite.draw(c, messagePoint, '*', jzt.colors.Colors['0']);
            messagePoint.x++;
        }
    }
    
    if(--this._displayMessageTick <= 0) {
        this._displayMessage = undefined;
    }
    
};