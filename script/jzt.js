window.jzt = window.jzt || {};

jzt.Game = function(canvasElement, data, onLoadCallback) {
    
    this.TILE_SIZE = new jzt.Point(16, 32);
    this.SPRITE_SIZE = new jzt.Point(8, 16);
    
    this.FPS = 60;
    this.CPS = 60;
    this.BLINK_SPEED = 4;
    this.MAX_TICKS_SKIPPED = 10;
    this.SKIP_TICKS = Math.round(1000 / this.CPS);
    this.SKIP_BLINK_TICKS = Math.round(1000 / this.BLINK_SPEED);
    this.COLOR_CYCLE_MAX = 6;

    this._intervalId = undefined;
    this._ticks = 0;
    this._nextTick = Date.now();
    this._nextBlinkTick = Date.now();
    
    this.data = data;
    this.onLoadCallback = onLoadCallback;
    this.resources = {};
    this.player = new jzt.Player(this);
    this.keyboard = new jzt.KeyboardInput();
    this.canvasElement = canvasElement;
    this.context = canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;
    this.blinkState = true;
    this.colorCycleIndex = 0;

    this.currentBoard = undefined;
    
    var graphicsLoadedCallback = this.onGraphicsLoaded.bind(this);
    this.resources.graphics = new jzt.Graphics(this, graphicsLoadedCallback);

};

jzt.Game.prototype.onGraphicsLoaded = function() {
    this.onLoadCallback();
};

jzt.Game.prototype.run = function() {

    this.keyboard.initialize();
    this.currentBoard = new jzt.Board(this.data.boards[0], this);
        
    // Start the game loop
    this._intervalId = setInterval(this.loop.bind(this), 1000 / this.FPS);
        
};
    
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
    
jzt.Game.prototype.update = function() {
    this.currentBoard.update();
    this.player.update();
};
    
jzt.Game.prototype.draw = function() {
        
    this.currentBoard.render(this.context);
            
};