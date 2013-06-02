window.jzt = window.jzt || {};

jzt.Editor = function(canvasElement, configuration) {
	
	var me = this;

	this.addBoardCallback = configuration.addBoard;
	this.removeBoardCallback = configuration.removeBoard;
	this.changeBoardCallback = configuration.changeBoard;
	this.templateChangeCallback = configuration.changeTemplate;

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
    	resources: {},
    	isDebugRendering: true,
    	context: this.context
	};

	this.game = mockGame;

	mockGame.resources.graphics = new jzt.Graphics(function() {

		if(localStorage['currentGame']) {
			try {
				me.load();
			}
			catch(exception) {
				alert('Could not load previously stored game.');
				me.addBoard('Untitled', 40, 15);
			}
		}
		else {
			me.addBoard('Untitled', 40, 15);
		}
	});


};

jzt.Editor.prototype.getUniqueBoardName = function(candidate) {

	var index = 2;
	var currentTry = candidate;

	while(this.getBoard(currentTry)) {
		currentTry = candidate + index++;
	}

	return currentTry;

};

jzt.Editor.prototype.getUniqueScriptName = function(candidate) {

	var index = 2;
	var currentTry = candidate;

	while(this.currentBoard.getScript(currentTry)) {
		currentTry = candidate + index++;
	}

	return currentTry;

};

jzt.Editor.prototype.getBoard = function(boardName) {
	for(var index = 0; index < this.boards.length; ++index) {
		if(this.boards[index].name === boardName) {
			return this.boards[index];
		}
	}

	return undefined;
};

jzt.Editor.prototype.switchBoard = function(boardName) {

	var board = this.getBoard(boardName);
	this.currentBoard = board;
	this.currentBoard.initializePlayer(new jzt.things.Player());
	this.currentBoard.render(this.context);

	this.changeBoardCallback.call(this, boardName);

};

jzt.Editor.prototype.save = function() {
	localStorage['currentGame'] = JSON.stringify(this.serialize());
};

jzt.Editor.prototype.load = function() {
	var data = localStorage['currentGame'];
	if(data) {
		var loadedData = JSON.parse(data);
		this.deserialize(loadedData);
	}
	else {
		throw 'No game data available.';
	}
};

jzt.Editor.prototype.deserialize = function(data) {
	this.boards = [];
	for(var index = 0; index < data.boards.length; ++index) {
		var board = new jzt.Board(data.boards[index], this.game);
		this.boards.push(board);
		this.addBoardCallback.call(this, board.name);
	}
	this.switchBoard(data.startingBoard);
};

jzt.Editor.prototype.serialize = function() {
	var result = {};
	result.name = 'Untitled Game';
	result.startingBoard = this.boards[0].name;
	result.author = 'Mark McIntyre';
	result.boards = [];
	for(var index = 0; index < this.boards.length; ++index) {
		result.boards.push(this.boards[index].serialize());
	}
	return result;
};

jzt.Editor.prototype.addBoard = function(boardName, width, height) {

	var template = {
		name: boardName,
		playerX: Math.floor(width / 2),
		playerY: Math.floor(height / 2),
		height: height,
		width: width,
		tiles: [],
		scripts: []
	};

	for(var row = 0; row < height; ++row) {
		for(var column = 0; column < width; ++column) {

			switch(row) {
				case 0:
				case height-1:
					template.tiles[column + row * width] = {type: 'Wall'};
					break;
				default:
					if(column === 0 || column === width-1) {
						template.tiles[column + row * width] = {type: 'Wall'};
					}
					else {
						template.tiles[column + row * width] = {};
					}
			}
		}
	}

	var newBoard = new jzt.Board(template, this.game);
	newBoard.initializePlayer(new jzt.things.Player());
	this.boards.push(newBoard);
	
	if(this.addBoardCallback) {
		this.addBoardCallback.call(this, newBoard.name);
	}

	this.switchBoard(newBoard.name);

};

jzt.Editor.prototype.setActiveTemplate = function(template) {
	this.activeTemplate = template;
	this.templateChangeCallback.call(this, this.activeTemplate);
};

jzt.Editor.prototype.setTemplateForeground = function(foreground) {
	var background;
	if(!this.activeTemplate) {
		return;
	}
	if(this.activeTemplate.color) {
        background = jzt.colors.deserializeBackground(this.activeTemplate.color);
        this.activeTemplate.color = jzt.colors.serialize(background, foreground);
    }
    else {
    	this.activeTemplate.color = jzt.colors.serialize(jzt.colors.Black, foreground);
    }
	this.templateChangeCallback.call(this, this.activeTemplate);
};

jzt.Editor.prototype.setTemplateBackground = function(background) {
	var foreground;
	if(!this.activeTemplate) {
		return;
	}
	if(this.activeTemplate.color) {
		foreground = jzt.colors.deserializeForeground(this.activeTemplate.color);
		this.activeTemplate.color = jzt.colors.serialize(background, foreground);
	}
	else {
		this.activeTemplate.color = jzt.colors.serialize(background, jzt.colors.Yellow);
	}
	this.templateChangeCallback.call(this, this.activeTemplate);
};

jzt.Editor.prototype.eventToBoardPoint = function(event) {
	var x = Math.floor(event.offsetX / this.game.resources.graphics.TILE_SIZE.x);
	var y = Math.floor(event.offsetY / this.game.resources.graphics.TILE_SIZE.y);
	return new jzt.Point(x,y);
};


jzt.Editor.prototype.onCanvasMouseDown = function(event) {
	this.drawing = true;
	this.previousPlot = new jzt.Point(-1,-1);

	this.onCanvasMouseMoved(event);

};

jzt.Editor.prototype.onCanvasMouseMoved = function(event) {

	var point = this.eventToBoardPoint(event);
	var convertedPoint = point.add(this.currentBoard.windowOrigin);

	if(!this.previousPlot || !this.previousPlot.equals(point)) {
		this.previousPlot = point;

		if(this.drawing && !this.currentBoard.isOutside(convertedPoint)) {

			if(this.activeTemplate) {
				this.currentBoard.addThing(convertedPoint, jzt.things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard));
			}
			else {
				this.currentBoard.addThing(convertedPoint, undefined);
			}
			
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
    context.fillRect(point.x * this.game.resources.graphics.TILE_SIZE.x, point.y * this.game.resources.graphics.TILE_SIZE.y,  this.game.resources.graphics.TILE_SIZE.x, this.game.resources.graphics.TILE_SIZE.y);
    context.strokeRect(point.x * this.game.resources.graphics.TILE_SIZE.x, point.y * this.game.resources.graphics.TILE_SIZE.y, this.game.resources.graphics.TILE_SIZE.x, this.game.resources.graphics.TILE_SIZE.y);
};