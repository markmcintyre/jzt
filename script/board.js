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
				this.setTile(new jzt.Point(column, row), tile);
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
		this.setTile(jztObject.point, jztObject);
		this.jztObjects.push(jztObject);
		
	}
	
};

	
jzt.Board.prototype.each = function(callback) {
	for(var y = 0; y < this.height; ++y) {
		for(var x = 0; x < this.width; ++x) {
			var tile = this.getTile(new jzt.Point(x,y));
			callback(tile);
		}
	}
}
	
jzt.Board.prototype.moveTile = function(oldPoint, newPoint) {
	this.setTile(newPoint, this.getTile(oldPoint));
	this.setTile(oldPoint, undefined);
}
	
jzt.Board.prototype.setTile = function(point, tile) {
	
	if(tile) {
		tile.point = point;
	}
	
	this.tiles[point.x + point.y * this.width] = tile;
	
}
	
jzt.Board.prototype.getTile = function(point) {
	return this.tiles[point.x + point.y * this.width];
}
	
jzt.Board.prototype.isPassable = function(point) {
		
	if(point.y < 0 || point.y >= this.width) {
		return false;
	}
	else if(point.x < 0 || point.x >= this.height) {
		return false;
	}
		
	return !this.getTile(point);
		
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
			c.fillRect(tile.point.x * instance.TILE_WIDTH, tile.point.y * instance.TILE_HEIGHT,
				instance.TILE_WIDTH, instance.TILE_HEIGHT);
		}
	});
	
	// Draw the player
	c.fillStyle = '#00ffff';
	c.fillRect(this.player.point.x * this.TILE_WIDTH, this.player.point.y * this.TILE_HEIGHT,
		this.TILE_WIDTH, this.TILE_HEIGHT);
	
};