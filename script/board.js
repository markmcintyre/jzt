window.jzt = window.jzt || {};

jzt.Board = function(boardData, player) {

	this.TILE_HEIGHT = 20;
	this.TILE_WIDTH = 20;
	
	this.boardData = boardData;
	this.width = boardData.width;
	this.height = boardData.height;
	this.messages = [];
	this.tiles = new Array(this.width * this.height);
	this.jztObjects = [];
	
	this.player = player;

	this._initializeTiles(boardData.tiles);
	this._initializeObjects(boardData.jztObjects);
	
};

/*
 * Intializes tile data given a collection of serialized tiles.
 */
jzt.Board.prototype._initializeTiles = function(tileDataCollection) {
	
	for(var row = 0; row < this.height; ++row) {
		
		var rowString = tileDataCollection[row];
		
		for(var column = 0; column < this.width; ++column) {
			
			var tile;
			
			switch(rowString.charAt(column)) {
				case '#':
					tile = jzt.BuiltInFactory.create('jztWall');
					break;
				case ' ':
					tile = undefined;
					break;
			}
			
			if(tile) {
				this.setTile(column, row, tile);
			}
			
		}
	}
};

/*
 * Initializes object data given a collection of serialized JZT
 * objects.
 */
jzt.Board.prototype._initializeObjects = function(objectDataCollection) {
	
	for(var index = 0; index < objectDataCollection.length; ++index) {
		
		var objectData = objectDataCollection[index];
		var jztObject = new jzt.JztObject(objectData);
		jztObject.setOwnerBoard(this);
		this.setTile(jztObject.x, jztObject.y, jztObject);
		this.jztObjects.push(jztObject);
		
	}
	
};

	
jzt.Board.prototype.each = function(callback) {
	for(var y = 0; y < this.height; ++y) {
		for(var x = 0; x < this.width; ++x) {
			var tile = this.getTile(x,y);
			callback(tile);
		}
	}
}
	
jzt.Board.prototype.moveTile = function(x, y, newX, newY) {
	this.setTile(newX, newY, this.getTile(x,y));
	this.setTile(x, y, undefined);
}
	
jzt.Board.prototype.setTile = function(x, y, tile) {
	
	if(tile) {
		tile.x = x;
		tile.y = y;
	}
	
	this.tiles[x + y * this.width] = tile;
	
}
	
jzt.Board.prototype.getTile = function(x, y) {
	return this.tiles[x + y * this.width];
}
	
jzt.Board.prototype.isPassable = function(x, y) {
		
	if(y < 0 || y >= this.width) {
		return false;
	}
	else if(x < 0 || x >= this.height) {
		return false;
	}
		
	return !this.getTile(x,y);
		
};
	
jzt.Board.prototype.addMessage = function(message) {
	this.messageQueue.push(message);
};
	
jzt.Board.prototype.update = function() {
		
	for(var index = 0; index < this.jztObjects.length; ++index) {
		
		var jztObject = this.jztObjects[index];
		
		// Enqueue messages for jztObjects
		for(var messageIndex = 0; messageIndex < this.messages.length; ++messageIndex) {
			
			var message = this.messages[messageIndex];
			if(jztObject.name == message.to) {
				jztObject.addMessage(message);
			}
			
		}
		
		// Update the jztObject
		jztObject.update();
		
	}
		
};
	
jzt.Board.prototype.render = function(c) {
		
	var instance = this;
	
	c.fillStyle = '#000000';
	c.fillRect(0, 0, this.width * this.TILE_WIDTH, this.height * this.TILE_HEIGHT);
	
	this.each( function(tile) {
		if(tile) {
			c.fillStyle = tile.foregroundColor;
			c.fillRect(tile.x * instance.TILE_WIDTH, tile.y * instance.TILE_HEIGHT,
				instance.TILE_WIDTH, instance.TILE_HEIGHT);
		}
	});
	
	// Draw the player
	c.fillStyle = '#00ffff';
	c.fillRect(this.player.x * this.TILE_WIDTH, this.player.y * this.TILE_HEIGHT,
		this.TILE_WIDTH, this.TILE_HEIGHT);
	
};