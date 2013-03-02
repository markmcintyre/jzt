window.jzt = window.jzt || {};

/**
 * Game represents a playable JZT game, including all Boards and a player.
 *
 * @param canvasElement An HTML5 Canvas element in which to display this Game.
 * @param data Serialized game data to be loaded
 * @param onLoadCallback A callback function to be executed once this Game
 *        and its assets have been loaded and initialized.
 */
jzt.Game = function(canvasElement, data, onLoadCallback) {
    
    this.TILE_SIZE = new jzt.Point(16, 32);
    this.SPRITE_SIZE = new jzt.Point(8, 16);
    
    this.FPS = 30;
    this.CPS = 30;
    this.BLINK_SPEED = 4;
    this.MAX_TICKS_SKIPPED = 10;
    this.SKIP_TICKS = Math.round(1000 / this.CPS);
    this.SKIP_BLINK_TICKS = Math.round(1000 / this.BLINK_SPEED);
    this.COLOR_CYCLE_MAX = 6;

    this._intervalId = undefined;
    this._ticks = 0;
    this._nextTick = Date.now();
    this._nextBlinkTick = Date.now();
    
    this.onLoadCallback = onLoadCallback;
    this.resources = {};
    this.player = new jzt.things.Player();
    this.keyboard = new jzt.KeyboardInput();
    this.canvasElement = canvasElement;
    this.context = canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;
    this.blinkState = true;
    this.colorCycleIndex = 0;

    this.currentBoard = undefined;
    this.startingBoard = data.startingBoard;
    this.boards = {};

    // Store our boards
    for(var index = 0; index < data.boards.length; ++index) {
        var board = data.boards[index];
        this.boards[board.name] = board;
    }
    
    var graphicsLoadedCallback = this.onGraphicsLoaded.bind(this);
    this.resources.graphics = new jzt.Graphics(this, graphicsLoadedCallback);

};

/**
 * A callback function to be executed once all graphic assets have been
 * loaded.
 */
jzt.Game.prototype.onGraphicsLoaded = function() {
    this.onLoadCallback();
};

/**
 * Starts this Game's loop, effectively starting this Game.
 */
jzt.Game.prototype.run = function() {

    this.keyboard.initialize();
    this.setBoard(this.startingBoard);
    this.player.game = this;
        
    // Start the game loop
    this._intervalId = setInterval(this.loop.bind(this), 1000 / this.FPS);
        
};
  
/**
 * Executes a single cycle of this Game's primary loop, effectively running
 * this Game for a single graphics tick.
 */  
jzt.Game.prototype.loop = function() {
    
    this._ticks = 0;
    var now = Date.now();

    while(now > this._nextTick && this._ticks < this.MAX_TICKS_SKIPPED) {
        this.update();
        this._nextTick += this.SKIP_TICKS;
        this._ticks++;
        if(now > this._nextBlinkTick) {
            this.blinkState = ! this.blinkState;
            this.colorCycleIndex = this.colorCycleIndex >= this.COLOR_CYCLE_MAX ? 0 : this.colorCycleIndex + 1;
            this._nextBlinkTick += this.SKIP_BLINK_TICKS;
        }
    }

    if(this._ticks) {
        this.draw();
    }
    
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

    var newLocation = new jzt.Point(this.player.point.x, this.player.point.y);
    var newBoard = this.getBoard(boardName);

    switch(edge) {
        case jzt.Direction.North:
            newLocation.y = 0;
            break;
        case jzt.Direction.East:
            newLocation.x = newBoard.width-1;
            break;
        case jzt.Direction.South:
            newLocation.y = newBoard.height-1;
            break;
        case jzt.Direction.West:
            newLocation.x = 0;
    }

    this.setBoard(boardName, newLocation);

};

/**
 * Retrieves a deserialized Board instance by name.
 * 
 * @param name A name of a Board.
 */
jzt.Game.prototype.getBoard = function(name) {
    
    return new jzt.Board(this.boards[name], this);

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

    // Serialize the existing board, if applicable
    if(this.currentBoard != undefined) {
        this.boards[this.currentBoard.name] = this.currentBoard.serialize();
    }

    // If we were given an actual board, assign it
    if( board instanceof jzt.Board) {
        this.currentBoard = board;
    }

    // If we were given a board name, load it
    else {
        this.currentBoard = new jzt.Board(this.boards[board], this);
    }

    // Assign the player to our new board
    if(playerPoint) {
        this.player.point.x = playerPoint.x;
        this.player.point.y = playerPoint.y;
    }
    this.currentBoard.initializePlayer(this.player);

};
    
/**
 * Updates this Game's state by one execution tick.
 */
jzt.Game.prototype.update = function() {
    this.currentBoard.update();
    this.player.update();
};
    
/**
 * Renders a visual representation of this Game to its associated
 * HTML5 Canvas element.
 */
jzt.Game.prototype.draw = function() {
        
    this.currentBoard.render(this.context);
            
};