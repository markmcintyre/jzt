window.jzt = window.jzt || {};

jzt.Editor = function(canvasElement) {
	
	var me = this;

	this.canvasElement = canvasElement;

	this.canvasElement.addEventListener('mousemove', function(event){me.onCanvasMouseMoved(event)}, false);
	this.canvasElement.addEventListener('mousedown', function(event){me.onCanvasMouseDown(event)}, false);
	this.canvasElement.addEventListener('mouseup', function(event){me.onCanvasMouseUp(event)}, false);

	this.context = canvasElement.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

	this.boards = [];

	var mockGame = {
		TILE_SIZE: new jzt.Point(16, 32),
    	SPRITE_SIZE: new jzt.Point(8, 16),
    	resources: {}
	};

	mockGame.resources.graphics = new jzt.Graphics(mockGame, function() {
		me.addBoard('Untitled', 40, 15);
	});

	this.game = mockGame;

};

jzt.Editor.prototype.addBoard = function(boardName, width, height) {

	var template = {
		name: boardName,
		playerX: Math.round(width / 2),
		playerY: Math.round(height / 2),
		tiles: [],
		scripts: []
	};

	for(var row = 0; row < height; ++row) {

		var rowTiles = '';

		for(var column = 0; column < width; ++column) {

			switch(row) {
				case 0:
				case height-1:
					rowTiles += 'WL0E';
					break;
				default:
					if(column === 0 || column === width-1) {
						rowTiles += 'WL0E';
					}
					else {
						rowTiles += '    ';
					}
			}
		}

		template.tiles.push(rowTiles);

	}

	var newBoard = new jzt.Board(template, this.game);
	newBoard.initializePlayer(new jzt.things.Player());
	this.boards.push(newBoard);
	this.currentBoard = newBoard;
	newBoard.render(this.context);



};

jzt.Editor.prototype.eventToBoardPoint = function(event) {
	var x = Math.floor(event.offsetX / this.game.TILE_SIZE.x);
	var y = Math.floor(event.offsetY / this.game.TILE_SIZE.y);
	return new jzt.Point(x,y);
};


jzt.Editor.prototype.onCanvasMouseDown = function(event) {
	this.drawing = true;
	this.previousPlot = new jzt.Point(-1,-1);
	this.onCanvasMouseMoved(event);

};

jzt.Editor.prototype.onCanvasMouseMoved = function(event) {

	var point = this.eventToBoardPoint(event);

	if(!this.previousPlot || !this.previousPlot.equals(point)) {
		this.previousPlot = point;

		if(this.drawing) {
			this.currentBoard.setTile(point, new jzt.things.Wall());
		}

		this.currentBoard.render(this.context);
		this.drawCursor(point, this.context);

	}

};

jzt.Editor.prototype.onCanvasMouseUp = function(event) {
	this.drawing = false;
};

jzt.Editor.prototype.drawCursor = function(point, context) {
	context.fillStyle = 'rgba(255, 255, 255, 0.25)';
	context.strokeStyle = '#FFFFFF';
    context.fillRect(point.x * this.game.TILE_SIZE.x, point.y * this.game.TILE_SIZE.y,  this.game.TILE_SIZE.x, this.game.TILE_SIZE.y);
    context.strokeRect(point.x * this.game.TILE_SIZE.x, point.y * this.game.TILE_SIZE.y, this.game.TILE_SIZE.x, this.game.TILE_SIZE.y);
};