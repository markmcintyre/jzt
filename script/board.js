/**
 * JZT Board
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jzt = jzt || {};

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
    this.smartPath = [];
    this.customRenderSet = [];
    this.torches = [];
    this.focusPoint = new jzt.Point(0,0);

    this.north = boardData.north;
    this.east = boardData.east;
    this.south = boardData.south;
    this.west = boardData.west;
    this.northOffset = boardData.northOffset ? boardData.northOffset : 0;
    this.eastOffset = boardData.eastOffset ? boardData.eastOffset : 0;
    this.southOffset = boardData.southOffset ? boardData.southOffset : 0;
    this.westOffset = boardData.westOffset ? boardData.westOffset : 0;

    this.defaultPlayerX = boardData.playerX;
    this.defaultPlayerY = boardData.playerY;

    this.displayMessage = undefined;
    this.displayMessageTick = 0;

    this.DISPLAY_MESSAGE_TTL = game.FPS * 3; // 3 seconds
    this.DARK_SPRITE = game.resources.graphics.getSprite(176);
    this.DARK_SPRITE_COLOR = jzt.colors.Grey;

    this.height = boardData.height;
    this.width = boardData.width;

    this.initializeScripts(boardData.scripts);
    this.initializeTiles(boardData.tiles);
    this.initializeWindow();

};

/**
 * Validates provided board data to make sure it contains some expected
 * properties for deserialization.
 *
 * @param data Data to be validated
 */
jzt.Board.prototype.validateData = function(data) {

    // Let's hope for the best...
    var valid = true;

    if(!data.height || !data.width) {valid = false;}
    if(typeof data.height !== 'number') {valid = false;}
    if(typeof data.width !== 'number') {valid = false;}
    if(data.height > 256 || data.height < 10) {valid = false;}
    if(data.width > 256 || data.width < 10) {valid = false;}
    if(!data.tiles || !data.tiles instanceof Array) {valid = false;}
    if(!data.scripts || !data.script instanceof Array) {valid = false;}

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
    var index;
    var script;

    result.name = this.name;

    jzt.util.storeOption(result, 'dark', this.dark);
    jzt.util.storeOption(result, 'displayMessage', this.displayMessage);
    jzt.util.storeOption(result, 'north', this.north);
    jzt.util.storeOption(result, 'east', this.east);
    jzt.util.storeOption(result, 'south', this.south);
    jzt.util.storeOption(result, 'west', this.west);
    jzt.util.storeOption(result, 'northOffset', this.northOffset);
    jzt.util.storeOption(result, 'eastOffset', this.eastOffset);
    jzt.util.storeOption(result, 'southOffset', this.southOffset);
    jzt.util.storeOption(result, 'westOffset', this.westOffset);

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
    this.each(function(tile) {
        if(tile) {
            result.tiles.push(tile.serialize());
        }
        else {
            result.tiles.push(0);
        }
    });

    // Store scripts
    for(index = 0; index < this.scripts.length; ++index) {
        script = this.scripts[index];
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
    
    var index, script;

    for(index = 0; index < scriptData.length; ++index) {
        script = new jzt.Script(scriptData[index]);
        this.scripts.push(script);
    }
    
};

jzt.Board.prototype.getScriptables = function(name) {

    var result = [];

    this.each(function(tile) {
        if(tile && tile instanceof jzt.things.ScriptableThing && (tile.name && tile.name.toUpperCase() === name)) {
            result.push(tile);
        }
    });

    return result;

};

/**
 * Takes a provided player an initializes it for use on this board.
 * 
 * @param A player instance to use on this board.
 */
jzt.Board.prototype.initializePlayer = function(player) {

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
    this.initializeTorch(this.player);
    this.focusPoint = this.player.point;

};

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
        if(tileDataCollection.hasOwnProperty(index)) {
            var tile = tileDataCollection[index];
            var thing = jzt.things.ThingFactory.deserialize(tile, this);
            if(thing !== undefined) {
                this.setTile(new jzt.Point(x,y), thing);
                this.initializeTorch(thing);
            }

            if(++x >= this.width) {
                x = 0;
                y++;
            }

        }

    }
    
};

/**
 * Initializes a Torch for a provided thing
 *
 * @param A thing for which to initialize a torch
 */
jzt.Board.prototype.initializeTorch = function(thing) {

    var torch;

    // If the board is dark and we've got a torch, add it to our collection
    if(this.dark && typeof(thing.getTorch) === 'function') {
        torch = thing.getTorch();
        if(torch) {
            this.torches.push(torch);
        }
    }
};

jzt.Board.prototype.initializeWindow = function() {

    var canvasWidth = this.game.context.canvas.width;
    var canvasHeight = this.game.context.canvas.height;

    this.windowSize = new jzt.Point(0,0);
    this.windowOrigin = new jzt.Point(0,0);

    this.windowSize.x = Math.floor(canvasWidth / this.game.resources.graphics.TILE_SIZE.x);
    this.windowSize.y = Math.floor(canvasHeight / this.game.resources.graphics.TILE_SIZE.y);

    this.windowLimit = new jzt.Point(this.width - this.windowSize.x, this.height - this.windowSize.y);

    this.updateWindowPosition();
    
    if(this.windowSize.x > this.width) {
        this.windowOrigin.x = -Math.round((this.windowSize.x - this.width) / 2);
    }

    if(this.windowSize.y > this.height) {
        this.windowOrigin.y = -Math.round((this.windowSize.y - this.height) / 2);
    }


};

jzt.Board.prototype.updateWindowPosition = function() {

    if(this.focusPoint) {

        if(this.width > this.windowSize.x) {
            this.windowOrigin.x = this.focusPoint.x - Math.round(this.windowSize.x / 2);
            this.windowOrigin.x = this.windowOrigin.x < 0 ? 0 : this.windowOrigin.x > this.windowLimit.x ? this.windowLimit.x : this.windowOrigin.x;
        }

        if(this.height > this.windowSize.y) {
            this.windowOrigin.y = this.focusPoint.y - Math.round(this.windowSize.y / 2);
            this.windowOrigin.y = this.windowOrigin.y < 0 ? 0 : this.windowOrigin.y > this.windowLimit.y ? this.windowLimit.y : this.windowOrigin.y;
        }

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
            if(scriptName === script.name) {
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
 * @param callback A callback function to be executed for each tile
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

/**
 * Executes a provided callback function for each tile on this Board,
 * delivered in reverse order. The callback function will be provided with
 * a Thing instance and the point at which it occurs. If no Thing instance
 * is available at a location, undefined is returned.
 *
 * @param callback A callback function to be executed for each tile, in reverse.
 */
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
 * Executes a provided callback function for each tile on this Board that falls within
 * this board's displayable window. The callback function will be provided with a Thing
 * instance and the point at which it occurs. If no Thing instance is available at a location
 * undefined is returned.
 *
 * @param callback A callback function to be executed for each tile.
 */
jzt.Board.prototype.eachDisplayable = function(callback) {

    var values = this.tiles.slice(0);
    var point = new jzt.Point(0,0);
    var startY = this.windowOrigin.y;
    var endY = startY + this.windowSize.y;
    var startX = this.windowOrigin.x;
    var endX = startX + this.windowSize.x;

    startX = startX < 0 ? 0 : startX;
    startY = startY < 0 ? 0 : startY;
    endX = endX > this.width ? this.width : endX;
    endY = endY > this.height ? this.height : endY;

    for(point.y = startY; point.y < endY; point.y++) {
        for(point.x = startX; point.x < endX; point.x++) {
            callback(values[point.x+point.y*this.width], point);
        }
    }

};

/**
 * Retrieves whether or not this Board has a provided number (or any) of a
 * specific tile type.
 *
 * @param type A type of tile to test for
 * @param color A color of tile to test for
 * @param count A minimum number of tiles on the board to test for, or undefined to test for any number
 */
jzt.Board.prototype.hasTile = function(type, color, count) {

    var tally = 0;

    this.each(function(tile, point) {

        if(tile && tile.equals(type, color)) {
            tally++;
        }

    });

    return count === undefined ? tally > 0 : count <= 0 ? tally <= 0 : tally >= count;

};

/**
 * Changes all instances of tiles matching a target type and (optionally) color to
 * a clone of a provided Thing.
 *
 * @param targetType a type of Thing to be changed
 * @param targetColor a color of Thing to be changed
 * @param newThing a Thing to be cloned in place of the target type
 */
jzt.Board.prototype.changeTiles = function(targetType, targetColor, newThing) {

    var me = this;
    var clone;

    this.each(function(tile, point) {

        if(tile && tile.equals(targetType, targetColor)) {

            clone = newThing.clone();

            if(!newThing.foreground) {
                clone.foreground = tile.foreground;
            }

            me.replaceTile(tile.point, clone);
        }

    });

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
    if(thing) {
        this.setTile(point, thing.under);
    }
    
};

/**
 * Moves a tile on this Board from a specified Point to another Point.
 * If the move was successful, true is returned, otherwise false. We can
 * optionally specify whether the move should be weak, meaning moves should
 * be treated as unsuccessful even when a pushable Thing is in the way.
 *
 * @param oldPoint A point on this Board containing a tile to be moved
 * @param newPoint A point on the Board to which a tile is to be moved.
 * @param weak Whether or not we should weakly move the tile.
 * @param ghost Whether or not we should actually move the tile, or behave as if a ghost moved (without actually moving)
 * @return true if a move was successful, false otherwise.
 */
jzt.Board.prototype.moveTile = function(oldPoint, newPoint, weak, ghost) {
    
    var thing = this.getTile(oldPoint);
    var obstacle = this.getTile(newPoint);
    var underOldThing;

    // If the coast is clear...
    if(this.isFree(newPoint)) {

        if(!ghost) {

            this.setTile(newPoint, thing);
            this.setTile(oldPoint, thing === undefined ? undefined : thing.under);

            if(thing !== undefined) {
                thing.under = undefined;
            }
        }

        return true;
    }

    // If we are blocked, but the path is surrenderable...
    else if(!this.isOutside(newPoint) && obstacle.isSurrenderable(thing)) {


        if(!ghost) {
            // If our thing isn't undefined
            if(thing !== undefined) {
                underOldThing = thing.under;
                thing.under = obstacle;
            }

            this.setTile(newPoint, thing);
            this.setTile(oldPoint, underOldThing);
        }

        return true;

    }
    
    // If we couldn't move and we're not weak, try to push and try again
    else if(!weak) {
        
        // If an obstacle was encountered
        if(obstacle) {

            // Try to push the obstacle out of the way
            var teleported = obstacle.push(oldPoint.directionTo(newPoint), thing);

            // If we were teleported, return true
            if(teleported) {
                return true;
            }

            // Otherwise, if a space was opened up, or if the space is surrenderable...
            else if(this.isFree(newPoint) || this.getTile(newPoint).isSurrenderable(thing)) {
                return this.moveTile(oldPoint, newPoint, weak, ghost);
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
    
    if(!this.isOutside(point)) {

        if(tile) {

            tile.point = point.clone();

            if(tile instanceof jzt.things.Player && (!point.equals(this.player.point))) {

                // Remove the old player
                this.deleteTile(this.player.point);

                // Add our new player
                tile = this.player;
                tile.point = point.clone();
                this.initializePlayer(this.player);

            }

        }
        
        this.tiles[point.x + point.y * this.width] = tile;
    
    }
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
 * Returns true if a provided Point is located outside of this Board's
 * boundaries.
 *
 * @param point A point to check
 * @return true if a provided Point is outisde this Board's boundaries,
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
 * Returns true if a provided Point is located outside of this Board's visible
 * window boundary.
 *
 * @param point A point to check.
 * @return true if a provided Point is outside this Board's boundaries, false otherwise.
 */
jzt.Board.prototype.isOutsideWindow = function(point) {
    if(point.x < this.windowOrigin.x || point.x >= (this.windowOrigin.x + this.windowSize.x)) {
        return true;
    }
    else if(point.y < this.windowOrigin.y || point.y >= (this.windowOrigin.y + this.windowSize.y)) {
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
    var offset;

    // Find the board we are switching to
    switch(direction) {
        case jzt.Direction.North:
            boardName = this.north;
            offset = this.northOffset;
            break;
        case jzt.Direction.East:
            boardName = this.east;
            offset = this.eastOffset;
            break;
        case jzt.Direction.South:
            boardName = this.south;
            offset = this.southOffset;
            break;
        case jzt.Direction.West:
            boardName = this.west;
            offset = this.westOffset;
            break;
        default:
            return;
    }

    // Move our player to that board edge
    this.game.movePlayerToBoardEdge(jzt.Direction.opposite(direction), boardName, offset);
    
};

/**
 * Retrieves a Passage with a provided ID from this board.
 *
 * @param passageId an ID of a passage to retrieve
 * @return A Passage instance.
 */
jzt.Board.prototype.getPassage = function(passageId) {

    for(var row = 0; row < this.height; ++row) {
        for(var column = 0; column < this.width; ++column) {
            var tile = this.getTile(new jzt.Point(column, row));
            if(tile instanceof jzt.things.Passage && tile.passageId === passageId) {
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
 * Retrieves whether or not a provided point falls within any of this
 * Board's torches.
 *
 * @param point A Point to test if it's inside a torch circle
 * @param thing A thing at the point to test if it's glowing (or lit by torches)
 * @return true if a provided point is within any torch circle, false otherwise
 */
jzt.Board.prototype.isLit = function(point, thing) {

    var index;
    var torch;

    if(thing && thing.glow) {
        return true;
    }

    for(index = 0; index < this.torches.length; ++index) {
        torch = this.torches[index];
        if(torch.contains(point)) {
            return true;
        }
    }

    return false;

};
    
/**
 * Updates this Board instance by one tick in an execution cycle. This will also
 * update all UpdateableThings tracked by this Board.
 */
jzt.Board.prototype.update = function() {

    var me = this;
    var torch;

    // Update the smart path
    this.updateSmartPath(this.player.point);

    // Initialize our custom renderable list
    this.customRenderSet = [];

    // If the board is dark, initialize our torches
    if(this.dark) {
        this.torches = [];
    }

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

        if(tile) {

            // If we got an updateable tile...
            if(tile instanceof jzt.things.UpdateableThing && ! (tile instanceof jzt.things.Player)) {

                // If we aren't updating backwards...
                if(!tile.updateOnReverse()) {
                    tile.update();
                }

            }

            // If we've got a tile with a custom renderer...
            if(tile.render) {
                me.customRenderSet.push(tile);
            }

            // Update our torch, if applicable
            if(! (tile instanceof jzt.things.Player)) {
                me.initializeTorch(tile);
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
        if(this.displayMessage.length > this.windowSize.x) {
            this.displayMessage = this.displayMessage.substring(0, this.windowSize.x);
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
        
    var me = this;
    var canvasWidth = this.game.context.canvas.width;
    var canvasHeight = this.game.context.canvas.height;
    var torchCircle;
    var index;

    // Update our window
    this.updateWindowPosition();

    // Draw our board background
    c.fillStyle = !me.game.isDebugRendering && me.dark ? this.game.DARK_PATTERN : jzt.colors.Black.rgbValue;
    c.fillRect(0, 0, canvasWidth, canvasHeight);

    // For each displayable tile...
    this.eachDisplayable( function(thing, point) {

        // If this board is dark, and we're not visible, skip this iteration
        if(!me.game.isDebugRendering && me.dark && !me.isLit(point, thing)) {
            return;
        }

        // If there's a thing to render...
        if(thing && !thing.hidden) {

            // Grab our sprite
            var sprite = me.game.resources.graphics.getSprite(thing.getSpriteIndex());

            // Our background colour may come from the 'under' tile if no background is defined
            var background = thing.background;
            if(!background && thing.under && thing.under.background) {
                background = thing.under.background.isLight() ? thing.under.background.darken() : thing.under.background;
            }

            // Or, if the room is dark, our background should be black instead of transparent
            else if(!background && me.dark) {
                background = jzt.colors.Black;
            }

            // Draw our sprite
            sprite.draw(c, point.subtract(me.windowOrigin), thing.foreground, background);

        }

        // If there's nothing to render, but we're within the torch circle...
        else if(!thing && me.dark) {

            // Draw an empty space
            me.game.resources.graphics.fillTile(c, point.subtract(me.windowOrigin), jzt.colors.Black);

        }

  
        // Debug rendering...
        /*
        var p = me.getSmartValue(point);
        if(p !== Infinity) {
            c.fillStyle = 'gray';
            var drawpoint = point.subtract(me.windowOrigin);
            c.fillText(me.getSmartValue(point).toString(), drawpoint.x * 16 + 4, drawpoint.y * 32 + 16);
        }
        */

    });

    // For each item in our custom render set
    for(index = 0; index < this.customRenderSet.length; ++index) {
        this.customRenderSet[index].render(c);
    }

    // If there is a display message, render it
    if(this.displayMessage !== undefined) {
        this.renderMessage(c);
    }
    
};

/**
 * Sets a point on the "smart path" to be weighted differently, creating either an aversion
 * point or an attraction point.
 */
jzt.Board.prototype.adjustSmartPathWeight = function(point, strengthDelta) {

    var pathIndex = point.x + point.y * this.width;
    if(!this.isOutside(point) && this.smartPath[pathIndex] !== undefined) {
        this.smartPath[pathIndex] += strengthDelta;
    }

};

/**
 * Precomputes a "smart path" toward a provided target point. This will add path-finding information
 * that can be queried to find a most efficient path from any point on the grid toward this target.
 *
 * @param targetPoint A target point to which the smart path should be computed.
 */
jzt.Board.prototype.updateSmartPath = function(targetPoint) {

    var me = this;

    function updatePath(currentX, currentY, currentDistance) {

        // If our values are within the grid range...
        if(currentDistance < 50 && currentX >= 0 && currentX < me.width && currentY >= 0 && currentY < me.height) {

            // Calculate our index
            var index = currentX + currentY * me.width;

            // Get our tile and existing path value
            var tile = me.tiles[index];
            var pathValue = me.smartPath[index];

            // If there is neither a tile, nor an existing value then we're good to go
            if(currentDistance <= 0 || (tile === undefined && (pathValue === undefined || pathValue > currentDistance))) {

                // Assign our path distance at this point
                me.smartPath[currentX + currentY * me.width] = currentDistance++;

                // Do the same for each of the four surrounding directions
                updatePath(currentX + 1, currentY, currentDistance);
                updatePath(currentX - 1, currentY, currentDistance);
                updatePath(currentX, currentY + 1, currentDistance);
                updatePath(currentX, currentY - 1, currentDistance);

            }

        }

    }

    // Clear the old path
    this.smartPath = [];
    updatePath(targetPoint.x, targetPoint.y, 0);
    this.updatePathWeights();

};

jzt.Board.prototype.updatePathWeights = function() {

    this.each(function(tile, point) {
        if(tile instanceof jzt.things.UpdateableThing) {
            tile.influenceSmartPath();
        }
    });

};

/**
 * Retrieves a precomputed weighted value indicating the number of steps toward a pre-specified target
 * in our smart path for a specified Point.
 *
 * @param point A Point for which to retrieve a smart value.
 * @return A weighted value indicating the number of steps toward a target.
 */
jzt.Board.prototype.getSmartValue = function(point) {

    var result;

    if(point.x >= this.width || point.x < 0 || point.y >= this.height || point.y < 0) {
        return Infinity;
    }

    result = this.smartPath[point.x + point.y * this.width];
    return result === undefined ? Infinity : result;

};

/**
 * Retrieves a direction toward the currently computed smart path target from a specified
 * Point.
 *
 * @param point A point from which to determine a direction toward our current smart target.
 * @return A Direction Point.
 */
jzt.Board.prototype.getSmartDirection = function(point) {

    var directions = [];
    var me = this;
    var currentMin = Infinity;
    var value;

    // For each direction...
    jzt.Direction.each(function(direction){

        // Get our smart path value
        value = me.getSmartValue(point.add(direction));

        // If it's the best one we've encountered...
        if(value < currentMin) {

            // Forget our previous directions
            directions = [];

            // Add this direction as our new favourite
            directions.push(direction);

            // Update our current minimum value
            currentMin = value;

        }

        // If it's the same as another value...
        else if(value === currentMin) {

            // Add this direction too
            directions.push(direction);

        }

    });

    // If no good directions were found, return undefined
    if(currentMin === Infinity) {
        return undefined;
    }

    // If we only found one direction, return it immediately
    if(directions.length <= 1) {
        return directions[0];
    }

    // Otherwise pick one of our equal values randomly
    return jzt.Direction.random(directions);

};

/**
 * Renders a visual message to a provided graphics context representing this Board's current
 * display message. 
 *
 * @param c A graphics context.
 */
jzt.Board.prototype.renderMessage = function(c) {
    
    var messagePoint = new jzt.Point();

    messagePoint.x = Math.floor((this.windowSize.x - this.displayMessage.length) / 2);
    messagePoint.y = this.windowSize.y - 1;

    this.game.resources.graphics.drawString(c, messagePoint, this.displayMessage, jzt.colors.Cycle, jzt.colors.Black);

    if(--this.displayMessageTick <= 0) {
        this.displayMessage = undefined;
    }
    
};