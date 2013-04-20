window.jzt = window.jzt || {};

/**
 * Board represents a single game board.
 * 
 * @param boardData Serialized board data to load and use for this Board.
 * @param game A Game instance to serve as owner of this board
 */
jzt.Board = function(boardData, game) {

    this.validateData(boardData);

    this.name = boardData.name;
    this.game = game;
    this.tiles = [];
    this.scripts = [];
    this.dark = boardData.dark;

    this.north = boardData.north;
    this.east = boardData.east;
    this.south = boardData.south;
    this.west = boardData.west;

    this.defaultPlayerX = boardData.playerX;
    this.defaultPlayerY = boardData.playerY;

    this.displayMessage = undefined;
    this.displayMessageTick = 0;

    this.DISPLAY_MESSAGE_TTL = game.FPS * 3; // 3 seconds
    this.DARK_SPRITE = game.resources.graphics.getSprite(176);
    this.DARK_SPRITE_COLOR = jzt.colors.Colors['8'];
    this.BOARD_DATA_WORD_LENGTH = 4;
    
    this.height = boardData.height;
    this.width = boardData.width;

    this.initializeTiles(boardData.tiles);
    this.initializeScripts(boardData.scripts);
    
};

jzt.Board.prototype.validateData = function(data) {

    // Let's hope for the best...
    var valid = true;

    if(!data.height || !data.width) valid = false;
    if(typeof data.height !== 'number') valid = false;
    if(typeof data.width !== 'number') valid = false;
    if(!data.tiles || !data.tiles instanceof Array) valid = false;
    if(!data.scripts || !data.script instanceof Array) valid = false;

    if(!valid) {
        throw 'Invalid board data.';
    }

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

    if(this.player) {
        result.playerX = this.player.point.x;
        result.playerY = this.player.point.y;
    }
    else {
        result.playerX = this.defaultPlayerX;
        result.playerY = this.defaultPlayerY;
    }

    result.width = this.width;
    result.height = this.height;
    result.tiles = [];
    result.scripts = [];

    // Store tiles
    this.each(function(tile, point) {
        if(tile) {
            result.tiles.push(tile.serialize());
        }
        else {
            result.tiles.push({});
        }
    });

    // Store scripts
    for(var index = 0; index < this.scripts.length; ++index) {
        var script = this.scripts[index];
        result.scripts.push( script.serialize() );
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

    var x = 0;
    var y = 0;

    for(var index in tileDataCollection) {

        var tile = tileDataCollection[index];
        var thing = jzt.things.ThingFactory.deserialize(tile, this);
        if(thing !== undefined) {
            this.setTile(new jzt.Point(x,y), thing);
        }

        if(++x >= this.width) {
            x = 0;
            y++;
        }

    };
    
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
 * providing the function with a Thing instance and the point at which
 * it occurs. If no thing instance is at a location, undefined is returned.
 *
 * @param callBack A callback function to be executed for each tile
 */
jzt.Board.prototype.each = function(callback) {

    var values = this.tiles.slice(0);
    var point = new jzt.Point(0,0);

    for(point.y = 0; point.y < this.height; point.y++) {
        for(point.x = 0; point.x < this.width; point.x++) {
            callback(values[point.x+point.y*this.width], point);
        }
    }

};

jzt.Board.prototype.eachBackwards = function(callback) {

    var values = this.tiles.slice(0);
    var point = new jzt.Point(0,0);

    for(point.y = this.height-1; point.y >= 0; point.y--) {
        for(point.x = this.width-1; point.x >= 0; point.x--) {
            callback(values[point.x+point.y*this.width], point);
        }
    }

};
 
/**
 * Removes a tile from this Board at a provided Point. This function will also
 * update its internal representation to remove references to no-longer-used 
 * tiles.
 *
 * @param point A point on this Board to delete.
 */   
jzt.Board.prototype.deleteTile = function(point) {
    
    var thing = this.getTile(point);

    // Delete the tile
    this.setTile(point, thing.under);
    
};

/**
 * Moves a tile on this Board from a specified Point to another Point.
 * If the move was successful, true is returned, otherwise false. We can
 * optionally specify whether the move should be weak, meaning moves should
 * be treated as unsuccessful even when a pushable Thing is in the way. Additionally,
 * we can specify the move as a flier, which will move the Thing even if an unpushable
 * Thing is in the way.
 *
 * @param oldPoint A point on this Board containing a tile to be moved
 * @param newPoint A point on the Board to which a tile is to be moved.
 * @param weak Whether or not we should weakly move the tile.
 * @return true if a move was successful, false otherwise.
 */
jzt.Board.prototype.moveTile = function(oldPoint, newPoint, weak) {
    
    var thing = this.getTile(oldPoint);
    var obstacle = this.getTile(newPoint);

    // If the coast is clear...
    if(this.isFree(newPoint)) {

        this.setTile(newPoint, thing);
        this.setTile(oldPoint, thing === undefined ? undefined : thing.under);

        if(thing !== undefined) {
            thing.under = undefined;
        }

        return true;
    }

    // If we are blocked, but the path is surrenderable...
    else if(!this.isOutside(newPoint) && obstacle.isSurrenderable(thing)) {

        // If our thing isn't undefined
        if(thing !== undefined) {
            var underOldThing = thing.under;
            thing.under = obstacle;
        }

        this.setTile(newPoint, thing);
        this.setTile(oldPoint, underOldThing);

        return true;

    }
    
    // If we couldn't move and we're not weak, try to push and try again
    else if(!weak) {
        
        // If an obstacle was encountered
        if(obstacle) {

            // Try to push the obstacle out of the way
            var teleported = obstacle.push(oldPoint.directionTo(newPoint));

            // If we were teleported, return true
            if(teleported) {
                return true;
            }

            // Otherwise, if a space was opened up, or if the space is surrenderable...
            else if(this.isFree(newPoint) || this.getTile(newPoint).isSurrenderable(thing)) {
                return this.moveTile(oldPoint, newPoint, weak);
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
        tile.point = point.clone();
    }
    
    this.tiles[point.x + point.y * this.width] = tile;
    
};

/**
 * Adds a Thing to a specific Point on this Board. This function
 * will safely delete any existing Thing if present at the specified
 * location and will update any UpdateableThing list, unless we opt
 * to respect surrenderability, in which case the thing will only be deleted
 * if it refuses to surrender.
 *
 * @param point A point at which to add a Thing
 * @param thing A Thing to add at a given point
 * @param respectSurrenderability Whether to respect the surrenderability of an item
 */
jzt.Board.prototype.addThing = function(point, thing, respectSurrenderabilty) {

    var oldThing = this.getTile(point);

    if(oldThing) {
        if(respectSurrenderabilty && oldThing.isSurrenderable(thing)) {
            thing.under = oldThing;
        }
        else {
            this.deleteTile(point);
        }
    }

    this.setTile(point, thing);

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
 * Returns whether or not a provided Point is unoccupied.
 *
 * @param point a Point to test.
 * @return true if a provided Point is free, false otherwise.
 */
jzt.Board.prototype.isFree = function(point) {
        
    return !this.isOutside(point) && (!this.getTile(point));
        
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
            break;
        default:
            return;
    }

    // Move our player to that board edge
    this.game.movePlayerToBoardEdge(jzt.Direction.opposite(direction), boardName);
    
};

/**
 * Retrieves a Door with a provided ID from this board.
 *
 * @param doorId an ID of a door to retrieve
 * @return A Door instance.
 */
jzt.Board.prototype.getDoor = function(doorId) {

    for(var row = 0; row < this.height; ++row) {
        for(var column = 0; column < this.width; ++column) {
            var tile = this.getTile(new jzt.Point(column, row));
            if(tile instanceof jzt.things.Door && tile.doorId === doorId) {
                return tile;
            }
        }
    }

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
 * update all UpdateableThings tracked by this Board.
 */
jzt.Board.prototype.update = function() {
    

    /*
     * This function works as follows: Each tile is looped through in sequential
     * order, and once again in reverse order. A tile may opt to be sent its
     * update message in either one loop or the other via its updateOnReverse
     * function. Tiles may wish to update in reverse because they are about to
     * move in the same direction as the updates (for example, a Bullet travelling
     * South). This results in smoother motion for such movements.
     */

    // For each tile on our board...
    this.each(function(tile) {

        // If we got a tile, and it's updateable
        if(tile && tile instanceof jzt.things.UpdateableThing) {

            // If we aren't updating backwards...
            if(!tile.updateOnReverse()) {
                tile.update();
            }
        }

    });

    // For each tile on our board in reverse...
    this.eachBackwards(function(tile) {

        // If a tile wants to be udpated backwards, do it now
        if(tile && tile instanceof jzt.things.UpdateableThing && tile.updateOnReverse() && ! (tile instanceof jzt.things.Player)) {
            tile.update();
        }

    });
        
};

/**
 * Returns whether or not this Board is the same as another board, either by
 * name or reference.
 *
 * @param otherBoard another Board or name of another board to test for equality.
 * @return true if this Board is the same by name, false otherwise
 */
jzt.Board.prototype.equals = function(otherBoard) {

    var otherName = (otherBoard instanceof jzt.Board) ? otherBoard.name : otherBoard;
    return this.name === otherName;

};

/**
 * Assigns a message to be temporarily displayed at the bottom of this Board.
 *
 * @param message a message to be displayed.
 */ 
jzt.Board.prototype.setDisplayMessage = function(message, duration) {

    if(message !== undefined) {
        this.displayMessage = ' ' + message + ' ';
        if(this.displayMessage.length > this.width) {
            this.displayMessage = this.displayMessage.substring(0, this.width);
        }
        this.displayMessageTick = duration ? this.game.FPS * duration : this.DISPLAY_MESSAGE_TTL;
    }
    else {
        this.displayMessage = undefined;
        this.displayMessageTick = 0;
    }
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
    c.fillRect(0, 0, this.game.context.canvas.width, this.game.context.canvas.height);
    
    this.each( function(thing, point) {
        if(instance.dark && !instance.game.player.inTorchRange(point)) {
            instance.DARK_SPRITE.draw(c, point, instance.DARK_SPRITE_COLOR, jzt.colors.Colors['0']);
        }
        else if(thing) {
            var sprite = instance.game.resources.graphics.getSprite(thing.getSpriteIndex());
            var background = thing.background;
            if(!background && thing.under) {
                background = jzt.colors.getNonBlinkingEquivalent(thing.under.background);
            }
            sprite.draw(c, thing.point, thing.foreground, background);
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

    this.game.resources.graphics.drawString(c, messagePoint, this.displayMessage, '*', jzt.colors.Colors['0']);

    if(--this.displayMessageTick <= 0) {
        this.displayMessage = undefined;
    }
    
};