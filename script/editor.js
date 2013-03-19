window.jzt = window.jzt || {};

jzt.Editor = function(canvasElement) {
	
	this.canvasElement = canvasElement;

	function canvasClicked(event) {
		this.onCanvasClicked(event);
	}

	this.canvasElement.addEventListener('click', canvasClicked.bind(this), false);

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

	var me = this;
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

jzt.Editor.prototype.onCanvasClicked = function(event) {

	var x = Math.floor(event.offsetX / this.game.TILE_SIZE.x);
	var y = Math.floor(event.offsetY / this.game.TILE_SIZE.y);
	var point = new jzt.Point(x,y);

	console.log('Position: %s %s', x, y);

	this.currentBoard.setTile(point, new jzt.things.Wall());
	this.currentBoard.render(this.context);

};