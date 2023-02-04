/**
 * JZT Game
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node: true */
/*global requestAnimationFrame, cancelAnimationFrame */

'use strict';

/**
 * Format version represents the version of the game format that can be loaded.
 */
var formatVersion = '1.0.0',
    ConstructorError = require('./basic').ConstructorError,
    KeyboardInput = require('./input').KeyboardInput,
    Audio = require('./audio').Audio,
    Graphics = require('./graphics').Graphics,
    i18n = require('./i18n'),
    Scroll = require('./scroll').Scroll,
    FileManagement = require('./file-management').FileManagement,
    Splash = require('./popup').Splash,
    Point = require('./basic').Point,
    Direction = require('./basic').Direction,
    Board = require('./board').Board,
    things = require('./things').things,
    Colors = require('./graphics').Colors,
    ColorUtilities = require('./graphics').ColorUtilities,
    utilities = require('./basic').utilities,
    Popup = require('./popup').Popup,
    GameState = require('./game-state').GameState,
    metadata = require('./metadata');

/**
 * Game represents a playable JZT game, including all Boards and a player.
 *
 * @param {object} configuration - A configuration object consisting of the following:
 * - onLoadCallback: A function to be called when the game has loaded
 * - canvasElement: A Canvas element where this game should be drawn
 * - notificationListeners: An array of notification listeners to listen for game notifications
 * - settings: User-configurable settings object to observe
 */
function Game(configuration) {

    var index;

    if (!(this instanceof Game)) {
        throw ConstructorError;
    }

    // Ensure we were given a valid canvas element
    if (!configuration || !configuration.canvasElement || configuration.canvasElement.nodeName !== 'CANVAS') {
        throw 'Expected a valid canvas element in the configuration.';
    }

    /*
     * We perform some sanity checks for feature support. We use the bind function
     * as an acid test for ECMAScript 5 support, since it was one of the last supported
     * features on some browsers. We also test for Canvas support and requestAnimationFrame.
     */
    if ((typeof Function.prototype.bind !== 'function') || (!window.CanvasRenderingContext2D) || (typeof requestAnimationFrame !== 'function')) {

        // If we were given a callback, tell it that the load was unsuccessful.
        if (typeof configuration.onLoadCallback === 'function') {
            configuration.onLoadCallback(false);
        }

        // Return immediately
        return;

    }

    this.FPS = 30;
    this.CPS = 10;
    this.CYCLE_RATE = Math.round(this.FPS / this.CPS);
    this.CYCLE_TICKS = Math.floor(1000 / this.FPS) * this.CYCLE_RATE;
    this.FPS_INTERVAL = 1000 / this.FPS;
    this.TRANSITION_STEPS = 10;

    this.version = formatVersion;
    this.loopId = undefined;
    this.gameToLoad = undefined;
    this.gameLoaded = false;
    this.loadingAnimationIndex = 0;
    this.screenEffectIndex = 0;
    this.previousStates = [];
    this.transition = {
        animationIndex: 0,
        type: 'irisOut',
        callback: undefined
    };

    this.onLoadCallback = configuration.onLoadCallback;
    this.player = undefined;
    this.keyboard = new KeyboardInput();
    this.canvasElement = configuration.canvasElement;
    this.devicePixelRatio = 1;
    this.notificationListeners = [];

    if (configuration.playTest) {
        this.playTest = true;
    }

    if (configuration.playTest) {
        this.playTest = configuration.playTest;
    }

    // Add our notification listeners
    if (configuration.notificationListeners) {
        for (index = 0; index < configuration.notificationListeners.length; index += 1) {
            this.addNotificationListener(configuration.notificationListeners[index]);
        }
    }

    // Initialize our canvas
    if (window.devicePixelRatio) {
        this.devicePixelRatio = window.devicePixelRatio;
        this.canvasElement.width = this.canvasElement.width * window.devicePixelRatio;
        this.canvasElement.height = this.canvasElement.height * window.devicePixelRatio;
    }

    this.context = this.canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    // Initialize our audio and graphics resources
    this.resources = {
        audio: new Audio(),
        graphics: new Graphics(this.onGraphicsLoaded.bind(this))
    };

    // If we're not a 1:1 pixel ratio...
    if (window.devicePixelRatio) {

        // Adjust our tile size
        this.resources.graphics.TILE_SIZE.x = this.resources.graphics.TILE_SIZE.x * window.devicePixelRatio;
        this.resources.graphics.TILE_SIZE.y = this.resources.graphics.TILE_SIZE.y * window.devicePixelRatio;

    }

    this.screenWidth = Math.floor(this.context.canvas.width / this.resources.graphics.TILE_SIZE.x);
    this.screenHeight = Math.floor(this.context.canvas.height / this.resources.graphics.TILE_SIZE.y);

    this.settings = {
        audioActive: this.resources.audio.active,
        audioVolume: this.resources.audio.userVolume,
        audioMute: false,
        language: i18n.getLanguage()
    };

}

/**
 * Adds ourselves as a listener to a provided settings object. Whenever the settings
 * of this instance changes, we expect to be notified.
 *
 * @param {object} settings - A settings object
 */
Game.prototype.observeSettings = function (settings) {

    // Assign our callback
    settings.addListener(this.onSettingsChanged.bind(this));

    // Send our initial values
    settings.initialize(this.settings);

};

/**
 * Adds a provided notification listener to the set of listeners registered for this
 * Game instance.
 *
 * @param {object} notificationListener - A notification listener.
 */
Game.prototype.addNotificationListener = function (notificationListener) {
    this.notificationListeners.push(notificationListener);
};

/**
 * Creates and returns a serializes object representing this Game's state.
 *
 * @return {object} - A serialized Game instance.
 */
Game.prototype.serialize = function () {

    var result = {},
        index;

    result.name = this.name;
    result.version = this.version;
    result.titleBoard = this.titleBoard;
    result.startingBoard = this.currentBoard.name;
    result.victoryBoard = this.victoryBoard;
    result.author = this.author;
    result.boards = [];
    result.counters = {};
    result.savedGame = true;

    // Serialize our counters
    for (index in this.counters) {
        if (this.counters.hasOwnProperty(index) && !isNaN(this.counters[index])) {
            result.counters[index] = this.counters[index];
        }
    }

    // Serialize our current board to our board storage first
    this.boards[this.currentBoard.name] = this.currentBoard.serialize();

    // Serialize each of our boards
    for (index in this.boards) {
        if (this.boards.hasOwnProperty(index)) {
            result.boards.push(this.boards[index]);
        }
    }

    return result;

};

/**
 * Restarts the currently active game.
 */
Game.prototype.restartGame = function () {
    this.loadGame(this.gameUrl || this.cachedGame);
};

/**
 * Loads a provided game to this Game instance.
 *
 * @param {object|string} - A serialized game, or a URL where one can be downloaded.
 */
Game.prototype.loadGame = function (game) {

    var me = this,
        response,
        httpRequest;

    this.keyboard.cancelInput();
    this.previousStates = [];

    // We're officially in a loading state
    this.setState(GameState.Loading);

    // Determine what we've got, exactly
    if (typeof game === 'string') {

        // It was a URL
        this.gameUrl = game;

        try {

            // Fetch the game object via AJAX
            httpRequest = new XMLHttpRequest();
            httpRequest.onreadystatechange = function () {

                // If we're ready to load...
                if (httpRequest.readyState === 4) {

                    try {

                        if (httpRequest.status === 200) {

                            // The download was successful. Get our JSON response
                            // and deserialize it.
                            response = JSON.parse(httpRequest.responseText);
                            me.deserialize(response);

                        } else {

                            // There was an error.
                            throw 'Unexpected HTTP request status ' + httpRequest.status;

                        }

                    } catch (exception) {

                        // Any exeptions indicate a catestrophic error
                        me.catestrophicError(i18n.getMessage('status.loaderror'), exception);

                    }

                }

            };

            // Configure our GET request and do it!
            httpRequest.open('GET', game, true);
            httpRequest.send(null);

        } catch (exception) {

            // If anything bad happens, all bets are off
            this.catestrophicError(i18n.getMessage('status.loaderror'), exception);

        }

    } else if (typeof game === 'object') {

        // We got an actual game object instead of a URL
        // so load it directly!
        this.cachedGame = game;
        this.deserialize(game);

    }

};

/**
 * Indicate that an unrecoverable error has occurred. This will interrupt
 * all gameplay and display a message to the user.
 *
 * @param {string} message - A message to display to the user.
 */
Game.prototype.catestrophicError = function (message, exception) {

    if (exception) {
        console.error(message, exception, exception.stack || exception);
    }

    this.catestrophicErrorMessage = message;
    this.setState(GameState.Error);
};

/**
 * Deserializes a provided game instance and loads it to the current Game.
 *
 * @param {object} data - Serialized game data.
 */
Game.prototype.deserialize = function (data) {

    var index,
        board,
        wasAlreadyRunning = false;

    // Ensure we're capable of loading this version of the data
    if (!data.version || data.version !== this.version) {
        this.catestrophicError(i18n.getMessage('status.incompatible'));
        return;
    }

    // If we're already running, end the game loop
    if (this.isRunning()) {

        wasAlreadyRunning = true;

        // Cancel any playing audio
        this.resources.audio.cancel();

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
    this.savedGame = data.savedGame ? true : false;
    this.keyboard.cancelInput();
    this.previousStates = [];
    this.resources.audio.setActive(!this.settings.audioMute);

    // Initialize our default counters
    this.counters = {
        HEALTH: 50,
        'HEALTH_MAX': 50,
        AMMO: 0,
        GEMS: 0,
        TORCHES: 0,
        SCORE: 0,
        TORCHLIFE: 0,
        '<PLAYTIME>': 0
    };

    // Load all of our provided counter values
    for (index in data.counters) {
        if (data.counters.hasOwnProperty(index) && !isNaN(data.counters[index])) {
            this.counters[index] = data.counters[index];
        }
    }

    // Load each of our boards
    for (index = 0; index < data.boards.length; index += 1) {
        board = data.boards[index];
        this.boards[board.name] = board;
    }

    // Indicate that our game has loaded
    this.gameLoaded = true;

    // If we were running, resume the game loop
    if (wasAlreadyRunning) {
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
Game.prototype.adjustCounter = function (counter, value) {
    this.setCounterValue(counter, this.getCounterValue(counter) + value);
};

/**
 * Retrieves a game counter's value.
 *
 * @param {string} counter - A name of a counter to retrieve.
 */
Game.prototype.getCounterValue = function (counter) {
    if (this.counters[counter] === undefined) {
        return 0;
    }

    return this.counters[counter];

};

/**
 * Assigns a provided game counter to a provided value.
 *
 * @param counter A name of a counter to be assigned a value.
 * @param value A value for a counter.
 */
Game.prototype.setCounterValue = function (counter, value) {

    var maxCounter = counter + '_MAX',
        oldValue = 0;

    // If the counter doesn't already exist, create it now
    if (this.counters[counter] === undefined) {
        this.counters[counter] = 0;
    } else {
        oldValue = this.counters[counter];
    }

    // If we have a corresponding maximum, ensure we don't exceed it
    if (this.counters[maxCounter] && (value > this.counters[maxCounter])) {
        value = this.counters[maxCounter];
    }

    // Depending on our new value
    if (value <= 0) {

        // It's less than zero, so just delete it entirely
        delete this.counters[counter];

    } else {

        // Set our counter value
        this.counters[counter] = value;

    }

    // Notify our listeners if the value has changed
    if (oldValue !== value) {

        // Notify our listeners
        this.notifyListeners('counter', {
            'counter': counter,
            'value': value,
            'oldValue': oldValue
        });

    }

};

/**
 * A callback function to be executed once all graphic assets have been
 * loaded.
 */
Game.prototype.onGraphicsLoaded = function () {

    this.scroll = new Scroll(this);
    this.fileManagement = new FileManagement(this);
    this.DARK_PATTERN = this.context.createPattern(this.resources.graphics.DARK_IMAGE, 'repeat');
    this.NOISE_PATTERN = this.context.createPattern(this.resources.graphics.NOISE_IMAGE, 'repeat');

    // If we have a callback, indicate that loading was successful
    if (typeof this.onLoadCallback === 'function') {
        this.onLoadCallback(true);
    }

};

/**
 * Moves this Game's Player instance to a specified Passage id on a given board name. This will cause
 * a new Board to be loaded as the current board, and the player to be located at the provided Passage.
 *
 * @param passageId An ID of a Passage
 * @param boardName A name of a Board to be loaded.
 */
Game.prototype.movePlayerToPassage = function (passageId, boardName) {

    // Retrieve our new board (or the current board if it's the same)
    var newBoard = (boardName === this.currentBoard.name) ? this.currentBoard : this.getBoard(boardName),
        passage = newBoard ? newBoard.getPassage(passageId) : undefined,
        me = this;

    // If the specified board does not exist, return
    if (newBoard === undefined) {
        return;
    }

    if (passage) {

        newBoard.entryPoint = passage.point;

        this.transition.type = 'irisOut';
        this.transition.callback = function () {
            me.setBoard(newBoard, passage.point);
            me.transition.type = 'irisIn';
            me.transition.animationIndex = 0;
            me.transition.callback = function () {
                me.setState(GameState.Playing);
            }
        };

        this.setState(GameState.Transition);

    }

};

/**
 * Assigns a GameState to this Game instance, changing the current state of this Game's finite
 * state machine, but saving the old state to a stack.
 *
 * @param {number} state - A new state to replace the old one.
 */
Game.prototype.pushState = function (state) {
    this.previousStates.push(this.state);
    this.keyboard.cancelInput();
    this.setState(state);
};

/**
 * Restores a GameState from this Game's state stack.
 */
Game.prototype.restoreState = function () {
    if (this.previousStates.length > 0) {
        this.keyboard.cancelInput();
        this.setState(this.previousStates.pop());
    }
};

/**
 * Assigns a GameState to this Game instance, changing the current state of this Game's finite
 * state machine.
 *
 * @param state A GameState to be assigned to this Game.
 */
Game.prototype.setState = function (state) {

    // If we are to pause the game...
    if (state === GameState.Paused) {

        // Blink the player
        this.player.background = this.player.background.lighten();

        // Cancel all keyboard input
        this.keyboard.cancelInput();

    } else if (state === GameState.Playing) {

        // Let's resume playing!

        // Forget if P was pressed
        this.keyboard.cancelKey(this.keyboard.P);

        // If we were previously on the title screen...
        if (this.state === GameState.Title) {

            // Forget everything about our current board
            this.currentBoard = undefined;

            // Load our starting board
            this.setBoard(this.startingBoard);

        }

        // Reset our player display
        this.player.background = this.player.background.darken();

        // Notify listeners that we're playing
        this.notifyListeners('playing');

    } else if (state === GameState.Reading) {

        // Let's start reading!

        // Cancel all keyboard input
        this.keyboard.cancelInput();

        // Ignore the player's next scheduled event
        this.player.eventScheduler.takeEvent();

        this.scroll.open();

    } else if (state === GameState.FileManagement) {

        // Let's do some file management!

        // UNLESS, of course, we're play testing.
        if (this.playTest) {
            return;
        }

        // Show our file management, and suppress the empty slot if we're on the title screen
        this.fileManagement.open(undefined, this.state === GameState.Title);

        // Notify listeners that we're managing files
        this.notifyListeners('file-management');

    } else if (state === GameState.GameOver) {

        // Oh dear, it's game over...

        // Stop all scheduled audio
        this.resources.audio.cancel();

        // Play our game over sound
        this.resources.audio.play('s-cd#g+c-ga#+dgfg#+cf---q.c', true);

        // Deactivate subsequent audio output
        this.resources.audio.setActive(false, false);

        // Notify our listeners that it's game over
        this.notifyListeners('game-over', {
            score: this.getCounterValue('SCORE')
        });

    } else if (state === GameState.Title) {

        // It's the title screen!

        if (this.titleBoard) {
            this.setBoard(this.titleBoard);
        } else {
            this.setBoard(this.startingBoard);
        }

        // The player shouldn't be on the board
        if (this.player) {
            this.player.remove();
            this.player.point.x = -1;
            this.player.point.y = -1;
        }

    } else if (state === GameState.Victory) {

        // Victory!

        if (this.victoryBoard) {
            this.setBoard(this.victoryBoard);
        }

        // The player shouldn't be on the board
        if (this.player) {
            this.player.remove();
            this.player.point.x = -1;
            this.player.point.y = -1;
        }

        // Notify our listeners that it's a victory
        this.notifyListeners('victory', {
            score: this.getCounterValue('SCORE'),
            time: this.getCounterValue('<PLAYTIME>')
        });

    } else if (state === GameState.Splash) {

        // Splashy Splashy!
        this.splash = new Splash(this);

    } else if (state === GameState.Transition) {

        // Transition init
        this.transition.animationIndex = 0;

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
Game.prototype.movePlayerToBoardEdge = function (edge, boardName, offset) {

    // Retrieve our new board (or the current board if it's the same)
    var newBoard = (boardName === this.currentBoard.name) ? this.currentBoard : this.getBoard(boardName),
        outsideLocation = new Point(this.player.point.x, this.player.point.y),
        newLocation = new Point(this.player.point.x, this.player.point.y);

    // If the board specified does not exist, return
    if (newBoard === undefined) {
        return;
    }

    // Adjust based on our offset
    if (offset && (edge === Direction.North || edge === Direction.South)) {
        outsideLocation.x = outsideLocation.x + offset;
        newLocation.x = newLocation.x + offset;
    } else if (offset && (edge === Direction.East || edge === Direction.West)) {
        outsideLocation.y = outsideLocation.y + offset;
        newLocation.y = newLocation.y + offset;
    }

    switch (edge) {
    case Direction.North:
        outsideLocation.y = -1;
        newLocation.y = 0;
        break;
    case Direction.East:
        outsideLocation.x = newBoard.width;
        newLocation.x = newBoard.width - 1;
        break;
    case Direction.South:
        outsideLocation.y = newBoard.height;
        newLocation.y = newBoard.height - 1;
        break;
    case Direction.West:
        outsideLocation.x = -1;
        newLocation.x = 0;
        break;
    }

    // If the player cannot move to this location, return immediately
    if (!newBoard.moveTile(outsideLocation, newLocation, false, true)) {
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
Game.prototype.getBoard = function (name) {

    if (this.boards.hasOwnProperty(name)) {
        return new Board(this.boards[name], this);
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
Game.prototype.setBoard = function (board, playerPoint) {

    // First, erase the old player position if applicable
    if (this.currentBoard) {
        this.currentBoard.setTile(this.player.point, this.player.under);
    }

    // If we aren't moving to the same board as before...
    if (!(this.currentBoard && this.currentBoard.equals(board))) {

        // Serialize the old board, if applicable
        if (this.currentBoard !== undefined) {
            this.boards[this.currentBoard.name] = this.currentBoard.serialize();
        }

        // So, what did we actually receive?
        if (board instanceof Board) {

            // It's a board, so load it directly
            this.currentBoard = board;

        } else {

            // It's the name of a board, so load it from our boards
            this.currentBoard = new Board(this.boards[board], this);

        }

        // Construct our new player for this board
        this.player = new things.Player(this.currentBoard);
        this.player.game = this;

    }

    // Assign the player to our new board
    if (playerPoint) {
        this.player.point.x = playerPoint.x;
        this.player.point.y = playerPoint.y;
        this.player.under = this.currentBoard.getTile(playerPoint);
    }

    // If the board is dark and a torch isn't used, tell the player
    if (this.currentBoard.dark && this.getCounterValue('TORCHLIFE') <= 0) {
        this.oneTimeMessage('status.dark');
    }

    this.currentBoard.initializePlayer(this.player);

};

/**
 * Starts this Game's loop, effectively starting this Game.
 */
Game.prototype.run = function (game) {

    if (game) {
        this.gameToLoad = game;
    }

    // If our game loop isn't already running
    if (!this.isRunning()) {

        this.keyboard.initialize();
        this.previousStates = [];

        // If we're play testing, load now
        if (this.playTest) {
            this.initialLoad();
        }

        if (this.gameLoaded) {

            // We've got a game loaded

            // If it's a saved game, start from its starting board,
            // otherwise start from the title screen.
            if (this.savedGame) {
                this.setBoard(this.startingBoard);
                this.pause(true);
            } else {
                this.setState(GameState.Title);
            }

        } else {

            // Otherwise show the splash screen
            this.setState(GameState.Splash);


        }

        this.boundLoop = this.loop.bind(this);
        this.then = Date.now();
        this.previousTimestamp = this.then;

        // Start the game loop
        this.loopId = requestAnimationFrame(this.boundLoop);
    }

};

/**
 * Executes a single cycle of this Game's primary loop, effectively running
 * this Game for a single graphics tick.
 *
 * Future Improvement: Use performance.now() and the parameter passed to this function by
 * requestAnimationFrame to do timing once browser support improves.
 */
Game.prototype.loop = function () {

    try {

        var now = Date.now(),
            delta = now - this.then,
            realDelta = now - this.previousTimestamp;

        this.loopId = requestAnimationFrame(this.boundLoop);

        if (delta > this.FPS_INTERVAL) {

            // We adjust for requestAnimationFrame not being an exact multiple
            // of our framerate.
            this.then = now - (delta % this.FPS_INTERVAL);

            // We still store the actual previous timestamp so that time-based
            // calculations are properly tracked
            this.previousTimestamp = now;

            // Update our game
            this.update(realDelta);

            // Draw our game
            this.draw();

        }

    } catch (exception) {
        this.catestrophicError(i18n.getMessage('status.fatalerror'), exception);
    }

};

/**
 * Pauses the current game.
 * @param {boolean} showStats - true if we should show player and game status
 *                              false otherwise.
 */
Game.prototype.pause = function (showStats) {

    if (showStats === undefined) {
        showStats = true;
    }

    this.showStatsWhenPaused = showStats;
    this.setState(GameState.Paused);

};

/**
 * Ends the game completely.
 */
Game.prototype.end = function () {

    // Stop the game loop if it's running
    if (this.loopId) {

        cancelAnimationFrame(this.loopId);
        this.loopId = undefined;

    }

};

/**
 * Returns whether or not this Game is actively running.
 *
 * @return {boolean} - True if this Game is running, false otherwise.
 */
Game.prototype.isRunning = function () {
    return this.loopId;
};

/**
 * Updates this Game's state by one execution tick.
 */
Game.prototype.update = function (delta) {

    // Update our graphics resource
    this.resources.graphics.update();

    // Determine our game's state
    if (this.state === GameState.Playing) {

        this.currentBoard.update(delta);
        this.checkCounters(delta);

        // Update the player
        this.player.update();

        // Update our focus point
        this.currentBoard.focusPoint = this.player.point;

        // Update our play time
        this.adjustCounter('<PLAYTIME>', delta);

        // Check what keys the player might be pressing...
        if (this.keyboard.isPressed(this.keyboard.P) || this.keyboard.isPressed(this.keyboard.ENTER)) {

            // The user wants to pause
            this.resources.audio.play('++se.tc.e.sc');
            this.pause(true);

        } else if (this.keyboard.isPressed(this.keyboard.S)) {

            // The user wants to save
            this.fileManagement.dialogType = FileManagement.Type.SAVE;
            this.pushState(GameState.FileManagement);

        } else if (this.keyboard.isPressed(this.keyboard.R)) {

            // The user wants to restore a saved game
            this.fileManagement.dialogType = FileManagement.Type.OPEN;
            this.pushState(GameState.FileManagement);

        }

    } else if (this.state === GameState.Paused) {

        // We're paused.

        // Unpause on any expected keypress
        if (this.keyboard.isAnyPressed()) {
            this.keyboard.cancelKey(this.keyboard.P);
            this.keyboard.cancelKey(this.keyboard.ENTER);
            this.setState(GameState.Playing);
            this.player.foregroundColor = Colors.F;
        }

    } else if (this.state === GameState.Reading) {

        // We're reading
        this.scroll.update();

        // Reading counts as playtime
        this.adjustCounter('<PLAYTIME>', delta);

    } else if (this.state === GameState.FileManagement) {

        // We're managing files
        this.fileManagement.update();

    } else if (this.state === GameState.GameOver) {

        // We're at game over

        this.currentBoard.update();
        this.currentBoard.setDisplayMessage(i18n.getMessage('status.gameover'));

        // The user has an option to load a previous game now
        if (this.keyboard.isPressed(this.keyboard.R) || this.keyboard.isPressed(this.keyboard.ENTER)) {
            this.fileManagement.dialogType = FileManagement.Type.OPEN;
            this.pushState(GameState.FileManagement);
        }

    } else if (this.state === GameState.Title) {

        // We're on the title screen

        this.currentBoard.update();
        this.currentBoard.setDisplayMessage(i18n.getMessage('status.title'));

        // Check our keyboard input
        if (this.keyboard.isPressed(this.keyboard.P) || this.keyboard.isPressed(this.keyboard.SPACE) || this.keyboard.isPressed(this.keyboard.ENTER)) {

            // The user wants to play
            this.keyboard.cancelKey(this.keyboard.P);
            this.keyboard.cancelKey(this.keyboard.ENTER);
            this.keyboard.cancelKey(this.keyboard.SPACE);
            this.setState(GameState.Playing);

        } else if (this.keyboard.isPressed(this.keyboard.R)) {

            // The user wants to load a saved game
            this.fileManagement.dialogType = FileManagement.Type.OPEN;
            this.pushState(GameState.FileManagement);

        }

    } else if (this.state === GameState.Victory) {

        // We're in a victory state!
        this.currentBoard.update();

        // The user can load a previous game at this point
        if (this.keyboard.isPressed(this.keyboard.R) || this.keyboard.isPressed(this.keyboard.ENTER)) {
            this.fileManagement.dialogType = FileManagement.Type.OPEN;
            this.pushState(GameState.FileManagement);
        }

    } else if (this.state === GameState.Loading) {

        // We're loading
        this.loadingAnimationIndex += 1;
        if (this.loadingAnimationIndex >= things.Conveyor.animationFrames.length * 4) {
            this.loadingAnimationIndex = 0;
        }

    } else if (this.state === GameState.Transition) {

        // We're in a transition state
        this.transition.animationIndex += 1;
        if (this.transition.animationIndex >= this.TRANSITION_STEPS) {

            // Perform our callback
            this.transition.callback();

            // Re-initialize for saftey
            this.transition.animationIndex = 0;

        }

    } else if (this.state === GameState.Splash) {

        // We're splashing gratuitously
        this.splash.update();

        // If our splash is done
        if (this.splash.done) {

            // We no longer need the splash screen
            delete this.splash;

            this.initialLoad();

        }

    }

};

Game.prototype.initialLoad = function () {

    // Check if there's a game to load
    if (this.gameToLoad) {

        // There is! So load our game
        this.loadGame(this.gameToLoad);

        // There's no need to keep it around anymore
        delete this.gameToLoad;

    } else {

        // There's no game to load, so we're in error...
        this.setState(GameState.Error);

    }

};

/**
 * Checks this Game instance's counters and updates the game state as necessary.
 */
Game.prototype.checkCounters = function (delta) {

    var torchLife = this.getCounterValue('TORCHLIFE');

    // If our player is dead, and it's not already GameOver state
    if (this.getCounterValue('HEALTH') <= 0 && this.state !== GameState.GameOver) {

        // Assign our state to be GameOVer
        this.setState(GameState.GameOver);

    } else if (torchLife > 0) {

        // The player isn't dead, and we've got some torch life
        // left in the bucket...

        // Adjust our player's torch counter
        torchLife -= delta;
        this.setCounterValue('TORCHLIFE', torchLife);

        // If our torch life is past the threshold now...
        if (torchLife <= 0) {

            // Play our torch expiry noise and set our strength explicitly to zero
            this.resources.audio.play('tc-c-c');

        }

    }

};

/**
 * Displays a short, localizable message exactly once.
 *
 * @param messageKey A localization key for a message to display.
 */
Game.prototype.oneTimeMessage = function (messageKey) {

    var message;

    // If we haven't already shown this message...
    if (!this.readMessages.hasOwnProperty(messageKey)) {

        // Remember that we've shown this message now.
        this.readMessages[messageKey] = true;

        // Retrieve our message
        message = i18n.getMessage(messageKey);

        // Display it.
        this.currentBoard.setDisplayMessage(message);

    }

};

/**
 * Notifies listeners of a provided notification.
 *
 * @param {string} type - A type of message used to filter notification listeners.
 * @param {object} notification - A notification object that listeners will understand.
 */
Game.prototype.notifyListeners = function (type, notification) {

    var index,
        notificationListener;

    for (index = 0; index < this.notificationListeners.length; index += 1) {
        notificationListener = this.notificationListeners[index];
        if (!notificationListener.types || notificationListener.types.indexOf(type) >= 0) {
            notificationListener.callback(type, notification);
        }
    }

};

/**
 * Draws a CRT-like screen effect over the current graphics canvas.
 */
Game.prototype.drawScreenEffect = function () {

    var line,
        lineSpacing = 10 * this.devicePixelRatio,
        translateX = Math.round(256 * Math.random()),
        translateY = Math.round(256 * Math.random());

    // Increment our vertical position
    this.screenEffectIndex += 1;
    if (this.screenEffectIndex > lineSpacing) {
        this.screenEffectIndex = 0;
    }

    // We'll be drawing our noise pattern
    this.context.fillStyle = this.NOISE_PATTERN;

    // We simulate noise with a single random noise image by translating to a
    // a random location and drawing a pattern over the whole screen. This lets
    // us re-use the same noise image to simulate static.
    this.context.save();
    this.context.translate(translateX, translateY);
    this.context.scale(2 * this.devicePixelRatio, 2 * this.devicePixelRatio);
    this.context.fillRect(-translateX, -translateY, this.context.canvas.width, this.context.canvas.height);
    this.context.restore();

    // We also draw faded horizontal-ish lines over our whole image
    this.context.lineWidth = 4 * this.devicePixelRatio;
    this.context.strokeStyle = 'rgba(0,0,0,0.05)';
    this.context.beginPath();
    for (line = -lineSpacing; line < this.context.canvas.height; line = line + lineSpacing) {
        this.context.moveTo(0, line + this.screenEffectIndex + lineSpacing);
        this.context.lineTo(this.context.canvas.width, line + this.screenEffectIndex);
    }
    this.context.stroke();

    // We draw the same lines, offset slightly to make them a bit 'blurry'
    this.context.beginPath();
    for (line = -lineSpacing; line < this.context.canvas.height; line = line + lineSpacing) {
        this.context.moveTo(0, line + (2 * this.devicePixelRatio) + this.screenEffectIndex + lineSpacing);
        this.context.lineTo(this.context.canvas.width, line + (2 * this.devicePixelRatio) + this.screenEffectIndex);
    }
    this.context.stroke();

};

/**
 * Draws an error screen over the current canvas.
 */
Game.prototype.drawErrorScreen = function () {

    var spriteGrid = this.errorPopup ? this.errorPopup.spriteGrid : undefined,
        popupWidth = this.catestrophicErrorMessage.length + 7;

    // If we haven't yet defined our error popup, do it now
    if (this.errorPopup === undefined || this.errorPopup.language !== i18n.Messages.currentLanguage) {
        this.errorPopup = new Popup(undefined, new Point(popupWidth, 3), this);
        this.errorPopup.setColor(Colors.Red, Colors.White);
        spriteGrid = this.errorPopup.spriteGrid;
        spriteGrid.addText(new Point(2, 1), this.catestrophicErrorMessage, Colors.BrightWhite);
        spriteGrid.setTile(new Point(popupWidth - 4, 1), 58, Colors.Cycle);
        spriteGrid.setTile(new Point(popupWidth - 3, 1), 40, Colors.Cycle);
    }

    this.errorPopup.render(this.context);

};

/**
 * Draws an animated loading screen over the current canvas.
 */
Game.prototype.drawLoadingScreen = function () {

    var spriteGrid = this.loadingPopup ? this.loadingPopup.spriteGrid : undefined,
        popupWidth = 24,
        sprite;

    // If we haven't yet defined our loading popup in our language, do it now
    if (this.loadingPopup === undefined || this.loadingPopup.language !== i18n.Messages.currentLanguage) {
        this.loadingPopup = new Popup(undefined, new Point(popupWidth, 3), this);
        this.loadingPopup.setColor(Colors.Blue, Colors.White);
        spriteGrid = this.loadingPopup.spriteGrid;
        spriteGrid.addText(new Point(4, 1), i18n.getMessage('status.loading'), Colors.BrightWhite);
        this.loadingPopup.animationPosition = new Point(2, 1).add(this.loadingPopup.position);
    }

    this.loadingPopup.render(this.context);

    // Animate our spinning sprite
    sprite = this.resources.graphics.getSprite(things.Conveyor.animationFrames[Math.floor(this.loadingAnimationIndex / 4)]);
    sprite.draw(this.context, this.loadingPopup.animationPosition, Colors.Cycle);

};

/**
 * Draws a pause screen with some player and gameplay statistics to the current canvas.
 */
Game.prototype.drawPauseScreen = function () {

    var spriteGrid,
        position,
        value,
        sprite,
        keyValues = ['9', 'A', 'B', 'C', 'D', 'E', 'F'],
        pauseWidth = 24,
        me = this;

    /**
     * Retrieves a human-readable value of a named counter, along with its
     * maximum, if applicable.
     *
     * @param {string} counter - A name of a counter to print
     */
    function getCounterValue(counter) {
        var result = me.getCounterValue(counter).toString();
        if (me.getCounterValue(counter + '_MAX')) {
            result += '/' + me.getCounterValue(counter + '_MAX').toString();
        }
        return result;
    }

    if (! this.showStatsWhenPaused) {
        return;
    }

    // If we haven't yet defined a status popup in our language, do it now
    if (this.statusPopup === undefined || this.statusPopup.language !== i18n.Messages.currentLanguage) {
        this.statusPopup = new Popup(new Point(this.screenWidth - (pauseWidth + 1), 1), new Point(pauseWidth, 8), this);
        this.statusPopup.language = i18n.Messages.currentLanguage;
        this.statusPopup.setTitle(i18n.getMessage('pause.paused'));
        spriteGrid = this.statusPopup.spriteGrid;
        spriteGrid.addText(new Point(1, 1), i18n.getMessage('pause.health'), Colors.Yellow);
        spriteGrid.addText(new Point(1, 2), i18n.getMessage('pause.ammo'), Colors.Yellow);
        spriteGrid.addText(new Point(1, 3), i18n.getMessage('pause.gems'), Colors.Yellow);
        spriteGrid.addText(new Point(1, 4), i18n.getMessage('pause.torches'), Colors.Yellow);
        spriteGrid.addText(new Point(1, 5), i18n.getMessage('pause.score'), Colors.Yellow);
        spriteGrid.addText(new Point(1, 6), i18n.getMessage('pause.keys'), Colors.Yellow);
    }

    // Make sure we don't position our popup over the player
    if (this.player.point.x >= this.currentBoard.windowOrigin.x + (this.screenWidth - pauseWidth - 2)) {
        this.statusPopup.position.x = 1;
    } else {
        this.statusPopup.position.x = this.screenWidth - (pauseWidth + 1);
    }

    position = this.statusPopup.position;
    this.statusPopup.render(this.context);

    // Draw our status values
    this.resources.graphics.drawString(this.context, position.add(new Point(13, 1)), getCounterValue('HEALTH'), Colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new Point(13, 2)), getCounterValue('AMMO'), Colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new Point(13, 3)), getCounterValue('GEMS'), Colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new Point(13, 4)), getCounterValue('TORCHES'), Colors.BrightWhite);
    this.resources.graphics.drawString(this.context, position.add(new Point(13, 5)), getCounterValue('SCORE'), Colors.BrightWhite);

    // Draw our keys
    position = position.add(new Point(13, 6));
    sprite = this.resources.graphics.getSprite(12);
    for (value = 0; value < keyValues.length; value += 1) {
        if (this.getCounterValue('KEY' + keyValues[value]) > 0) {
            sprite.draw(this.context, position, ColorUtilities.deserializeForeground(keyValues[value]));
            position.x += 1;
        }
    }

};

/**
 * Draws a transition animation, based on data in our transition object.
 *
 * The transition consists of a growing or shrinking circle (depending on Whether
 * or not the transition type is 'irisOut' or another value.) The radius is
 * determined as the maximum distance to one of the corners of the screen,
 * where the corners of the screen are the intersection between the window
 * and the board dimensions.
 */
Game.prototype.drawTransition = function () {

    // Calculate the intersecting rectangle between the window and our
    // current board's dimensions, and use it to find the distance between
    // the player and each of the four corners of that rectangle.

    var circle,
        me = this,
        intersectionX1 = Math.max(this.currentBoard.windowOrigin.x, 0),
        intersectionY1 = Math.max(this.currentBoard.windowOrigin.y, 0),
        intersectionX2 = Math.min(this.currentBoard.windowOrigin.x + this.currentBoard.windowSize.x, this.currentBoard.width),
        intersectionY2 = Math.min(this.currentBoard.windowOrigin.y + this.currentBoard.windowSize.y, this.currentBoard.height),
        d1 = Math.sqrt((intersectionX1/2 - this.player.point.x/2) * (intersectionX1/2 - this.player.point.x/2) + (intersectionY1 - this.player.point.y) * (intersectionY1 - this.player.point.y)),
        d2 = Math.sqrt((intersectionX1/2 - this.player.point.x/2) * (intersectionX1/2 - this.player.point.x/2) + (intersectionY2 - this.player.point.y) * (intersectionY2 - this.player.point.y)),
        d3 = Math.sqrt((intersectionX2/2 - this.player.point.x/2) * (intersectionX2/2 - this.player.point.x/2) + (intersectionY2 - this.player.point.y) * (intersectionY2 - this.player.point.y)),
        d4 = Math.sqrt((intersectionX2/2 - this.player.point.x/2) * (intersectionX2/2 - this.player.point.x/2) + (intersectionY1 - this.player.point.y) * (intersectionY1 - this.player.point.y)),
        progress,
        radius;

    // Determine our progress through the animation
    progress = this.transition.animationIndex / this.TRANSITION_STEPS;
    progress = this.transition.type === 'irisOut' ? 1 - progress : progress;

    // The radius is the largest distance from the player to a corner
    radius = Math.max(d1, d2, d3, d4) * progress;

    // Get our circle data
    circle = utilities.generateCircleData(this.player.point, Math.ceil(radius));

    // Draw everything outside our circle radius as a grey tile
    this.currentBoard.eachDisplayable(function (thing, point) {

        if (!circle.contains(point)) {
            me.resources.graphics.fillTile(me.context, point.subtract(me.currentBoard.windowOrigin), Colors.Grey);
        }

    });


};

/**
 * Renders a visual representation of this Game to its associated HTML5 Canvas element.
 */
Game.prototype.draw = function () {

    // If we've got a board and haven't failed to render it before...
    if (this.currentBoard && !this.errorInRender) {

        try {
            this.currentBoard.render(this.context);
        } catch (exception) {
            this.errorInRender = true;
            this.catestrophicError(i18n.getMessage('status.fatalerror'), exception);
        }

    } else {
        this.context.fillStyle = Colors.Grey.rgbValue;
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }

    // Depending on our state...
    if (this.state === GameState.Paused) {

        // We're paused
        this.drawScreenEffect();
        this.drawPauseScreen();

    } else if (this.state === GameState.Reading) {

        // We're reading
        this.drawScreenEffect();
        this.scroll.render(this.context);

    } else if (this.state === GameState.FileManagement) {

        // We're in file management
        this.drawScreenEffect();
        this.fileManagement.render(this.context);

    } else if (this.state === GameState.Loading) {

        // We're loading
        this.drawScreenEffect();
        this.drawLoadingScreen();

    } else if (this.state === GameState.Splash) {

        // We're splashing
        this.splash.render(this.context);
        this.drawScreenEffect();

    } else if (this.state === GameState.Error) {

        // We're in an error state (oh my!)
        this.drawScreenEffect();
        this.drawErrorScreen();

    } else if (this.state === GameState.Transition) {

        // We're in a transition state
        this.drawTransition();

    }

};

/**
 * An event handler called when an observed settings object has changed. Depending on
 * the values that have changed, the behaviour of this Game may change as well.
 *
 * @param {object} settings - A settings object that has changed
 */
Game.prototype.onSettingsChanged = function (settings) {

    if (settings.hasOwnProperty('audioMute')) {
        this.settings.audioMute = settings.audioMute;
        this.resources.audio.setActive(!settings.audioMute && (this.state !== GameState.GameOver));
    }

    if (settings.hasOwnProperty('audioVolume')) {
        this.settings.audioVolume = settings.audioVolume;
        this.resources.audio.userVolume = settings.audioVolume;
    }

    if (settings.hasOwnProperty('language')) {
        this.settings.language = settings.language;
        i18n.setLanguage(settings.language);
    }

};

// Exports
exports.Game = Game;
exports.version = metadata.version;
