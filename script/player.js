window.jzt = window.jzt || {};

jzt.Player = function(game) {
	
	var PLAYER_SPEED = 10;
	
	var nextMove = Date.now();
	var self = this;
	
	self.x = 1;
	self.y = 1;
	
	self.moveNorth = function() {
		self.move(0,-1);
	}
	
	self.moveSouth = function() {
		self.move(0,1);
	}
	
	self.moveEast = function() {
		self.move(1,0);
	}
	
	self.moveWest = function() {
		self.move(-1, 0);
	}
	
	self.move = function(xOffset, yOffset) {
		
		if( game.currentBoard.isPassable(self.x + xOffset, self.y + yOffset) ) {
				
			self.x += xOffset;
			self.y += yOffset;
			
			nextMove = Date.now() + 1000 / PLAYER_SPEED;
			
		}

	}
	
	self.update = function() {
		
		// We can only move when permissable speed-wise
		if( Date.now() > nextMove ) {
			
			var k = game.keyboard;
	
			if (k.isPressed(k.UP)) self.moveNorth();
			else if (k.isPressed(k.LEFT)) self.moveWest();
			else if (k.isPressed(k.DOWN)) self.moveSouth();
			else if (k.isPressed(k.RIGHT)) self.moveEast();
			
		}
		
	};
	
}