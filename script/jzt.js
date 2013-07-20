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
    Reading: 3
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
    
    this.FPS = 30;
    this.CPS = 10;
    this.CYCLE_RATE = Math.round(this.FPS / this.CPS);
    this.CYCLE_TICKS = Math.floor(1000 / this.FPS) * this.CYCLE_RATE;

    this.intervalId = undefined;
    
    this.onLoadCallback = onLoadCallback;
    this.resources = {};
    this.player = undefined;
    this.keyboard = new jzt.KeyboardInput();
    this.canvasElement = canvasElement;
    this.context = canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;
    
    this.counters = {
        health: 100,
        ammo: 0,
        gems: 0,
        torches: 0,
        score: 0
    };

    this.currentBoard = undefined;
    this.startingBoard = data.startingBoard;
    this.boards = {};

    // Store our boards
    for(var index = 0; index < data.boards.length; ++index) {
        var board = data.boards[index];
        this.boards[board.name] = board;
    }
    
    var graphicsLoadedCallback = this.onGraphicsLoaded.bind(this);
    this.resources.graphics = new jzt.Graphics(graphicsLoadedCallback);
    this.resources.audio = new jzt.Audio();

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

    // If the counter doesn't already exist, create it now
    if(this.counters[counter] === undefined) {
        this.counters[counter] = 0;
    }

    // Values cannot be less than zero
    if(value < 0) {
        value = 0;
    }

    // Set our value
    this.counters[counter] = value;

};

/**
 * A callback function to be executed once all graphic assets have been
 * loaded.
 */
jzt.Game.prototype.onGraphicsLoaded = function() {
    this.scroll = new jzt.Scroll(this);
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

    }

    // If we are to resume playing...
    else if(state === jzt.GameState.Playing) {

        // Forget if P was pressed
        delete this.keyboard.cancelKey[this.keyboard.P];

        // Clear any active display message
        this.currentBoard.setDisplayMessage(undefined);

        // No longer blink the player
        this.player.background = this.player.background.darken();

    }

    // If we are to start reading
    else if(state === jzt.GameState.Reading) {
        this.scroll.open();
    }

    else if(state === jzt.GameState.GameOver) {

        // Stop all scheduled audio
        this.resources.audio.cancel();

        // Play our game over sound
        this.resources.audio.play('s-cd#g+c-ga#+dgfg#+cf---q.c', true);

        // Deactivate subsequent audio output
        this.resources.audio.setActive(false);
        
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
jzt.Game.prototype.movePlayerToBoardEdge = function(edge, boardName) {

    // Retrieve our new board (or the current board if it's the same)
    var newBoard = (boardName === this.currentBoard.name) ? this.currentBoard : this.getBoard(boardName);

    // If the board specified does not exist, return
    if(newBoard === undefined) {
        return;
    }

    // Initialize our new location to the player position
    var outsideLocation = new jzt.Point(this.player.point.x, this.player.point.y);
    var newLocation = new jzt.Point(this.player.point.x, this.player.point.y);

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
    if(!newBoard.moveTile(outsideLocation, newLocation)) {
        return;
    }

    // Set the current board to our new board
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

        // Construct our new player for this board
        this.player = new jzt.things.Player(this.currentBoard);
        this.player.game = this;

    }

    // Assign the player to our new board
    if(playerPoint) {
        this.player.point.x = playerPoint.x;
        this.player.point.y = playerPoint.y;
        this.player.under = this.currentBoard.getTile(playerPoint);
    }

    this.currentBoard.initializePlayer(this.player);

};
    
/**
 * Starts this Game's loop, effectively starting this Game.
 */
jzt.Game.prototype.run = function() {

    this.keyboard.initialize();
    this.setBoard(this.startingBoard);
    this.setState(jzt.GameState.Paused);
        
    // Start the game loop
    this.intervalId = setInterval(this.loop.bind(this), 1000 / this.FPS);
        
};
  
/**
 * Executes a single cycle of this Game's primary loop, effectively running
 * this Game for a single graphics tick.
 */  
jzt.Game.prototype.loop = function() {

    this.update();
    this.draw();

};

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

        // Also check if the user wants to pause
        if(this.keyboard.isPressed(this.keyboard.P)) {
            this.setState(jzt.GameState.Paused);
        }

    }

    // If we're paused...
    else if(this.state === jzt.GameState.Paused) {

        // Unpause on any expected keypress
        if(this.keyboard.isAnyPressed()) {
            this.setState(jzt.GameState.Playing);
            this.player.foregroundColor = jzt.colors.Colors.F;
        }

    }

    else if(this.state === jzt.GameState.Reading) {

        this.scroll.update();

    }

    // If it's game over, say so!
    else if(this.state === jzt.GameState.GameOver) {
        this.currentBoard.update();
        this.currentBoard.setDisplayMessage(jzt.i18n.getMessage('status.gameover'));
    }

};

/**
 * Checks this Game instance's counters and updates the game state as necessary.
 */
jzt.Game.prototype.checkCounters = function() {

    // If our player is dead, and it's not already GameOver state
    if(this.counters.health <= 0 && this.state !== jzt.GameState.GameOver) {

        // Assign our state to be GameOVer
        this.setState(jzt.GameState.GameOver);

    }

};
    
/**
 * Renders a visual representation of this Game to its associated HTML5 Canvas element.
 */
jzt.Game.prototype.draw = function() {

    // Render the current board
    this.currentBoard.render(this.context);

    // If we are reading, also render our scroll instance
    if(this.state === jzt.GameState.Reading) {
        this.scroll.render(this.context);
    }
            
};