window.jzt = window.jzt || {};

jzt.Board = function(boardData, game) {

    this.name = boardData.name;
    this.game = game;
    this.tiles = undefined;
    this.scripts = [];
    this.updateableThings = [];
    this.dark = boardData.dark;

    this.north = boardData.north;
    this.east = boardData.east;
    this.south = boardData.south;
    this.west = boardData.west;

    this.game.player.point.x = boardData.playerX;
    this.game.player.point.y = boardData.playerY;

    this.displayMessage = undefined;
    this.displayMessageTick = 0;

    this.DISPLAY_MESSAGE_TTL = game.CPS * 3; // 3 seconds
    this.DARK_SPRITE = game.resources.graphics.getSprite(176);
    this.DARK_SPRITE_COLOR = jzt.colors.Colors['8'];
    this.BOARD_DATA_WORD_LENGTH = 4;
    
    this.initializeTiles(boardData.tiles);
    this.initializeScripts(boardData.scripts);
    this.initializeScriptableThings(boardData.scriptables);
    this.initializePlayer(game.player);
    
};

jzt.Board.prototype.serialize = function() {

    var result = {};
    var point = new jzt.Point(0,0);

    result.name = this.name;

    jzt.util.storeOption(result, 'dark', this.dark);
    jzt.util.storeOption(result, 'displayMessage', this.displayMessage);
    jzt.util.storeOption(result, 'north', this.north);
    jzt.util.storeOption(result, 'east', this.east);
    jzt.util.storeOption(result, 'south', this.south);
    jzt.util.storeOption(result, 'west', this.west);

    result.playerX = this.player.point.x;
    result.playerY = this.player.point.y;

    // Store Tiles
    result.tiles = [];
    for(var row = 0; row < this.height; ++row) {

        point.y = row;
        var dataStream = '';

        for(var column = 0; column < this.width; ++column) {

            point.x = column;
            var tile = this.getTile(point);
            if(tile && tile.constructor.symbol != undefined) {
                dataStream += tile.constructor.symbol + tile.background.code + tile.foreground.code;
            }
            else {
                dataStream += '    ';
            }
        }

        result.tiles.push(dataStream);

    }

    // Store scripts
    result.scripts = [];
    for(var index = 0; index < this.scripts.length; ++index) {
        var script = this.scripts[index];
        result.scripts.push( script.serialize() );
    }

    // Store ScriptableThings
    result.scriptables = [];
    for(var index = 0; index < this.updateableThings.length; ++index) {

        var thing = this.updateableThings[index];

        if(thing instanceof jzt.things.ScriptableThing) {
            serializedThing = thing.serialize();
            if(serializedThing) {
                result.scriptables.push(thing.serialize());
            }
        }

    }

    return result;

};

jzt.Board.prototype.initializeScripts = function(scriptData) {
    
    for(var index = 0; index < scriptData.length; ++index) {
        var script = new jzt.Script(scriptData[index]);
        this.scripts.push(script);
    }
    
};

jzt.Board.prototype.initializePlayer = function(player) {
    this.player = player;
    this.setTile(player.point, player);
}

/*
 * Intializes tile data given a collection of serialized tiles.
 */
jzt.Board.prototype.initializeTiles = function(tileDataCollection) {
    
    // Establish our board height
    this.height = tileDataCollection.length;
    this.width = undefined;

    // For each row in our collection
    for(var row = 0; row < this.height; ++row) {

        var dataStream = tileDataCollection[row];

        // Establiash our board width
        if(this.width == undefined) {
            this.width = Math.ceil(dataStream.length / this.BOARD_DATA_WORD_LENGTH);
        }

        if(this.tiles == undefined) {
            this.tiles = new Array(this.width * this.height);
        }

        // For each column in our collection
        for(var column = 0; column < this.width; ++column) {

            // Calculate our string offset for this column
            var offset = column * this.BOARD_DATA_WORD_LENGTH;

            // Grab our symbol, foreground color, and background color
            var symbol = dataStream.charAt(offset) + dataStream.charAt(offset+1);
            var background = dataStream.charAt(offset+2);
            var foreground = dataStream.charAt(offset+3);

            // Create a thing from our symbol
            var thing = jzt.things.ThingFactory.createThing(symbol, this);

            // If a thing was created...
            if(thing) {

                // Assign it to our board
                thing.board = this;

                // If we have colors, assign those too
                if(jzt.colors.Colors[background] != undefined) {
                    thing.background = jzt.colors.Colors[background];
                }

                if(jzt.colors.Colors[foreground] != undefined) {
                    thing.foreground = jzt.colors.Colors[foreground];
                }

                // Set the thing as our board tile at its location
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
        scriptableThing.deserialize(scriptableData);
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
    
jzt.Board.prototype.deleteTile = function(point) {
    
    var thing = this.getTile(point);
    
    // If our thing is an UpdateableThing, we need to delete it from our list
    if(thing instanceof jzt.things.UpdateableThing) {
        for(var index = this.updateableThings.length-1; index >= 0; --index) {
            
            var otherThing = this.updateableThings[index];
            if(thing === otherThing) {
                
                // Remove our thing from our array
                this.updateableThings.splice(index,1);
                
            }  
        }
    }

    // Delete the tile
    this.setTile(point, undefined);
    
};
    
jzt.Board.prototype.moveTile = function(oldPoint, newPoint) {
    
    // If we're trying to move the player outside the board...
    if(this.player.point.equals(oldPoint) && this.isOutside(newPoint)) {

        var direction = oldPoint.directionTo(newPoint);
        var newBoard = undefined;

        switch(direction) {
            case jzt.Direction.North:
                newBoard = this.north;
                break;
            case jzt.Direction.East:
                newBoard = this.east;
                break;
            case jzt.Direction.South:
                newBoard = this.south;
                break;
            case
                jzt.Direction.West:
                newBoard = this.west;
        }

        if(newBoard) {

            var playerPoint = new jzt.Point(0,0);
            playerPoint = playerPoint.add(this.player.point);

            if(newPoint.x < 0) {
                playerPoint.x = this.width-1;
            }
            else if(newPoint.x >= this.width) {
                playerPoint.x = 0;
            }
            else if(newPoint.y < 0) {
                playerPoint.y = this.height-1;
            }
            else if(newPoint.y >= this.height) {
                playerPoint.y = 0;
            }
            this.game.setBoard(newBoard);
            this.game.player.point.x = playerPoint.x;
            this.game.player.point.y = playerPoint.y;
            this.game.currentBoard.initializePlayer(this.game.player);
        }

        return false;

    }
    
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
};
    
jzt.Board.prototype.setTile = function(point, tile) {
    
    if(tile) {
        tile.point = point;
    }
    
    this.tiles[point.x + point.y * this.width] = tile;
    
};
    
jzt.Board.prototype.getTile = function(point) {
    
    if(point.x >= this.width || point.x < 0 || point.y >= this.height || point.y < 0) {
        return undefined;
    }
    
    return this.tiles[point.x + point.y * this.width];
    
};
    
jzt.Board.prototype.replaceTile = function(point, newTile) {
    this.deleteTile(point);
    this.setTile(point, newTile);
};

jzt.Board.prototype.isOutside = function(point) {

    if(point.y < 0 || point.y >= this.height) {
        return true;
    }
    else if(point.x < 0 || point.x >= this.width) {
        return true;
    }

    return false;

};

jzt.Board.prototype.isPassable = function(point) {
        
    return !this.isOutside(point) && !this.getTile(point);
        
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
        
    }
        
};

jzt.Board.prototype.setDisplayMessage = function(message) {
    this.displayMessage = message;
    if(this.displayMessage.length > this.width) {
        this.displayMessage = this.displayMessage.substring(0, this.width);
    }
    this.displayMessageTick = this.DISPLAY_MESSAGE_TTL;
};
    
jzt.Board.prototype.render = function(c) {
        
    var instance = this;
    
    c.fillStyle = '#000000';
    c.fillRect(0, 0, this.width * this.game.TILE_SIZE.x, this.height * this.game.TILE_SIZE.y);
    
    this.each( function(thing, point) {
        if(instance.dark && !instance.game.player.inTorchRange(point)) {
            instance.DARK_SPRITE.draw(c, point, instance.DARK_SPRITE_COLOR, jzt.colors.Colors['0']);
        }
        else if(thing) {
            var sprite = instance.game.resources.graphics.getSprite(thing.spriteIndex);
            sprite.draw(c, thing.point, thing.foreground, thing.background);
        }
    });

    if(this.displayMessage != undefined) {
        this._renderMessage(c);
    }
    
};

jzt.Board.prototype._renderMessage = function(c) {
    
    var messagePoint = new jzt.Point();
    messagePoint.x = Math.floor((this.width - this.displayMessage.length) / 2);
    messagePoint.y = this.height-1;
    
    for(var index = 0; index < this.displayMessage.length; ++index) {
        var spriteIndex = this.displayMessage.charCodeAt(index);
        if(spriteIndex >= 32 && spriteIndex <= 126) {
            sprite = this.game.resources.graphics.getSprite(spriteIndex);
            sprite.draw(c, messagePoint, '*', jzt.colors.Colors['0']);
            messagePoint.x++;
        }
    }
    
    if(--this.displayMessageTick <= 0) {
        this.displayMessage = undefined;
    }
    
};