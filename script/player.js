window.jzt = window.jzt || {};

jzt.Player = function(game) {
	
	this.PLAYER_SPEED = 10;
	
	this._nextMove = Date.now();
	
	this.game = game;
	this.x = 1;
	this.y = 1;
	
};
	
jzt.Player.prototype.moveNorth = function() {
	this.move(0,-1);
};
	
jzt.Player.prototype.moveSouth = function() {
	this.move(0,1);
}
	
jzt.Player.prototype.moveEast = function() {
	this.move(1,0);
};
	
jzt.Player.prototype.moveWest = function() {
	this.move(-1, 0);
};
	
jzt.Player.prototype.move = function(xOffset, yOffset) {
	
	if( this.game.currentBoard.isPassable(this.x + xOffset, this.y + yOffset) ) {
			
		this.x += xOffset;
		this.y += yOffset;
		
		this._nextMove = Date.now() + 1000 / this.PLAYER_SPEED;
		
	}

};
	
jzt.Player.prototype.update = function() {
		
	// We can only move when permissable speed-wise
	if( Date.now() > this._nextMove ) {
		
		var k = this.game.keyboard;

		if (k.isPressed(k.UP)) this.moveNorth();
		else if (k.isPressed(k.LEFT)) this.moveWest();
		else if (k.isPressed(k.DOWN)) this.moveSouth();
		else if (k.isPressed(k.RIGHT)) this.moveEast();
		
	}
		
};