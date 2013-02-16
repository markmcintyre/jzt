window.jzt = window.jzt || {};

jzt.Game = function(canvasElement, data) {
	
	this.FPS = 60;
	this.CPS = 60;
	this.TILE_WIDTH = 10;
	this.TILE_HEIGHT = 10;
	this.MAX_TICKS_SKIPPED = 10;
	this.SKIP_TICKS = 1000 / this.CPS;
	
	this._intervalId = undefined;
	this._ticks = 0;
	this._nextTick = Date.now();
	
	this.data = data;
	this.player = new jzt.Player(this);
	this.keyboard = new jzt.KeyboardInput();
	this.canvasElement = canvasElement;
	this.context = canvasElement.getContext('2d');
	
	this.currentBoard = new jzt.Board(this.data.boards[0], this.player);
};

jzt.Game.prototype.run = function() {

	this.keyboard.initialize();
		
	// Start the game loop
	this._intervalId = setInterval(this.loop.bind(this), 1000 / this.FPS);
		
};
	
jzt.Game.prototype.loop = function() {

	this._ticks = 0;

	while(Date.now() > this._nextTick && this._ticks < this.MAX_TICKS_SKIPPED) {
		this.update();
		this._nextTick += this.SKIP_TICKS;
		this._ticks++;
	}

	if(this._ticks) {
		this.draw();
	}
	
};
	
jzt.Game.prototype.update = function() {
	this.player.update();
};
	
jzt.Game.prototype.draw = function() {
		
	//self.context.clearRect(0, 0, self.canvasElement.width, self.canvasElement.height);
	this.currentBoard.render(this.context);
			
};
