/**
 * JZT Board
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

import {Point, utilities, Direction} from './basic.js';
import {JztScript} from './jzt-script.js';
import {things, ThingFactory} from './things.js';
import {LightingService} from './lighting-service.js';
import {BoardRenderer} from './board-renderer.js';
import {PathService} from './path-service.js';
import * as i18n from './i18n.js';


/**
 * Board represents a single game board.
 *
 * @param boardData Serialized board data to load and use for this Board.
 * @param game A Game instance to serve as owner of this board
 */
class Board {
    constructor(boardData, game) {

    this.validateData(boardData);


    this.name = boardData.name;
    this.game = game;
    this.tiles = [];
    this.scripts = [];
    this.dark = boardData.dark;
    this.reenter = boardData.reenter;
    this.playerBulletThings = [];
    this.forwardUpdateSnapshot = [];
    this.reverseUpdateSnapshot = [];
    this.customRenderCount = 0;
    this.maxPlayerBullets = boardData.maxPlayerBullets !== undefined ? boardData.maxPlayerBullets : Infinity;
    this.playerBullets = 0;
    this.i18n = undefined;

    this.north = boardData.north;
    this.east = boardData.east;
    this.south = boardData.south;
    this.west = boardData.west;
    this.northOffset = boardData.northOffset || 0;
    this.eastOffset = boardData.eastOffset || 0;
    this.southOffset = boardData.southOffset || 0;
    this.westOffset = boardData.westOffset || 0;

    this.defaultPlayerX = boardData.playerX;
    this.defaultPlayerY = boardData.playerY;

    if (boardData.hasOwnProperty('entryPointX') && boardData.hasOwnProperty('entryPointY')) {
        this.entryPoint = new Point(boardData.entryPointX, boardData.entryPointY);
    }

    this.displayMessage = undefined;
    this.displayMessageTick = 0;

    this.DISPLAY_MESSAGE_TTL = game.FPS * 3; // 3 seconds

    this.width = boardData.width;
    this.height = boardData.height;
    this.pathService = new PathService(this.width, this.height);
    this.smartPath = this.pathService.values;
    this.smartPathQueue = this.pathService.queue;
    this.lightingService = new LightingService(this.width, this.height);
    this.boardRenderer = new BoardRenderer(this, game);

    this.initializeI18n(boardData.i18n);
    this.initializeScripts(boardData.scripts);
    this.initializeTiles(boardData.tiles);
    this.initializeWindow();

}
    get lightSources() {
        return this.lightingService.lightSources;
    }

    set lightSources(value) {
        this.lightingService.lightSources = value;
    }

    get lightGeometryCache() {
        return this.lightingService.lightGeometryCache;
    }

    set lightGeometryCache(value) {
        this.lightingService.lightGeometryCache = value;
    }

    get lightMask() {
        return this.lightingService.lightMask;
    }

    set lightMask(value) {
        this.lightingService.lightMask = value;
    }

    get previousLightMask() {
        return this.lightingService.previousLightMask;
    }

    set previousLightMask(value) {
        this.lightingService.previousLightMask = value;
    }

    get lightMaskDirty() {
        return this.lightingService.lightMaskDirty;
    }

    set lightMaskDirty(value) {
        this.lightingService.lightMaskDirty = value;
    }

    get customRenderSet() {
        return this.boardRenderer.customRenderSet;
    }

    set customRenderSet(value) {
        this.boardRenderer.customRenderSet = value;
    }

    get focusPoint() {
        return this.boardRenderer.focusPoint;
    }

    set focusPoint(value) {
        this.boardRenderer.focusPoint = value;
    }

    get windowSize() {
        return this.boardRenderer.windowSize;
    }

    set windowSize(value) {
        this.boardRenderer.windowSize = value;
    }

    get windowOrigin() {
        return this.boardRenderer.windowOrigin;
    }

    set windowOrigin(value) {
        this.boardRenderer.windowOrigin = value;
    }

    get windowLimit() {
        return this.boardRenderer.windowLimit;
    }

    set windowLimit(value) {
        this.boardRenderer.windowLimit = value;
    }

/**
 * Validates provided board data to make sure it contains some expected
 * properties for deserialization.
 *
 * @param data Data to be validated
 */
    validateData(data) {

    // Let's hope for the best...
    var valid = true;

    if (!data.height || !data.width) { valid = false; }
    if (typeof data.height !== 'number') { valid = false; }
    if (typeof data.width !== 'number') { valid = false; }
    if (data.height > 256 || data.height < 10) { valid = false; }
    if (data.width > 256 || data.width < 10) { valid = false; }
    if (!data.tiles || !(Array.isArray(data.tiles))) { valid = false; }
    if (!data.scripts || !(Array.isArray(data.scripts))) { valid = false; }

    if (!valid) {
        throw 'Invalid board data.';
    }

    }

/**
 * Serializes this Board instance to an object.
 *
 * @return An object representation of this board data.
 */
    serialize() {

    var result = {},
        index,
        script,
        message;

    result.name = this.name;

    utilities.storeOption(result, 'dark', this.dark);
    utilities.storeOption(result, 'displayMessage', this.displayMessage);
    utilities.storeOption(result, 'north', this.north);
    utilities.storeOption(result, 'east', this.east);
    utilities.storeOption(result, 'south', this.south);
    utilities.storeOption(result, 'west', this.west);
    utilities.storeOption(result, 'northOffset', this.northOffset);
    utilities.storeOption(result, 'eastOffset', this.eastOffset);
    utilities.storeOption(result, 'southOffset', this.southOffset);
    utilities.storeOption(result, 'westOffset', this.westOffset);
    utilities.storeOption(result, 'reenter', this.reenter);

    if (this.maxPlayerBullets !== Infinity) {
        result.maxPlayerBullets = this.maxPlayerBullets;
    }

    if (this.player) {
        result.playerX = this.player.point.x;
        result.playerY = this.player.point.y;
    } else {
        result.playerX = this.defaultPlayerX;
        result.playerY = this.defaultPlayerY;
    }

    if (this.entryPoint) {
        result.entryPointX = this.entryPoint.x;
        result.entryPointY = this.entryPoint.y;
    }

    result.width = this.width;
    result.height = this.height;
    result.tiles = [];
    result.scripts = [];

    // Store tiles
    this.each(function (tile) {
        if (tile) {
            result.tiles.push(tile.serialize());
        } else {
            result.tiles.push(0);
        }
    });

    // Store scripts
    for (index = 0; index < this.scripts.length; index += 1) {
        script = this.scripts[index];
        if (this.game.isEditor) {
            result.scripts.push({'name': script.name, 'rawScript': script.rawScript || script.script});
        } else {
            result.scripts.push(script.serialize());
        }
    }

    // Store i18n data
    if (this.i18n) {

        // Create an i18n container for our results
        result.i18n = {};

        // For each of our i18n values...
        for (index in this.i18n) {
            if (this.i18n.hasOwnProperty(index)) {

                // We are expecting a two-letter language code
                if (typeof this.i18n[index] === 'string' || index.length === 2) {

                    // Create an object for our language strings
                    result.i18n[index] = {};

                    for (message in this.i18n[index]) {
                        if (this.i18n[index].hasOwnProperty(message)) {
                            // If our value is a string, store it in our result
                            if (typeof this.i18n[index][message] === 'string') {
                                result.i18n[index][message] = this.i18n[index][message];
                            }
                        }
                    }

                }

            }
        }

    }

    return result;

    }

/**
 * Initializes scripts used by this Board based on provided script
 * data.
 *
 * @param scriptData Script data to be deserialized into Script instances.
 */
    initializeScripts(scriptData) {

    var index, script;

    // If we're in editor mode, there's no need to compile
    if (this.game.isEditor) {
        this.scripts = scriptData;
        return;
    }

    for (index = 0; index < scriptData.length; index += 1) {

        try {
            script = new JztScript(scriptData[index].name, scriptData[index].rawScript, true);
            this.scripts.push(script);
        } catch (exception) {
            this.game.notifyListeners('script-error', {scriptName: scriptData[index].name, error: exception});
        }


    }

    }

    initializeI18n(i18nData) {

    var language,
        entry;

    if (i18nData) {

        this.i18n = {};

        // For each of our i18n values...
        for (language in i18nData) {
            if (i18nData.hasOwnProperty(language)) {

                if (typeof language === 'string' && language.length === 2) {

                    // Create a section for our messages in this language
                    this.i18n[language] = {};

                    for (entry in i18nData[language]) {
                        if (i18nData[language].hasOwnProperty(entry)) {

                            // If our value is a string, store it in our result
                            if (typeof i18nData[language][entry] === 'string') {
                                this.i18n[language][entry] = i18nData[language][entry];
                            }

                        }
                    }

                }

            }
        }

    }

    }

    getScriptables(name) {

    var result = [];

    this.each(function (tile) {
        if (tile && tile.type === 'Scriptable') {

            if (!name || (tile.name && tile.name.toUpperCase() === name)) {
                result.push(tile);
            }

        }
    });

    return result;

    }

/**
 * Takes a provided player an initializes it for use on this board.
 *
 * @param A player instance to use on this board.
 */
    initializePlayer(player) {

    var scriptables,
        index,
        tile;

    // Check if our player is outside our range
    if (this.isOutside(player.point)) {

        // If so, use our default location
        player.point.x = this.defaultPlayerX;
        player.point.y = this.defaultPlayerY;

    }

    // Check if there's something at the player's position already.
    // Whatever it is, the player needs to go on top of it.
    tile = this.getTile(player.point);
    player.under = tile;

    this.player = player;
    this.setTile(player.point, player);
    this.player.board = this;
    this.updateLightSource(this.player);
    this.focusPoint = this.player.point;

    // If we don't have an entry point for this board, set it now
    if (!this.entryPoint) {
        this.entryPoint = player.point.clone();
    }

    // If we're not editing, send Scriptables the 'enter' message
    if (!this.game.isEditor) {
        scriptables = this.getScriptables();
        for (index = 0; index < scriptables.length; index += 1) {
            scriptables[index].sendMessage('ENTER');
        }
    }

    }

/*
 * Intializes tile data given a collection of serialized tiles.
 *
 * @param tileDataCollection an array of serialized tile data to be loaded
 *      into this Board.
 */
    initializeTiles(tileDataCollection) {

    var point = new Point(0, 0),
        index,
        tile,
        thing;

    for (index in tileDataCollection) {

        if (tileDataCollection.hasOwnProperty(index)) {

            tile = tileDataCollection[index];
            thing = ThingFactory.deserialize(tile, this);

            if (thing !== undefined) {
                this.setTile(point, thing);
                this.updateLightSource(thing);
            }

            point.x += 1;
            if (point.x >= this.width) {
                point.x = 0;
                point.y += 1;
            }

        }

    }

    }

/**
 * Updates the compact light source state for a provided thing.
 *
 * @param thing A thing that may provide a light source.
 */
    updateLightSource(thing) {

    if (this.game.isEditor || !this.dark || typeof (thing.getTorch) !== 'function') {
        return;
    }

    this.lightingService.updateLightSource(thing);

    }

/**
 * Invalidates a thing's registered light source.
 *
 * @param thing A thing whose light source changed.
 */
    invalidateLightSource(thing) {

    this.lightingService.invalidateLightSource(thing);

    }

/**
 * Retrieves cached circle geometry for a light radius.
 *
 * @param radius A light radius.
 * @return Cached row-span geometry centered at the origin.
 */
    getLightGeometry(radius) {

    return this.lightingService.getLightGeometry(radius);

    }

/**
 * Ensures that the current light mask is available.
 */
    ensureLightMask() {

    this.lightingService.ensureLightMask();

    }

/**
 * Rebuilds the current light mask from active light sources.
 */
    rebuildLightMask() {

    this.lightingService.rebuildLightMask();

    }

/**
 * Marks all registered light sources inactive before a board update.
 */
    prepareLightSources() {

    this.lightingService.prepareLightSources();

    }

/**
 * Removes light sources that were not observed during the current update.
 */
    pruneLightSources() {

    this.lightingService.pruneLightSources();

    }

    initializeWindow() {

    this.boardRenderer.initializeWindow();


    }

    updateWindowPosition() {

    this.boardRenderer.updateWindowPosition();

    }

/**
 * Retrieves a Script instance by its name for this Board.
 *
 * @param scriptName A name of a Script instance
 * @return A Script instance.
 */
    getScript(scriptName) {

    var index, script;

    if (scriptName && this.scripts) {

        for (index = 0; index < this.scripts.length; index += 1) {
            script = this.scripts[index];
            if (scriptName === script.name) {
                return script;
            }
        }

    }

    return undefined;

    }

/**
 * Executes a provided callback function for each tile on this Board,
 * providing the function with a Thing instance and the point at which
 * it occurs. If no thing instance is at a location, undefined is returned.
 *
 * @param callback A callback function to be executed for each tile
 */
    each(callback) {

    var values = this.tiles.slice(0),
        point = new Point(0, 0);

    for (point.y = 0; point.y < this.height; point.y += 1) {
        for (point.x = 0; point.x < this.width; point.x += 1) {
            callback(values[point.x + point.y * this.width], point);
        }
    }

    }

/**
 * Updates the maintained player-bullet collection after a tile replacement.
 *
 * @param previousTile The tile previously at the location.
 * @param tile The tile now at the location.
 */
    updatePlayerBulletCollection(previousTile, tile) {

    var index;

    if (previousTile && previousTile.type === 'Bullet' && previousTile.fromPlayer) {
        index = this.playerBulletThings.indexOf(previousTile);
        if (index >= 0) {
            this.playerBulletThings.splice(index, 1);
        }
    }

    if (tile && tile.type === 'Bullet' && tile.fromPlayer && this.playerBulletThings.indexOf(tile) < 0) {
        this.playerBulletThings.push(tile);
    }

    }
/**
 * Updates the count of top-level tiles with custom renderers.
 *
 * @param previousTile The tile previously at the location.
 * @param tile The tile now at the location.
 */
    updateCustomRenderCount(previousTile, tile) {

    if (previousTile && previousTile.render) {
        this.customRenderCount -= 1;
    }

    if (tile && tile.render) {
        this.customRenderCount += 1;
    }

    }


/**
 * Verifies that the player-bullet collection matches the current board tiles.
 *
 * This intentionally performs a full board scan and is only enabled for
 * development consistency checks.
 *
 * @return true when player-bullet membership is consistent.
 */
    assertCollectionConsistency() {

    var expectedPlayerBullets = [];

    this.eachDirect(function (tile) {
        if (tile && tile.type === 'Bullet' && tile.fromPlayer) {
            expectedPlayerBullets.push(tile);
        }
    });

    this.assertCollectionMatches('playerBulletThings', this.playerBulletThings, expectedPlayerBullets);
    return true;

    }

/**
 * Compares collection membership without requiring traversal order.
 *
 * @param name A collection name for error reporting.
 * @param actual The maintained collection.
 * @param expected The collection rebuilt from board tiles.
 */
    assertCollectionMatches(name, actual, expected) {

    var index;

    if (actual.length !== expected.length) {
        throw new Error(name + ' collection is stale.');
    }

    for (index = 0; index < expected.length; index += 1) {
        if (actual.indexOf(expected[index]) < 0) {
            throw new Error(name + ' collection is stale.');
        }
    }

    }
/**
 * Copies the current board tiles into reusable update storage.
 *
 * @param snapshot An array to reuse for the snapshot.
 * @return The populated snapshot array.
 */
    copyTileSnapshot(snapshot) {

    var index,
        size = this.width * this.height;

    snapshot.length = size;
    for (index = 0; index < size; index += 1) {
        snapshot[index] = this.tiles[index];
    }

    return snapshot;

    }

/**
 * Executes a callback over a provided tile snapshot in either traversal order.
 *
 * @param callback A callback function to be executed for each tile.
 * @param values A tile snapshot.
 * @param reverse Whether to traverse from the final tile backwards.
 */
    eachSnapshot(callback, values, reverse) {

    var point = new Point(0, 0),
        y = reverse ? this.height - 1 : 0,
        yEnd = reverse ? -1 : this.height,
        yStep = reverse ? -1 : 1,
        x,
        xEnd,
        xStep;

    for (; y !== yEnd; y += yStep) {
        x = reverse ? this.width - 1 : 0;
        xEnd = reverse ? -1 : this.width;
        xStep = reverse ? -1 : 1;
        point.y = y;

        for (; x !== xEnd; x += xStep) {
            point.x = x;
            callback(values[x + y * this.width], point);
        }
    }

    }

/**
 * Executes a provided callback function for each tile on this Board without
 * taking a snapshot of the tile collection.
 *
 * This is intended for read-only scans. Callers must not rely on mutation
 * isolation; use each() when callbacks can move or replace tiles.
 *
 * @param callback A callback function to be executed for each tile
 */
    eachDirect(callback) {

    var point = new Point(0, 0),
        index;

    for (point.y = 0; point.y < this.height; point.y += 1) {
        for (point.x = 0; point.x < this.width; point.x += 1) {
            index = point.x + point.y * this.width;
            callback(this.tiles[index], point);
        }
    }

    }

/**
 * Executes a provided callback function for each tile on this Board that falls within
 * the displayable window.
 *
 * This is a read-only traversal and does not snapshot the full tile collection.
 *
 * @param callback A callback function to be executed for each tile.
 */
    eachDisplayable(callback) {

    this.boardRenderer.eachDisplayable(callback);

    }

/**
 * Executes a provided callback function for each tile on this Board,
 * delivered in reverse order. The callback function will be provided with
 * a Thing instance and the point at which it occurs. If no Thing instance
 * is available at a location, undefined is returned.
 *
 * @param callback A callback function to be executed for each tile, in reverse.
 */
    eachBackwards(callback) {

    var values = this.tiles.slice(0),
        point = new Point(0, 0);

    for (point.y = this.height - 1; point.y >= 0; point.y -= 1) {
        for (point.x = this.width - 1; point.x >= 0; point.x -= 1) {
            callback(values[point.x + point.y * this.width], point);
        }
    }

    }


/**
 * Retrieves whether or not this Board has a provided number (or any) of a
 * specific tile type.
 *
 * @param {object} template - A Thing template object
 * @param {number} [count] - A minimum number of tiles on the board to test for, or undefined to test for any number
 */
    hasTile(template, count) {

    var tally = 0;

    this.each(function (tile) {

        if (tile && tile.equals(template)) {
            tally += 1;
        }

    });

    return count === undefined ? tally > 0 : count <= 0 ? tally <= 0 : tally >= count;

    }

/**
 * Changes all instances of tiles matching a provided template with a new instance based
 * on another provided template.
 *
 * @param fromTemplate A template to match existing things
 * @param toTemplate A template with which to replace matched things
 */
    changeTiles(fromTemplate, toTemplate) {

    var me = this,
        newThing;

    this.each(function (tile) {

        if (tile && tile.equals(fromTemplate)) {

            newThing = ThingFactory.deserialize(toTemplate, me);

            if (newThing && toTemplate.color === undefined) {
                newThing.foreground = tile.foreground;
            }

            me.replaceTile(tile.point, newThing);
        }

    });

    }

/**
 * Removes a tile from this Board at a provided Point. This function will also
 * update its internal representation to remove references to no-longer-used
 * tiles.
 *
 * @param point A point on this Board to delete.
 */
    deleteTile(point) {

    var thing = this.getTile(point);

    // Delete the tile
    if (thing) {
        this.setTile(point, thing.under);
    }

    }

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
    moveTile(oldPoint, newPoint, weak, ghost) {

    var thing = this.getTile(oldPoint),
        obstacle = this.getTile(newPoint),
        underOldThing,
        teleported;

    // If the coast is clear...
    if (this.isFree(newPoint)) {

        if (!ghost) {

            this.setTile(newPoint, thing);
            this.setTile(oldPoint, thing === undefined ? undefined : thing.under);

            if (thing !== undefined) {
                this.updatePlayerBulletCollection(undefined, thing);
            }
        }

        return true;
    }

    // If we are blocked, but the path is surrenderable...
    if (!this.isOutside(newPoint) && obstacle.isSurrenderable(thing)) {

        // Check if the obstacle is on something that's not surrenderable to us.
        if(obstacle.under && !obstacle.under.isSurrenderable(thing)) {
            return false;
        }

        if (!ghost) {
            // If our thing isn't undefined
            if (thing !== undefined) {
                underOldThing = thing.under;
                thing.under = obstacle;
            }

            this.setTile(newPoint, thing);
            this.setTile(oldPoint, underOldThing);
            this.updatePlayerBulletCollection(undefined, thing);
        }

        return true;

    }

    // If we couldn't move and we're not weak, try to push and try again
    if (!weak) {

        // If an obstacle was encountered
        if (obstacle) {

            // Check if the obstacle is on something that's not surrenderable to us.
            if(obstacle.under && !obstacle.under.isSurrenderable(thing)) {
                return false;
            }

            // Try to push the obstacle out of the way
            teleported = obstacle.push(oldPoint.directionTo(newPoint), thing);

            // If we were teleported, return true
            if (teleported) {

                return true;

            }

            // A space was freed up or surrenderable, so we can move
            if (this.isFree(newPoint) || this.getTile(newPoint).isSurrenderable(thing)) {
                return this.moveTile(oldPoint, newPoint, weak, ghost);
            }

        }
    }

    return false;
    }

/**
 * Assigns a tile to a specific Point on this Board. This function does
 * not check for saftey of this operation.
 *
 * @param point A point to be set to a specific tile
 * @param tile A tile to be set.
 */
    setTile(point, tile) {

    var index,
        previousTile;

    if (!this.isOutside(point)) {

        index = point.x + point.y * this.width;
        previousTile = this.tiles[index];
        if (previousTile && previousTile._lightSource) {
            this.invalidateLightSource(previousTile);
        }

        if (tile) {

            tile.point = point.clone();

            // If we're adding a player when we've already got one on the board elsewhere...
            if (tile.type === 'Player' && (!point.equals(this.player.point))) {

                // Remove the old player
                this.deleteTile(this.player.point);

                // Add our new player
                tile = this.player;
                tile.point = point.clone();
                this.initializePlayer(this.player);

            }

        }

        this.tiles[index] = tile;
        this.updatePlayerBulletCollection(previousTile, tile);
        this.updateCustomRenderCount(previousTile, tile);
        this.pathService.markDirty();

    }
    }


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
    addThing(point, thing, respectSurrenderabilty) {

    var oldThing = this.getTile(point);

    if (oldThing) {
        if (respectSurrenderabilty && oldThing.isSurrenderable(thing)) {
            thing.under = oldThing;
        } else {
            this.deleteTile(point);
        }
    }

    this.setTile(point, thing);

    }

/**
 * Returns whether or not a specific point is free or surrenderable to a provided Thing.
 *
 * @param point A point to test for
 * @param thing A thing used to test for surrenderability if a point is not free.
 * @return true if the provided spot is either free, or surrenderable to a provided thing.
 */
    isFreeOrSurrenderable(point, thing) {

    var obstacle = this.getTile(point);
    return !this.isOutside(point) && ((!obstacle) || (obstacle.isSurrenderable(thing)));

    }

/**
 * Retrieves a tile from this Board at a provided Point.
 *
 * @param point A point from which to retrieve a tile.
 * @return a Thing located at a provided Point, or undefined if no such
 *          this is available at a given Point.
 */
    getTile(point) {

    if (point.x >= this.width || point.x < 0 || point.y >= this.height || point.y < 0) {
        return undefined;
    }

    return this.tiles[point.x + point.y * this.width];

    }

/**
 * Replaces an existing tile at a given Point with a provided Thing.
 * This function checks for saftey.
 *
 * @param point A point on this Board to be replaced
 * @param A Thing to be added to a given point.
 */
    replaceTile(point, newTile) {
    this.deleteTile(point);
    this.addThing(point, newTile, true);
    }

/**
 * Returns true if a provided Point is located outside of this Board's
 * boundaries.
 *
 * @param point A point to check
 * @return true if a provided Point is outisde this Board's boundaries,
 *         false otherwise.
 */
    isOutside(point) {

    if (point.y < 0 || point.y >= this.height) {
        return true;
    }

    if (point.x < 0 || point.x >= this.width) {
        return true;
    }

    return false;

    }

/**
 * Returns true if a provided Point is located outside of this Board's visible
 * window boundary.
 *
 * @param point A point to check.
 * @return true if a provided Point is outside this Board's boundaries, false otherwise.
 */
    isOutsideWindow(point) {
    return this.boardRenderer.isOutsideWindow(point);
    }

/**
 * Returns whether or not a provided Point is unoccupied.
 *
 * @param point a Point to test.
 * @return true if a provided Point is free, false otherwise.
 */
    isFree(point) {

    return !this.isOutside(point) && (!this.getTile(point));

    }

/**
 * Requests to move this Board's player to a Board located
 * in a given direction relative to this Board.
 *
 * @param direction An adjacent board direction to which to
 *        relocate a player.
 */
    movePlayerOffBoard(direction) {

    var boardName,
        offset;

    // Find the board we are switching to
    switch (direction) {
    case Direction.North:
        boardName = this.north;
        offset = this.northOffset;
        break;
    case Direction.East:
        boardName = this.east;
        offset = this.eastOffset;
        break;
    case Direction.South:
        boardName = this.south;
        offset = this.southOffset;
        break;
    case Direction.West:
        boardName = this.west;
        offset = this.westOffset;
        break;
    default:
        return;
    }

    // Move our player to that board edge
    this.game.movePlayerToBoardEdge(Direction.opposite(direction), boardName, offset);

    }

/**
 * Retrieves a Passage with a provided ID from this board.
 *
 * @param passageId an ID of a passage to retrieve
 * @return A Passage instance.
 */
    getPassage(passageId) {

    var row, column, tile;

    for (row = 0; row < this.height; row += 1) {
        for (column = 0; column < this.width; column += 1) {
            tile = this.getTile(new Point(column, row));
            if (tile && tile.type === 'Passage' && tile.passageId === passageId) {
                return tile;
            }
        }
    }

    }

/**
 * Adds a provided message to this Board's queue of messages to globally
 * send to all UpdateableThings on this Board.
 *
 * @param message A message to be delivered to all UpdateableThings.
 */
    addMessage(message) {
    this.messageQueue.push(message);
    }

/**
 * Retrieves whether or not a provided point falls within any of this
 * Board's light sources.
 *
 * @param point A Point to test if it's inside a light source
 * @param thing A thing at the point to test if it's glowing (or lit by torches)
 * @param previousStep Whether to check if we were lit after the last cycle
 *           instead of the current cycle (which may or not be done updating).
 * @return true if a provided point is lit, false otherwise
 */
    isLit(point, thing, previousStep) {

    if (!this.dark) {
        return true;
    }

    if (thing && thing.glow) {
        return true;
    }

    return this.lightingService.isLit(point, previousStep);

    }

/**
 * Returns whether or not another player bullet is permissable on the board
 * after the most recent update.
 *
 * @param displayMessage Whether or not to display a message if no shooting is allowed, ever.
 * @return true if another player bullet is allowed, false otherwise
 */
    canPlayerShoot(displayMessage) {

    if (displayMessage && this.maxPlayerBullets <= 0) {
        this.setDisplayMessage(i18n.getMessage('status.noshoot'));
    }

    return this.playerBullets < this.maxPlayerBullets;

    }

/**
 * Updates this Board instance by one tick in an execution cycle. This will also
 * update all UpdateableThings on this Board.
 */
    update() {

    var me = this;

    if (this.dark) {
        this.lightingService.beginUpdate();
    }

    // Update the smart path only when the target or path topology changed.
    if (this.pathService.needsUpdate(this.player.point)) {
        this.updateSmartPath(this.player.point);
    }

    this.playerBullets = this.playerBulletThings.length;

    // Snapshot the full board so movement during the forward pass cannot
    // update a tile twice.
    this.forwardUpdateSnapshot = this.copyTileSnapshot(this.forwardUpdateSnapshot);
    this.eachSnapshot(function (tile) {

        if (tile) {

            if (
                typeof tile.update === 'function' &&
                typeof tile.updateOnReverse === 'function' &&
                tile.type !== 'Player' &&
                !tile.updateOnReverse()
            ) {
                tile.update();
            }

            if (tile.under && tile.under.updateWhileUnder) {
                tile.under.updateWhileUnder();
            }



            if (tile.type !== 'Player') {
                me.updateLightSource(tile);
            }
        }

    }, this.forwardUpdateSnapshot, false);

    // The reverse pass reflects mutations made during the forward pass.
    this.reverseUpdateSnapshot = this.copyTileSnapshot(this.reverseUpdateSnapshot);
    this.eachSnapshot(function (tile) {

        if (
            tile &&
            typeof tile.update === 'function' &&
            typeof tile.updateOnReverse === 'function' &&
            tile.type !== 'Player' &&
            tile.updateOnReverse()
        ) {
            tile.update();
        }

    }, this.reverseUpdateSnapshot, true);

    if (this.player) {
        this.updateLightSource(this.player);
    }

    if (this.dark) {
        this.lightingService.finishUpdate();
    }

    if (this.game.debugCollections) {
        this.assertCollectionConsistency();
    }

    }

/**
 * Returns whether or not this Board is the same as another board, either by
 * name or reference.
 *
 * @param otherBoard another Board or name of another board to test for equality.
 * @return true if this Board is the same by name, false otherwise
 */
    equals(otherBoard) {

    var otherName = (otherBoard instanceof Board) ? otherBoard.name : otherBoard;
    return this.name === otherName;

    }

/**
 * Assigns a message to be temporarily displayed at the bottom of this Board.
 *
 * @param message a message to be displayed.
 */
    setDisplayMessage(message, duration) {

    if (message !== undefined) {
        this.displayMessage = ' ' + message + ' ';
        if (this.displayMessage.length > this.windowSize.x) {
            this.displayMessage = this.displayMessage.substring(0, this.windowSize.x);
        }
        this.displayMessageTick = duration ? this.game.FPS * duration : this.DISPLAY_MESSAGE_TTL;
    } else {
        this.displayMessage = undefined;
        this.displayMessageTick = 0;
    }
    }

/**
 * Renders a visual representation of this Board to a provided graphics
 * context.
 *
 * @param c A graphics context.
 */
    render(c) {

    this.boardRenderer.render(c);

    }

/**
 * Sets a point on the "smart path" to be weighted differently, creating either an aversion
 * point or an attraction point.
 */
    adjustSmartPathWeight(point, strengthDelta) {

    this.pathService.adjustWeight(point, strengthDelta);
    }


/**
 * Precomputes a "smart path" toward a provided target point. This will add path-finding information
 * that can be queried to find a most efficient path from any point on the grid toward this target.
 *
 * @param targetPoint A target point to which the smart path should be computed.
 */
    updateSmartPath(targetPoint) {

    this.pathService.update(targetPoint, this.tiles, this.playerBulletThings);

    }

    updatePathWeights() {

    var index,
        bullet;

    for (index = 0; index < this.playerBulletThings.length; index += 1) {
        bullet = this.playerBulletThings[index];
        if (bullet && !bullet.removed) {
            bullet.influenceSmartPath();
        }
    }

    }

/**
 * Retrieves a precomputed weighted value indicating the number of steps toward a pre-specified target
 * in our smart path for a specified Point.
 *
 * @param point A Point for which to retrieve a smart value.
 * @return A weighted value indicating the number of steps toward a target.
 */
    getSmartValue(point) {

    return this.pathService.getValue(point);

    }

/**
 * Retrieves a direction toward the currently computed smart path target from a specified
 * Point.
 *
 * @param point A point from which to determine a direction toward our current smart target.
 * @return A Direction Point.
 */
    getSmartDirection(point) {

    return this.pathService.getDirection(point);

    }

    getMessage(key) {

    var result,
        language = i18n.getLanguage();

    result = this.getMessageForLanguage(language, key);

    // If no message was found and we haven't tried the default language...
    if (result === undefined && language !== i18n.DefaultLanguage) {
        result = this.getMessageForLanguage(i18n.DefaultLanguage, key);
    }

    return result !== undefined ? result : '??? ' + key + ' ???';

    }

    getMessageForLanguage(language, key) {

    if (this.i18n && this.i18n.hasOwnProperty(language) && this.i18n[language].hasOwnProperty(key)) {
        return this.i18n[language][key];
    }

    }

/**
 * Indicates to this board that the player has been hurt. This will display
 * a message on the screen and re-enter if applicable.
 */
    playerHurt() {

    this.setDisplayMessage(i18n.getMessage('status.hurt'));

    if (this.reenter) {
        this.moveTile(this.player.point, this.entryPoint);
    }

    }

/**
 * Renders a visual message to a provided graphics context representing this Board's current
 * display message.
 *
 * @param c A graphics context.
 */
    renderMessage(c) {

    this.boardRenderer.renderMessage(c);

    }

}

export { Board };
