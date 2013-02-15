window.jzt = window.jzt || {};

jzt.Game = function(canvasElement, data) {
	
	var self = this;
	
	var FPS = 60;
	var CPS = 60;
	var TILE_WIDTH = 10;
	var TILE_HEIGHT = 10;
	var MAX_TICKS_SKIPPED = 10;
	var SKIP_TICKS = 1000 / CPS;
	
	var intervalId = undefined;
	var ticks = 0;
	var nextTick = Date.now();
	
	self.data = data;
	self.player = new jzt.Player(self);
	self.keyboard = new jzt.KeyboardInput();
	self.canvasElement = canvasElement;
	self.context = canvasElement.getContext('2d');
	
	self.currentBoard = new jzt.Board(this.data.boards[0], self.player);
	
	self.run = function() {

		self.keyboard.initialize();
		
		// Start the game loop
		intervalId = setInterval(self.loop, 1000 / FPS);
		
	}
	
	self.loop = function() {
		ticks = 0;

		while(Date.now() > nextTick && ticks < MAX_TICKS_SKIPPED) {
			self.update();
			nextTick += SKIP_TICKS;
			ticks++;
		}

		if(ticks) {
			self.draw();
		}
	}
	
	self.update = function() {
		self.player.update();
	}
	
	self.draw = function() {
		
		//self.context.clearRect(0, 0, self.canvasElement.width, self.canvasElement.height);
		self.currentBoard.render(self.context);
			
	}
	
};

