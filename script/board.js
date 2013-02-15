window.jzt = window.jzt || {};

jzt.Board = function(boardData, player) {
	
	var TILE_HEIGHT = 20;
	var TILE_WIDTH = 20;
	var color = 0;
	
	var self = this;
	var boardWidth = boardData.width;
	var boardHeight = boardData.height;
	var tiles = boardData.tiles;
	
	this.isPassable = function(x, y) {
		
		if(y < 0 || y >= boardHeight) {
			return false;
		}
		else if(x < 0 || x >= boardWidth) {
			return false;
		}
		
		return !tiles[y][x];
		
	}
	
	this.render = function(c) {
		
		c.fillStyle = '#000000';
		c.fillRect(0, 0, boardWidth * TILE_WIDTH, boardHeight * TILE_HEIGHT);
		
		c.fillStyle = '#ffff00';
		
		for(var y = 0; y < boardHeight; ++y) {
			for(var x = 0; x < boardWidth; ++x) {
				
				var tile = tiles[y][x];
				
				if(tile) {
					c.fillRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
				}
				
			}
		}
		
		c.fillStyle = '#00ffff';
		c.fillRect(player.x * TILE_WIDTH, player.y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
		
	}
	
}