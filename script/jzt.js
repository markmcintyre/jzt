/**
 * JZT Game
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jzt = jzt || {};

/**
 * GameState is an enumerated type representing a state in our game's finite state
 * machine.
 */
jzt.GameState = {
    Playing: 0,
    Paused: 1,
    GameOver: 2,
    Reading: 3,
    Title: 4,
    Victory: 5,
    FileManagement: 6
};

/**
 * Game represents a playable JZT game, including all Boards and a player.
 *
 * @param canvasElement An HTML5 Canvas element in which to display this Game.
 * @param data Serialized game data to be loaded
 * @param onLoadCallback A callback function to be executed once this Game
 *        and its assets have been loaded and initialized.
 */
jzt.Game = function(canvasElement, data, onLoadCallback) {
    
    var graphicsLoadedCallback;

    this.FPS = 30;
    this.CPS = 10;
    this.CYCLE_RATE = Math.round(this.FPS / this.CPS);
    this.CYCLE_TICKS = Math.floor(1000 / this.FPS) * this.CYCLE_RATE;
    this.FPS_INTERVAL = 1000 / this.FPS;
    
    this.loopId = undefined;

    this.onLoadCallback = onLoadCallback;
    this.resources = {};
    this.player = undefined;
    this.keyboard = new jzt.KeyboardInput();
    this.canvasElement = canvasElement;
    if(window.devicePixelRatio) {
        canvasElement.style.width = canvasElement.width + 'px';
        canvasElement.style.height = canvasElement.height + 'px';
        canvasElement.width = canvasElement.width * window.devicePixelRatio;
        canvasElement.height = canvasElement.height * window.devicePixelRatio;
    }
    this.context = canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    this.deserialize(data);

    this.resources.audio = new jzt.Audio();
    graphicsLoadedCallback = this.onGraphicsLoaded.bind(this);
    this.resources.graphics = new jzt.Graphics(graphicsLoadedCallback);

    if(window.devicePixelRatio) {
        this.resources.graphics.TILE_SIZE.x = this.resources.graphics.TILE_SIZE.x * window.devicePixelRatio;
        this.resources.graphics.TILE_SIZE.y = this.resources.graphics.TILE_SIZE.y * window.devicePixelRatio;
    }

    this.screenWidth = Math.floor(this.context.canvas.width / this.resources.graphics.TILE_SIZE.x);
    this.screenHeight = Math.floor(this.context.canvas.height / this.resources.graphics.TILE_SIZE.y);

};

jzt.Game.prototype.serialize = function() {

    var result = {};
    var index;

    result.name = this.name;
    result.titleBoard = this.titleBoard;
    result.startingBoard = this.currentBoard.name;
    result.victoryBoard = this.victoryBoard;
    result.author = this.author;
    result.boards = [];
    result.counters = {};
    result.savedGame = true;

    for(index in this.counters) {
        if(this.counters.hasOwnProperty(index) && !isNaN(this.counters[index])) {
            result.counters[index] = this.counters[index];
        }
    }

    // Serialize our current board
    this.boards[this.currentBoard.name] = this.currentBoard.serialize();

    for(index in this.boards) {
        if(this.boards.hasOwnProperty(index)) {
            result.boards.push(this.boards[index]);
        }
    }

    return result;

};

jzt.Game.prototype.deserialize = function(data) {

    var index;
    var isRunning;

    // If we're already running, end the game loop
    if(this.loopId) {
        isRunning = true;
        this.end();
    }

    this.name = data.name;
    this.currentBoard = undefined;
    this.titleBoard = data.titleBoard;
    this.startingBoard = data.startingBoard;
    this.victoryBoard = data.victoryBoard;
    this.author = data.author;
    this.boards = {};
    this.readMessages = {};

    data.savedGame = data.savedGame ? true : false;
    
    // Initialize our default counters
    this.counters = {
        health: 50,
        health_max: 50,
        ammo: 0,
        gems: 0,
        torches: 0,
        score: 0
    };

    for(index in data.counters) {
        if(data.counters.hasOwnProperty(index) && !isNaN(data.counters[index])) {
            this.counters[index] = data.counters[index];
        }
    }

    for(index = 0; index < data.boards.length; ++index) {
        var board = data.boards[index];
        this.boards[board.name] = board;
    }

    // If we were running, resume the game loop
    if(isRunning) {
        this.run();
    }

};

/**
 * Adjusts a game counter by a provided value offset. This offset may be
 * positive (to increase the counter), or negative (to decrease it).
 *
 * @param counter A name of a counter
 * @param value A value by which to adjust a counter
 */
jzt.Game.prototype.adjustCounter = function(counter, value) {
    this.setCounterValue(counter, this.getCounterValue(counter) + value);
};

jzt.Game.prototype.getCounterValue = function(counter) {
    if(this.counters[counter] === undefined) {
        return 0;
    }
    else {
        return this.counters[counter];
    }
};

/**
 * Assigns a provided game counter to a provided value.
 *
 * @param counter A name of a counter to be assigned a value.
 * @param value A value for a counter.
 */
jzt.Game.prototype.setCounterValue = function(counter, value) {

    var maxCounter = counter + '_max';

    // If the counter doesn't already exist, create it now
    if(this.counters[counter] === undefined) {
        this.counters[counter] = 0;
    }

    // If we have a corresponding maximum, ensure we don't exceed it
    if(this.counters[maxCounter] && (value > this.counters[maxCounter])) {
        value = this.counters[maxCounter];
    }

    // If our value is less or equal to zero, remove the counter entirely
    if(value <= 0) {
        delete this.counters[counter];
    }

    // Otherwise assign our counter value
    else {
        this.counters[counter] = value;
    }

};

/**
 * A callback function to be executed once all graphic assets have been
 * loaded.
 */
jzt.Game.prototype.onGraphicsLoaded = function() {
    this.scroll = new jzt.Scroll(this);
    this.fileManagement = new jzt.FileManagement(this);
    this.DARK_PATTERN = this.context.createPattern(this.resources.graphics.DARK_IMAGE, 'repeat');
    this.onLoadCallback();
};

/**
 * Moves this Game's Player instance to a specified Passage id on a given board name. This will cause
 * a new Board to be loaded as the current board, and the player to be located at the provided Passage.
 *
 * @param passageId An ID of a Passage
 * @param boardName A name of a Board to be loaded.
 */
jzt.Game.prototype.movePlayerToPassage = function(passageId, boardName) {

    // Retrieve our new board (or the current board if it's the same)
    var newBoard = (boardName === this.currentBoard.name) ? this.currentBoard : this.getBoard(boardName);

    // If the specified board does not exist, return
    if(newBoard === undefined) {
        return;
    }

    var passage = newBoard.getPassage(passageId);

    if(passage) {
        newBoard.entryPoint = passage.point;
        this.setBoard(newBoard, passage.point);
        this.setState(jzt.GameState.Paused);
    }

};

/**
 * Assigns a GameState to this Game instance, changing the current state of this Game's finite
 * state machine.
 *
 * @param state A GameState to be assigned to this Game.
 */
jzt.Game.prototype.setState = function(state) {

    // If we are to pause the game...
    if(state === jzt.GameState.Paused) {

        // Blink the player
        this.player.background = this.player.background.lighten();

        // Cancel all keyboard input
        this.keyboard.cancelInput();

        // Remember our pause time
        this.pauseStart = Date.now();

    }

    // If we are to resume playing...
    else if(state === jzt.GameState.Playing) {

        // Forget if P was pressed
        this.keyboard.cancelKey(this.keyboard.P);

        // If we were previously on the title screen...
        if(this.state === jzt.GameState.Title) {

            // Forget everything about our current board
            this.currentBoard = undefined;

            // Load our starting board
            this.setBoard(this.startingBoard);

        }

        // Calculate our pause duration and notify our player
        if(this.pauseStart) {
            this.player.onUnpause(Date.now() - this.pauseStart);
            delete this.pauseStart;
        }

        // Reset our player display
        this.player.hidden = false;
        this.player.background = this.player.background.darken();

    }

    // If we are to start reading
    else if(state === jzt.GameState.Reading) {

        // Remember our pause time
        this.pauseStart = Date.now();

        this.scroll.open();

    }

    // If we are to enter file management
    else if(state === jzt.GameState.FileManagement) {

        // Remember our pause time
        this.pauseStart = Date.now();

        this.fileManagement.open();

    }

    // If it's game over
    else if(state === jzt.GameState.GameOver) {

        // Stop all scheduled audio
        this.resources.audio.cancel();

        // Play our game over sound
        this.resources.audio.play('s-cd#g+c-ga#+dgfg#+cf---q.c', true);

        // Deactivate subsequent audio output
        this.resources.audio.setActive(false);
        
    }

    // If it's the title screen
    else if(state === jzt.GameState.Title) {

        if(this.titleBoard) {
            this.setBoard(this.titleBoard);
        }
        else {
            this.setBoard(this.startingBoard);
        }

        // The player shouldn't be on the board
        if(this.player) {
            this.player.remove();
            this.player.point.x = -1;
            this.player.point.y = -1;
        }

    }

    // If it's a victory
    else if(state === jzt.GameState.Victory) {

        if(this.victoryBoard) {
            this.setBoard(this.victoryBoard);
        }

        this.player.hidden = true;

    }

    // Assign our new state
    this.state = state;

};

/**
 * Moves this Game's Player instance to a specified edge of a given board name.
 * This will cause a new Board to be loaded as the current board, and the player
 * to be located at a given edge of that board, keeping the player's old perpendicular
 * coordinate.
 *
 * @param edge A Direction representing an edge of a board
 * @param boardName A name of a Board to be loaded.
 */ 
jzt.Game.prototype.movePlayerToBoardEdge = function(edge, boardName, offset) {

    // Retrieve our new board (or the current board if it's the same)
    var newBoard = (boardName === this.currentBoard.name) ? this.currentBoard : this.getBoard(boardName);

    // If the board specified does not exist, return
    if(newBoard === undefined) {
        return;
    }

    // Initialize our new location to the player position
    var outsideLocation = new jzt.Point(this.player.point.x, this.player.point.y);
    var newLocation = new jzt.Point(this.player.point.x, this.player.point.y);

    // Adjust based on our offset
    if(offset && (edge === jzt.Direction.North || edge == jzt.Direction.South)) {
        outsideLocation.x = outsideLocation.x + offset;
        newLocation.x = newLocation.x + offset
    }
    else if(offset && (edge === jzt.Direction.East || edge === jzt.Direction.West)) {
        outsideLocation.y = outsideLocation.y + offset;
        newLocation.y = newLocation.y + offset;
    }

    switch(edge) {
        case jzt.Direction.North:
            outsideLocation.y = -1;
            newLocation.y = 0;
            break;
        case jzt.Direction.East:
            outsideLocation.x = newBoard.width;
            newLocation.x = newBoard.width-1;
            break;
        case jzt.Direction.South:
            outsideLocation.y = newBoard.height;
            newLocation.y = newBoard.height-1;
            break;
        case jzt.Direction.West:
            outsideLocation.x = -1;
            newLocation.x = 0;
    }

    // If the player cannot move to this location, return immediately
    if(!newBoard.moveTile(outsideLocation, newLocation, false, true)) {
        return;
    }

    // Set the current board to our new board
    newBoard.entryPoint = newLocation;
    this.setBoard(newBoard, newLocation);

};

/**
 * Retrieves a deserialized Board instance by name.
 * 
 * @param name A name of a Board.
 */
jzt.Game.prototype.getBoard = function(name) {
    
    if(this.boards.hasOwnProperty(name)) {
        return new jzt.Board(this.boards[name], this);
    }

};

/**
 * Assigns a given board or board name as this Game's current board,
 * and relocates this Game's player to a provided location.
 *
 * @param board A name of a Board or a Board instance itself to be 
 *              set as this Game's active board.
 * @param playerPoint An optional Point to which to relocate this Game's
 *              player. If no such Point is provided, the player's old
 *              position will be used, or if that point it outside the new
 *              Board's boundaries, the board's default player position.
 */
jzt.Game.prototype.setBoard = function(board, playerPoint) {

    var properties;

    // First, erase the old player position if applicable
    if(this.currentBoard) {
        this.currentBoard.setTile(this.player.point, this.player.under);
    }

    // If we aren't moving to the same board as before...
    if(!(this.currentBoard && this.currentBoard.equals(board))) {

        // Serialize the old board, if applicable
        if(this.currentBoard !== undefined) {
            this.boards[this.currentBoard.name] = this.currentBoard.serialize();
        }

        // If we were given an actual board, assign that
        if(board instanceof jzt.Board) {
            this.currentBoard = board;
        }

        // Otherwise, load it
        else {
            this.currentBoard = new jzt.Board(this.boards[board], this);
        }

        // Export our old player properties, if applicable
        if(this.player) {
            properties = this.player.getProperties();
        }

        // Construct our new player for this board
        this.player = new jzt.things.Player(this.currentBoard);
        this.player.game = this;

        // Assign our exported properties, if applicable
        if(properties) {
            this.player.setProperties(properties);
        }

    }

    // Assign the player to our new board
    if(playerPoint) {
        this.player.point.x = playerPoint.x;
        this.player.point.y = playerPoint.y;
        this.player.under = this.currentBoard.getTile(playerPoint);
    }

    // If the board is dark, tell the player
    if(this.currentBoard.dark) {
        this.oneTimeMessage('status.dark');
    }

    this.currentBoard.initializePlayer(this.player);

};
    
/**
 * Starts this Game's loop, effectively starting this Game.
 */
jzt.Game.prototype.run = function() {

    // If our game loop isn't already running
    if(! this.loopId) {
        this.keyboard.initialize();

        if(this.savedGame) {
            this.setBoard(this.startingBoard);
            this.setState(jzt.GameState.Paused);
        }
        else {
            this.setState(jzt.GameState.Title);
        }

        this.boundLoop = this.loop.bind(this);
        this.then = Date.now();
            
        // Start the game loop
        this.loopId = requestAnimationFrame(this.boundLoop);
    }

};
  
/**
 * Executes a single cycle of this Game's primary loop, effectively running
 * this Game for a single graphics tick.
 *
 * TODO: Use performance.now() and the parameter passed to this function by 
 * requestAnimationFrame to do timing once browser support improves.
 */  
jzt.Game.prototype.loop = function() {

    var now = Date.now();

    var delta = now - this.then;

    this.loopId = requestAnimationFrame(this.boundLoop);

    if(delta > this.FPS_INTERVAL) {
        this.then = now - (delta % this.FPS_INTERVAL)
        this.update();
        this.draw();
    }

};

/**
 * Ends the game completely.
 */
jzt.Game.prototype.end = function() {

    // Stop the game loop if it's running
    if(this.loopId) {

        cancelAnimationFrame(this.loopId);
        this.loopId = undefined;

    }

}

/**
 * Updates this Game's state by one execution tick.
 */
jzt.Game.prototype.update = function() {

    // Update our graphics resource
    this.resources.graphics.update();

    // If we're playing...
    if(this.state === jzt.GameState.Playing) {

        this.currentBoard.update();
        this.checkCounters();

        // Update the player
        this.player.update();

        // Update our focus point
        this.currentBoard.focusPoint = this.player.point;

        // Check if the user wants to pause
        if(this.keyboard.isPressed(this.keyboard.P)) {
            this.setState(jzt.GameState.Paused);
        }

        // Check if the user wants to save
        else if(this.keyboard.isPressed(this.keyboard.S)) {
            this.fileManagement.dialogType = jzt.FileManagement.Type.SAVE;
            this.setState(jzt.GameState.FileManagement);
        }

        // Check if the user wants to restore
        else if(this.keyboard.isPressed(this.keyboard.R)) {
            this.fileManagement.dialogType = jzt.FileManagement.Type.OPEN;
            this.setState(jzt.GameState.FileManagement);
        }

    }

    // If we're paused...
    else if(this.state === jzt.GameState.Paused) {

        // Unpause on any expected keypress
        if(this.keyboard.isAnyPressed()) {
            this.keyboard.cancelKey(this.keyboard.P);
            this.setState(jzt.GameState.Playing);
            this.player.foregroundColor = jzt.colors.Colors.F;
        }

    }

    // If we're reading...
    else if(this.state === jzt.GameState.Reading) {

        this.scroll.update();

    }

    // If it's file management...
    else if(this.state === jzt.GameState.FileManagement) {

        this.fileManagement.update();

    }

    // If it's game over, say so!
    else if(this.state === jzt.GameState.GameOver) {
        this.currentBoard.update();
        this.currentBoard.setDisplayMessage(jzt.i18n.getMessage('status.gameover'));
    }

    // If we're on the title screen...
    else if(this.state === jzt.GameState.Title) {

        this.currentBoard.update();
        this.currentBoard.setDisplayMessage(jzt.i18n.getMessage('status.title'));

        // Also check if the user wants to play
        if(this.keyboard.isPressed(this.keyboard.P) || this.keyboard.isPressed(this.keyboard.SPACE)) {
            this.keyboard.cancelKey(this.keyboard.P);
            this.setState(jzt.GameState.Playing);
        }

    }

    // If we've won
    else if(this.state === jzt.GameState.Victory) {

        this.currentBoard.update();

    }

};

/**
 * Checks this Game instance's counters and updates the game state as necessary.
 */
jzt.Game.prototype.checkCounters = function() {

    // If our player is dead, and it's not already GameOver state
    if(this.getCounterValue('health') <= 0 && this.state !== jzt.GameState.GameOver) {

        // Assign our state to be GameOVer
        this.setState(jzt.GameState.GameOver);

    }

};

/**
 * Displays a short, localizable message exactly once.
 *
 * @param messageKey A localization key for a message to display.
 */
jzt.Game.prototype.oneTimeMessage = function(messageKey) {

    var message;

    // If we haven't already shown this message...
    if(!this.readMessages.hasOwnProperty(messageKey)) {

        // Remember that we've shown this message now.
        this.readMessages[messageKey] = true;

        // Retrieve our message
        message = jzt.i18n.getMessage(messageKey);

        // Display it.
        this.currentBoard.setDisplayMessage(message);

    }

};
    
jzt.Game.prototype.drawPauseScreen = function() {

    var spriteGrid;
    var position;
    var value;
    var sprite;
    var keyValues = ['9', 'A', 'B', 'C', 'D', 'E', 'F'];
    var pauseWidth = 24;
    var me = this;

    function getCounterValue(counter) {
        var result = me.getCounterValue(counter).toString();
        if(me.getCounterValue(counter + '_max')) {
            result += '/' + me.getCounterValue(counter + '_max').toString();
        }
        return result;
    }

    // If we haven't yet defined a status popup in our language, do it now
    if(this.statusPopup === undefined || this.statusPopup.language !== jzt.i18n.Messages.currentLanguage) {
        this.statusPopup = new jzt.ui.Popup(new jzt.Point(this.screenWidth - (pauseWidth+1),1), new jzt.Point(pauseWidth,10), this);
        this.statusPopup.language = jzt.i18n.Messages.currentLanguage;
        spriteGrid = this.statusPopup.spriteGrid;
        value = jzt.i18n.getMessage('pause.paused');
        spriteGrid.addText(new jzt.Point(Math.floor((pauseWidth-value.length)/2), 1), value, jzt.colors.White);
        spriteGrid.addText(new jzt.Point(1, 3), jzt.i18n.getMessage('pause.health'), jzt.colors.Yellow);
        spriteGrid.addText(new jzt.Point(1, 4), jzt.i18n.getMessage('pause.ammo'), jzt.colors.Yellow);
        spriteGrid.addText(new jzt.Point(1, 5), jzt.i18n.getMessage('pause.gems'), jzt.colors.Yellow);
        spriteGrid.addText(new jzt.Point(1, 6), jzt.i18n.getMessage('pause.torches'), jzt.colors.Yellow);
        spriteGrid.addText(new jzt.Point(1, 7), jzt.i18n.getMessage('pause.score'), jzt.colors.Yellow);
        spriteGrid.addText(new jzt.Point(1, 8), jzt.i18n.getMessage('pause.keys'), jzt.colors.Yellow);
    }

    // Make sure we don't position our popup over the player
    if(this.player.point.x >= this.currentBoard.windowOrigin.x + (this.screenWidth - pauseWidth - 2)) {
        this.statusPopup.position.x = 1;
    }
    else {
        this.statusPopup.position.x = this.screenWidth - (pauseWidth + 1);
    }

    position = this.statusPopup.position;
    this.statusPopup.render(this.context);

    // Draw our status values
    this.resources.graphics.drawString(this.context, position.add(new jzt.Point(13, 3)), getCounterValue('health'), jzt.colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new jzt.Point(13, 4)), getCounterValue('ammo'), jzt.colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new jzt.Point(13, 5)), getCounterValue('gems'), jzt.colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new jzt.Point(13, 6)), getCounterValue('torches'), jzt.colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new jzt.Point(13, 7)), getCounterValue('score'), jzt.colors.BrightWhite);

    // Draw our keys
    position = position.add(new jzt.Point(13, 8));
    sprite = this.resources.graphics.getSprite(12);
    for(value = 0; value < keyValues.length; ++value) {
        if(this.getCounterValue('key' + keyValues[value]) > 0) {
            sprite.draw(this.context, position, jzt.colors.deserializeForeground(keyValues[value]));
            position.x++;
        }
    }
}

/**
 * Renders a visual representation of this Game to its associated HTML5 Canvas element.
 */
jzt.Game.prototype.draw = function() {

    // Render the current board
    this.currentBoard.render(this.context);

    // If we're paused, draw our status
    if(this.state === jzt.GameState.Paused) {
        this.drawPauseScreen();
    }

    // If we are reading, also render our scroll instance
    if(this.state === jzt.GameState.Reading) {
        this.scroll.render(this.context);
    }

    // If we're in file management, render our file management instance
    if(this.state === jzt.GameState.FileManagement) {
        this.fileManagement.render(this.context);
    }
            
};