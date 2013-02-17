window.jzt = window.jzt || {};

jzt.Board = function(boardData, player) {

    this.TILE_HEIGHT = 20;
    this.TILE_WIDTH = 20;
    
    this.boardData = boardData;
    this.width = boardData.width;
    this.height = boardData.height;
    this.messages = [];
    this.tiles = new Array(this.width * this.height);
    this.scripts = boardData.scripts;
    this.jztObjects = [];
    
    this._initializeTiles(boardData.tiles);
    this._initializeObjects(boardData.jztObjects);
    this._initializePlayer(player);
    
};

jzt.Board.prototype._initializePlayer = function(player) {
    this.player = player;
    this.setTile(player.point, player);
}

/*
 * Intializes tile data given a collection of serialized tiles.
 */
jzt.Board.prototype._initializeTiles = function(tileDataCollection) {
    
    for(var row = 0; row < this.height; ++row) {
        
        var rowString = tileDataCollection[row];
        
        for(var column = 0; column < this.width; ++column) {
            
            var tile;
            
            switch(rowString.charAt(column)) {
                case '#':
                    tile = jzt.BuiltInFactory.create('jztWall');
                    break;
                case ' ':
                    tile = undefined;
                    break;
            }
            
            if(tile) {
                tile.setOwnerBoard(this);
                this.setTile(new jzt.Point(column, row), tile);
            }
            
        }
    }
};

/*
 * Initializes object data given a collection of serialized JZT
 * objects.
 */
jzt.Board.prototype._initializeObjects = function(objectDataCollection) {
    
    for(var index = 0; index < objectDataCollection.length; ++index) {
        
        var objectData = objectDataCollection[index];
        var jztObject = new jzt.JztObject(objectData);
        jztObject.setOwnerBoard(this);
        jztObject.setScriptData(this.getScriptData(jztObject.scriptName));
        this.setTile(jztObject.point, jztObject);
        this.jztObjects.push(jztObject);
        
    }
    
};

jzt.Board.prototype.getScriptData = function(scriptName) {
    
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
    for(var y = 0; y < this.height; ++y) {
        for(var x = 0; x < this.width; ++x) {
            var tile = this.getTile(new jzt.Point(x,y));
            callback(tile);
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
        var tile = this.getTile(newPoint);
        if(tile && tile.pushable) {
            
            var moveDirection = oldPoint.directionTo(newPoint);
            jzt.debug.log('Move direction is: ' + jzt.Direction.getName(moveDirection));
            
            // Try to move the pushable tile
            var success = tile.move(moveDirection);
            
            // If the tile pushed, try moving again
            if(success) {
                return this.moveTile(oldPoint, newPoint);
            }
            
        }
        else {
            jzt.debug.log('Not pushable.');
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
        
    for(var index = 0; index < this.jztObjects.length; ++index) {
        
        var jztObject = this.jztObjects[index];
        
        // Enqueue messages for jztObjects
        for(var messageIndex = 0; messageIndex < this.messages.length; ++messageIndex) {
            
            var message = this.messages[messageIndex];
            if(jztObject.name == message.to) {
                jztObject.addMessage(message);
            }
            
        }
        
        // Update the jztObject
        jztObject.update();
        
    }
        
};
    
jzt.Board.prototype.render = function(c) {
        
    var instance = this;
    
    c.fillStyle = '#000000';
    c.fillRect(0, 0, this.width * this.TILE_WIDTH, this.height * this.TILE_HEIGHT);
    
    this.each( function(tile) {
        if(tile) {
            c.fillStyle = tile.foregroundColor;
            c.fillRect(tile.point.x * instance.TILE_WIDTH, tile.point.y * instance.TILE_HEIGHT,
                instance.TILE_WIDTH, instance.TILE_HEIGHT);
        }
    });
    
};