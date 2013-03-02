window.jzt = window.jzt || {};

/**
 * Board represents a single game board.
 * 
 * @param boardData Serialized board data to load and use for this Board.
 * @param game A Game instance to serve as owner of this board
 */
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

    this.defaultPlayerX = boardData.playerX;
    this.defaultPlayerY = boardData.playerY;

    this.displayMessage = undefined;
    this.displayMessageTick = 0;

    this.DISPLAY_MESSAGE_TTL = game.CPS * 3; // 3 seconds
    this.DARK_SPRITE = game.resources.graphics.getSprite(176);
    this.DARK_SPRITE_COLOR = jzt.colors.Colors['8'];
    this.BOARD_DATA_WORD_LENGTH = 4;
    
    this.initializeTiles(boardData.tiles);
    this.initializeScripts(boardData.scripts);
    this.initializeScriptableThings(boardData.scriptables);
    
};

/**
 * Serializes this Board instance to an object.
 *
 * @return An object representation of this board data.
 */
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

/**
 * Initializes scripts used by this Board based on provided script
 * data.
 *
 * @param scriptData Script data to be deserialized into Script instances.
 */
jzt.Board.prototype.initializeScripts = function(scriptData) {
    
    for(var index = 0; index < scriptData.length; ++index) {
        var script = new jzt.Script(scriptData[index]);
        this.scripts.push(script);
    }
    
};

/**
 * Takes a provided player an initializes it for use on this board.
 * 
 * @param A player instance to use on this board.
 */
jzt.Board.prototype.initializePlayer = function(player) {

    // If we already have a player, remove it
    if(this.player) {
        this.setTile(player.point, undefined);
    }

    // Check if our player is outside our range
    if(this.isOutside(player.point)) {

        // If so, use our default location
        player.point.x = this.defaultPlayerX;
        player.point.y = this.defaultPlayerY;

    }

    // Update our player and assign it to a tile
    this.player = player;
    this.setTile(player.point, player);
    this.player.board = this;
}

/*
 * Intializes tile data given a collection of serialized tiles.
 *
 * @param tileDataCollection an array of serialized tile data to be loaded 
 *      into this Board.
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

/**
 * Initializes Scriptable data given a collection of serialized JZT
 * objects.
 * 
 * @param scriptableDataCollection An array of serialized Scriptables to be
 *        deserialized into actual Scriptable instances for this Board.
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

/**
 * Retrieves a Script instance by its name for this Board.
 *
 * @param scriptName A name of a Script instance
 * @return A Script instance.
 */
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
    
/**
 * Executes a provided callback function for each tile on this Board,
 * providing the function with a Thing instance and the Point at which
 * it occurs. If there is no tile at a specific Point, undefined is
 * provided instead.
 *
 * @param callBack A callback function to be executed for each tile
 */
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
 
/**
 * Removes a tile from this Board at a provided Point. This function will also
 * update its internal representation to remove references to no-longer-used 
 * tiles.
 *
 * @param point A point on this Board to delete.
 */   
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

    
/**
 * Moves a tile on this Board from a specified Point to another Point.
 * If the move was successful, true is returned, otherwise false.
 *
 * @param oldPoint A point on this Board containing a tile to be moved
 * @param newPoint A point on the Board to which a tile is to be moved.
 * @return true if a move was successful, false otherwise.
 */
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
};
    
/**
 * Assigns a tile to a specific Point on this Board. This function does
 * not check for saftey of this operation.
 *
 * @param point A point to be set to a specific tile
 * @param tile A tile to be set.
 */
jzt.Board.prototype.setTile = function(point, tile) {
    
    if(tile) {
        tile.point = point;
    }
    
    this.tiles[point.x + point.y * this.width] = tile;
    
};

/**
 * Retrieves a tile from this Board at a provided Point.
 * 
 * @param point A point from which to retrieve a tile.
 * @return a Thing located at a provided Point, or undefined if no such 
 *          this is available at a given Point.
 */    
jzt.Board.prototype.getTile = function(point) {
    
    if(point.x >= this.width || point.x < 0 || point.y >= this.height || point.y < 0) {
        return undefined;
    }
    
    return this.tiles[point.x + point.y * this.width];
    
};
    
/**
 * Replaces an existing tile at a given Point with a provided Thing.
 * This function checks for saftey.
 * 
 * @param point A point on this Board to be replaced
 * @param A Thing to be added to a given point.
 */
jzt.Board.prototype.replaceTile = function(point, newTile) {
    this.deleteTile(point);
    this.setTile(point, newTile);
};

/**
 * Retruns true if a provided Point is located outside of this Board's
 * boundaries.
 *
 * @param point A point to check
 * @return true if a provided Point is within this Board's boundaries,
 *         false otherwise.
 */
jzt.Board.prototype.isOutside = function(point) {

    if(point.y < 0 || point.y >= this.height) {
        return true;
    }
    else if(point.x < 0 || point.x >= this.width) {
        return true;
    }

    return false;

};

/**
 * Returns whether or not a provided Point contains a tile that is
 * occupied by another tile in such a way that another tile cannot
 * move into its space.
 *
 * @param point a Point to test for passability.
 * @return true if a provided Point is passable, false otherwise.
 */
jzt.Board.prototype.isPassable = function(point) {
        
    return !this.isOutside(point) && !this.getTile(point);
        
};

/**
 * Requests to move this Board's player to a Board located
 * in a given direction relative to this Board.
 *
 * @param direction An adjacent board direction to which to 
 *        relocate a player.
 */
jzt.Board.prototype.movePlayerOffBoard = function(direction) {
    
    var boardName;

    // Find the board we are switching to
    switch(direction) {
        case jzt.Direction.North:
            boardName = this.north;
            break;
        case jzt.Direction.East:
            boardName = this.east;
            break;
        case jzt.Direction.South:
            boardName = this.south;
            break;
        case jzt.Direction.West:
            boardName = this.west;
    }

    // Move our player to that board edge
    this.game.movePlayerToBoardEdge(jzt.Direction.opposite(direction), boardName);
    
};
    
/**
 * Adds a provided message to this Board's queue of messages to globally
 * send to all UpdateableThings tracked by this Board.
 *
 * @param message A message to be delivered to all UpdateableThings.
 */
jzt.Board.prototype.addMessage = function(message) {
    this.messageQueue.push(message);
};
    
/**
 * Updates this Board instance by one tick in an execution cycle. This will also
 * update all UpdateableThings tracked by this Board, excluding the player.
 */
jzt.Board.prototype.update = function() {
        
    // Iterate backwards in case a thing needs to be removed
    for(var index = this.updateableThings.length-1; index >= 0; --index) {
        
        // Grab our moveable thing
        var updateableThing = this.updateableThings[index];
        
        // Update the thing
        updateableThing.update();
        
    }
        
};

/**
 * Assigns a message to be temporarily displayed at the bottom of this Board.
 *
 * @param message a message to be displayed.
 */ 
jzt.Board.prototype.setDisplayMessage = function(message) {
    this.displayMessage = message;
    if(this.displayMessage.length > this.width) {
        this.displayMessage = this.displayMessage.substring(0, this.width);
    }
    this.displayMessageTick = this.DISPLAY_MESSAGE_TTL;
};
    
/**
 * Renders a visual representation of this Board to a provided graphics
 * context.
 *
 * @param c A graphics context.
 */
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

/**
 * Renders a visual message to a provided graphics context representing this Board's current
 * display message. 
 *
 * @param c A graphics context.
 */
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