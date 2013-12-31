window.jzt = window.jzt || {};

jzt.Editor = function(editorElement, configuration) {
	
	var me = this;

	this.editorElement = editorElement;
	this.templateCustomizer = document.getElementById('template-customizer');

	this.addBoardCallback = configuration.addBoard;
	this.removeBoardCallback = configuration.removeBoard;
	this.changeBoardCallback = configuration.changeBoard;
	this.changeTemplateCallback = configuration.changeTemplate;
	this.changeModeCallback = configuration.changeMode;
	this.changeBoardOptionsCallback = configuration.changeBoardOptions;
	this.changeGameOptionsCallback = configuration.changeGameOptions;

	this.mode = jzt.Editor.Mode.DRAW;

	this.boards = [];

	var mockGame = {
    	resources: {},
    	isDebugRendering: true,
    	context: {
    		canvas: {
    			width: 1,
    			height: 1
    		}
    	}
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

	this.graphics = mockGame.resources.graphics;


};

jzt.Editor.Mode = {
	DRAW: 0,
	SELECT: 1,
	FILL: 2
};

jzt.Editor.Thing = {
	Bear: {
		sensitivity: {type: 'number', min: 1, max: 10, default: 1, label: 'Sensitivity'},
		speed: {type: 'number', min: 1, max: 10, default: 2, label: 'Speed', advanced: true}
	},
	Blinker: {
		direction: {type: 'direction', default: 'E', label: 'Direction'},
		period: {type: 'number', min: 1, max: 50, default: 1, label: 'Period'},
		delay: {type: 'number', min: 0, max: 50, default: 0, label: 'Delay'},
		color: {type: 'color', default: '*9', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Bomb: {
		radius: {type: 'number', default: 4, min: 2, max: 20, label: 'Radius', advanced: true},
		color: {type: 'color', default: '*C', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Boulder: {
		color: {type: 'color', default: '*E', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	BreakableWall: {
		color: {type: 'color', default: '0B', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Centipede: {
		head: {type: 'boolean', default: false, label: 'Head'},
		deviance: {type: 'number', min: 1, max: 10, default: 0, label: 'Deviance'},
		intelligence: {type: 'number', min: 1, max: 10, default: 0},
		color: {type: 'color', default: '*9', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	River: {
		direction: {type: 'direction', default: 'N', label: 'Direction'}
	},
	Door: {
		color: {type: 'color', default: '1F', options: ['1','2','3','4','5','6','7'], foreground: false, label: 'Color'}
	},
	FakeWall: {
		color: {type: 'color', default: '0E', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Gem: {
		color: {type: 'color', default: '0D', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	InvisibleWall: {
		color: {type: 'color', default: '0A', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Key: {
		color: {type: 'color', default: '0F', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	LineWall: {
		color: {type: 'color', default: '09', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Lion: {
		speed: {type: 'number', min: 1, max: 10, default: 2, label: 'Speed', advanced: true},
		intelligence: {type: 'number', min: 1, max: 10, default: 3, label: 'Intelligence'}
	},
	Passage: {
		color: {type: 'color', default: '1F', options: ['1','2','3','4','5','6','7'], foreground: false, label: 'Color'},
		passageId: {type: 'text', default: 'Door 1', label: 'ID'},
		targetBoard: {type: 'board', label: 'Target Board'}
	},
	Pusher: {
		speed: {type: 'number', default: 3, min: '1', max: '10', label: 'Speed', advanced: true},
		orientation: {type: 'direction', default: 'S', label: 'Direction'},
		color: {type: 'color', default: '*E', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Ruffian: {
		speed: {type: 'number', default: 3, min: '1', max: '10', label: 'Speed', advanced: true},
		intelligence: {type: 'number', default: 5, min: '1', max: '10', label: 'Intelligence'},
		restingTime: {type: 'number', default: 5, min: '1', max: '20', label: 'Resting time'}
	},
	Scriptable: {
		name: {type: 'text', default: 'Unknown', label: 'Name'},
		color: {type: 'color', default: '*F', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'},
		script: {type: 'script', label: 'Script'},
		speed: {type: 'number', min: 1, max: 10, default: 3, label: 'Speed'}
	},
	SliderEw: {
		color: {type: 'color', default: '*F', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	SliderNs: {
		color: {type: 'color', default: '*F', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Snake: {
		speed: {type: 'number', default: 3, min: 1, max: 10, label: 'Speed'}
	},
	SolidWall: {
		color: {type: 'color', default: '0E', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Spider: {
		intelligence: {type: 'number', default: 5, min: 1, max: 5, label: 'Intelligence'},
		color: {type: 'color', default: '*C', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	SpinningGun: {
		intelligence: {type: 'number', default: 5, min: 1, max: 5, label: 'Intelligence'},
		firingRate: {type: 'number', default: 5, min: 1, max: 10, label: 'Firing rate'},
		color: {type: 'color', default: '*A', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Teleporter: {
		orientation: {type: 'direction', default: 'E', label: 'Direction'},
		color: {type: 'color', default: '*B', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	},
	Tiger: {
		speed: {type: 'number', min: 1, max: 10, default: 2, label: 'Speed', advanced: true},
		intelligence: {type: 'number', min: 1, max: 10, default: 3, label: 'Intelligence'},
		firingRate: {type: 'number', min: 1, max: 20, default: 5, label: 'Firing rate'}
	},
	Wall: {
		color: {type: 'color', default: '0E', options: ['9','A','B','C','D','E','F'], foreground: true, label: 'Color'}
	}
};

jzt.Editor.prototype.initializeBoardElement = function(board) {

	var me = this;

	// Remove the old canvas
	this.editorElement.innerHTML = '';

	// Create a new canvas
	this.canvasElement = document.createElement('canvas');
	this.canvasElement.width = board.width * this.graphics.TILE_SIZE.x;
	this.canvasElement.height = board.height * this.graphics.TILE_SIZE.y;

	// Add our canvas
	this.editorElement.appendChild(this.canvasElement);

	// Add our event listeners
	this.canvasElement.addEventListener('mousemove', function(event){me.onCanvasMouseMoved(event)}, false);
	this.canvasElement.addEventListener('mousedown', function(event){me.onCanvasMouseDown(event)}, false);
	this.canvasElement.addEventListener('mouseup', function(event){me.onCanvasMouseUp(event)}, false);
	window.addEventListener('keydown', function(event){me.onKeyDown(event)}, false);

	// Assign our context
	this.context = this.canvasElement.getContext('2d');
	this.game.context = this.context;
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    // Scroll to the correct location
    //editArea.scrollTop = (canvas.height - editArea.clientHeight) / 2;
	//editArea.scrollLeft = (canvas.width - editArea.clientWidth) / 2;

};

jzt.Editor.prototype.setBoardOptions = function(options) {
	this.currentBoard.dark = options.dark;
	this.currentBoard.north = options.north !== '' ? options.north : undefined;
	this.currentBoard.south = options.south !== '' ? options.south : undefined;
	this.currentBoard.east = options.east !== '' ? options.east : undefined;
	this.currentBoard.west = options.west !== '' ? options.west : undefined;
	this.changeBoardOptionsCallback.call(this, options);
};

jzt.Editor.prototype.setGameOptions = function(options) {
	this.game.title = options.title;
	this.game.author = options.author;
	this.game.titleBoard = options.titleBoard;
	this.game.startingBoard = options.startingBoard;
	this.game.victoryBoard = options.victoryBoard;
	this.changeGameOptionsCallback.call(this, options);
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
	var boardOptions;

	this.currentBoard = board;
	if(!board.player) {
		this.currentBoard.initializePlayer(new jzt.things.Player());
	}

	this.initializeBoardElement(board);

	this.currentBoard.initializeWindow();
	this.currentBoard.render(this.context);

	this.changeBoardCallback.call(this, boardName);
	boardOptions = {
		north: board.north,
		east: board.east,
		south: board.south,
		west: board.west,
		dark: board.dark
	}
	this.changeBoardOptionsCallback.call(this, boardOptions);

};

jzt.Editor.prototype.save = function() {
	var data = JSON.stringify(this.serialize());
	data = LZString.compressToUTF16(data);
	localStorage['currentGame'] = data;
};

jzt.Editor.prototype.load = function() {
	var data = localStorage['currentGame'];
	if(data) {
		var loadedData = LZString.decompressFromUTF16(data);
		loadedData = JSON.parse(loadedData);
		this.deserialize(loadedData);
	}
	else {
		throw 'No game data available.';
	}
};

jzt.Editor.prototype.deserialize = function(data) {

	var index;
	var board;
	var options = {};

	for(index = 0; index < this.boards.length; ++index) {
		this.removeBoardCallback.call(this, this.boards[index].name);
	}

	

	this.boards = [];

	for(index = 0; index < data.boards.length; ++index) {
		board = new jzt.Board(data.boards[index], this.game);
		this.boards.push(board);
		this.addBoardCallback.call(this, board.name);
	}
	

	options.title = data.title;
	options.author = data.author;
	options.titleBoard = data.titleBoard;
	options.startingBoard = data.startingBoard;
	options.victoryBoard = data.victoryBoard;

	this.setGameOptions(options);

	this.switchBoard(data.startingBoard);

};

jzt.Editor.prototype.serialize = function() {
	var result = {};
	result.title = this.game.title;
	result.titleBoard = this.game.titleBoard;
	result.startingBoard = this.game.startingBoard;
	result.victoryBoard = this.game.victoryBoard;
	result.author = this.game.author;
	result.boards = [];
	for(var index = 0; index < this.boards.length; ++index) {
		result.boards.push(this.boards[index].serialize());
	}
	return result;
};

jzt.Editor.prototype.setMode = function(mode) {
	this.mode = mode;
	this.changeModeCallback.call(this, mode);
};

jzt.Editor.prototype.removeBoard = function(boardName) {
	var index;
	var found = -1;
	for(index = 0; index < this.boards.length; ++index) {
		if(this.boards[index].name === boardName) {
			found = index;
			break;
		}
	}
	if(found >= 0) {
		this.boards.splice(found, 1);
		this.removeBoardCallback.call(this, boardName);

		if(this.boards.length > 0) {
			this.switchBoard(this.boards[0].name);
		}
	}

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

jzt.Editor.prototype.getTemplateThing = function(template) {

	if(template && template.type) {

		for(thing in jzt.Editor.Thing) {
			if(jzt.Editor.Thing.hasOwnProperty(thing)) {

				if(thing === template.type) {
					return jzt.Editor.Thing[thing];
				}

			}
		}

	}

};

jzt.Editor.prototype.createField = function(fieldName, field, template) {

	var label;
	var element;
	var me = this;
	var index;
	var nonStandard = false;

	label = document.createElement('label');
	label.innerHTML = field.label + ':';

	if(field.type === 'number') {
		element = document.createElement('input');
		element.type = 'range';
		element.min = field.min;
		element.max = field.max;
	}
	else if(field.type === 'direction') {
		element = document.createElement('select');
		element.options[element.options.length] = new Option('North', 'N');
		element.options[element.options.length] = new Option('East', 'E');
		element.options[element.options.length] = new Option('South', 'S');
		element.options[element.options.length] = new Option('West', 'W');
	}
	else if(field.type === 'boolean') {
		element = document.createElement('input');
		element.type = 'checkbox';
		nonStandard = true;
		element.addEventListener('click', function(event) {
			template[fieldName] = element.checked;
			me.changeTemplateCallback.call(me, me.activeTemplate);
		}, false);
		if(template.hasOwnProperty(fieldName)) {
			element.checked = template[fieldName];
		}
		else if(field.default) {
			element.checked = field.default;
		}
	}
	else if(field.type === 'color') {
		element = document.createElement('select');
		for(index = 0; index < field.options.length; ++index) {
			element.options[element.options.length] = new Option(jzt.colors.getColor(field.options[index]).name, field.options[index]);
		}
		nonStandard = true;
		element.addEventListener('change', function(event) {
			var oldValue = template[fieldName];
			var background;
			var foreground;

			oldValue = oldValue ? oldValue : field.default ? field.default : '**';
			background = jzt.colors.deserializeBackground(oldValue);
			foreground = jzt.colors.deserializeForeground(oldValue);

			if(field.foreground) {
				template[fieldName] = jzt.colors.serialize(background, jzt.colors.getColor(element.value));
			}
			else {
				template[fieldName] = jzt.colors.serialize(jzt.colors.getColor(element.value), foreground);
			}

			me.changeTemplateCallback.call(me, me.activeTemplate);

		}, false); 
		if(template.hasOwnProperty(fieldName)) {
			if(field.foreground) {
				element.value = jzt.colors.deserializeForeground(template[fieldName]).code;
			}
			else {
				element.value = jzt.colors.deserializeBackground(template[fieldName]).code;
			}
		}
	}
	else {
		element = document.createElement('input');
	}

	if(!nonStandard && element) {

		element.addEventListener('change', function(event) {
			template[fieldName] = element.value;
			me.changeTemplateCallback.call(me, me.activeTemplate);
		}, false);

		if(template.hasOwnProperty(fieldName)) {
			element.value = template[fieldName];
		}
		else if(field.default) {
			element.value = field.default;
		}

	}

	label.appendChild(element);

	return label;
	

};

jzt.Editor.prototype.setActiveTemplate = function(template) {

	var thing;
	var field;
	var element;
	var label;

	this.activeTemplate = template;
	this.templateCustomizer.innerHTML = '';

	thing = this.getTemplateThing(template);
	if(thing) {

		for(field in thing) {
			if(thing.hasOwnProperty(field)) {

				if(this.advancedMode || !thing[field].advanced) {
					this.templateCustomizer.appendChild(this.createField(field, thing[field], template));
					this.templateCustomizer.appendChild(document.createElement('br'));
				}

			}
		}

	}


	this.changeTemplateCallback.call(this, this.activeTemplate);
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
	this.changeTemplateCallback.call(this, this.activeTemplate);
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
	this.changeTemplateCallback.call(this, this.activeTemplate);
};

jzt.Editor.prototype.eventToBoardPoint = function(event) {
	var x = Math.floor(event.offsetX / this.game.resources.graphics.TILE_SIZE.x);
	var y = Math.floor(event.offsetY / this.game.resources.graphics.TILE_SIZE.y);
	return new jzt.Point(x,y);
};

jzt.Editor.prototype.onKeyDown = function(event) {
	if(event.keyCode === 83) {
		this.setMode(jzt.Editor.Mode.SELECT);
	}
	else if(event.keyCode === 68) {
		this.setMode(jzt.Editor.Mode.DRAW);
	}
	else if(event.keyCode === 70) {
		this.setMode(jzt.Editor.Mode.FILL);
	}
};

jzt.Editor.prototype.onCanvasMouseDown = function(event) {

	if(this.mode === jzt.Editor.Mode.DRAW) {
		this.drawing = true;
		this.previousPlot = new jzt.Point(-1,-1);
	}

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

	var thing;
	var point = this.eventToBoardPoint(event);
	var convertedPoint = point.add(this.currentBoard.windowOrigin);


	this.drawing = false;

	if(this.mode === jzt.Editor.Mode.SELECT) {

		thing = this.currentBoard.getTile(convertedPoint);
		if(thing) {
			this.setActiveTemplate(thing.serialize());
		}
		else {
			this.setActiveTemplate(undefined);
		}

	}
	else if(this.mode === jzt.Editor.Mode.FILL) {

		this.fill(convertedPoint);

	}

	this.currentBoard.render(this.context);


};

jzt.Editor.prototype.fill = function(point) {

	var thing;
	var targetDetails;
	var me = this;

	function getDetails(thing) {

		var type;
		var color;

		if(thing && thing.constructor.hasOwnProperty('serializationType')) {
			type = thing.constructor.serializationType;
		}

		if(thing) {
			color = jzt.colors.serialize(thing.foreground, thing.background);
		}

		return '' + type + color;

	}

	function fillNeighbour(point, targetDetails) {

		var details = getDetails(me.currentBoard.getTile(point));
		if(details === targetDetails) {
			me.fill(point);
		}

	}

	if(this.currentBoard.isOutside(point)) {
		return;
	}

	thing = this.currentBoard.getTile(point);
	targetDetails = getDetails(thing);

	// Don't fill if we're already the correct type
	if(getDetails(jzt.things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard)) === targetDetails) {
		return;
	}

	// If we have an active template, add our thing
	if(this.activeTemplate) {
		this.currentBoard.addThing(point, jzt.things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard));
	}
	else {
		this.currentBoard.addThing(point, undefined);
	}

	fillNeighbour(point.add(jzt.Direction.North), targetDetails);
	fillNeighbour(point.add(jzt.Direction.East), targetDetails);
	fillNeighbour(point.add(jzt.Direction.South), targetDetails);
	fillNeighbour(point.add(jzt.Direction.West), targetDetails);

};

jzt.Editor.prototype.drawCursor = function(point, context) {

	var xSize = this.graphics.TILE_SIZE.x;
	var ySize = this.graphics.TILE_SIZE.y;
	var xPos = point.x * this.graphics.TILE_SIZE.x;
	var yPos = point.y * this.graphics.TILE_SIZE.y;

	context.fillStyle = 'rgba(255, 255, 255, 0.25)';
	context.strokeStyle = '#FFFFFF';

    context.fillRect(xPos, yPos,  xSize, ySize);
    
    // If we're in drawing mode
    if(this.mode === jzt.Editor.Mode.DRAW) {
    	context.strokeRect(xPos, yPos, xSize, ySize);
    }

    // If we're in select mode
    else if(this.mode === jzt.Editor.Mode.SELECT) {
    	context.beginPath();
    	context.moveTo(xPos + (xSize / 2), yPos);
    	context.lineTo(xPos + (xSize / 2), yPos + ySize);
    	context.moveTo(xPos, yPos + (ySize / 2));
    	context.lineTo(xPos + xSize, yPos + (ySize / 2));
    	context.stroke();
    }
};