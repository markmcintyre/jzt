window.jzt = window.jzt || {};
jzt.Scroll = function(owner) {
	this.game = owner;
	this.graphics = owner.resources.graphics;
	this.lines = [];
	this.position = 0;
	this.screenWidth = Math.floor(owner.context.canvas.width / owner.TILE_SIZE.x);
	this.screenHeight = Math.floor(owner.context.canvas.height / owner.TILE_SIZE.y);
	this.width = 49;
	this.textAreaWidth = this.width - 6;
	this.height = 0;
	this.fullHeight = Math.floor(owner.context.canvas.height / owner.TILE_SIZE.y) - 2;
	this.state = jzt.Scroll.ScrollState.Opening;
};

jzt.Scroll.ScrollState = {
	Opening: 0,
	Open: 1,
	Closing: 2,
	Closed: 3
};

jzt.Scroll.prototype.addLine = function(line, lineLabel) {
	if(lineLabel) {
		line.label = lineLabel;
	}
	this.lines.push(line);
};

jzt.Scroll.prototype.scrollUp = function() {
	if(--this.position < 0) {
		this.position = 0;
	}
};

jzt.Scroll.prototype.scrollDown = function() {
	if(++this.position >= this.lines.length) {
		this.position = this.lines.length-1;
	}
};

jzt.Scroll.prototype.getCurrentLabel = function() {
	return this.lines[this.position].label;
};

jzt.Scroll.prototype.setHeight = function(height) {
	this.height = height;
	
	this.textAreaHeight = this.height - 4;
	if(this.textAreaHeight < 0) {
		this.textAreaHeight = 0;
	}
};

jzt.Scroll.prototype.update = function() {

	if (this.state === jzt.Scroll.ScrollState.Opening) {
		this.setHeight(this.height+1);
		if(this.height >= this.fullHeight) {
			this.state = jzt.Scroll.ScrollState.Open;
		}
	}
	else if(this.state === jzt.Scroll.ScrollState.Open) {

	}
	else if(this.state === jzt.Scroll.ScrollState.Closing) {
		this.setHeight(this.height-1);
		if(this.height <= 0) {
			this.state = jzt.Scroll.ScrollState.Closed;
		}
	}
	else if(this.state === jzt.Scroll.ScrollState.Closed) {
		this.game.setState(jzt.GameState.Playing);
	}
};

jzt.Scroll.prototype.render = function(context) {

	var sprites = [];
	var sprite;
	var lineIndex;
	var index;
	var x = Math.floor((this.screenWidth- this.width) / 2);
	var y = Math.floor((this.screenHeight- this.height) / 2);

	context.fillStyle = jzt.colors.Colors['1'].rgbValue;
	context.fillRect(x * this.game.TILE_SIZE, y * this.game.TILE_SIZE, this.width * this.game.TILE_SIZE.x, this.height * this.game.TILE_SIZE.y);

	// Draw top
	sprites.push(this.graphics.getSprite(198));
	sprites.push(this.graphics.getSprite(209));
	index = this.width - 3;
	sprite = this.graphics.getSprite(205);
	while(--index) {
		sprites.push(sprite);
	}
	sprites.push(this.graphics.getSprite(209));
	sprites.push(this.graphics.getSprite(181));
	this.graphics.drawSprites(context, new jzt.Point(x,y), sprites, jzt.colors.Colors['F']);

	if(this.height > 3) {

		// Draw Title Area
		sprites = [];
		sprites.push(this.graphics.getSprite(32));
		sprites.push(this.graphics.getSprite(179));
		index = this.width - 3;
		sprite = this.graphics.getSprite(32);
		while(--index) {
			sprites.push(sprite);
		}
		sprites.push(this.graphics.getSprite(179));
		sprites.push(sprite);
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors['F']);

	}

	if( this.height > 2) {
		// Draw Title Separator
		sprites = [];
		sprites.push(sprite);
		sprites.push(this.graphics.getSprite(195));
		index = this.width - 3;
		sprite = this.graphics.getSprite(196);
		while(--index) {
			sprites.push(sprite);
		}
		sprites.push(this.graphics.getSprite(180));
		sprites.push(this.graphics.getSprite(32));
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors['F']);
	}

	if(this.height > 5) {
		// Draw Lines
		for(lineIndex = 0; lineIndex < this.textAreaHeight; ++lineIndex) {

			sprites = [];
			sprites.push(this.graphics.getSprite(32));
			sprites.push(this.graphics.getSprite(179));
			index = this.width - 3;
			sprite = this.graphics.getSprite(32);
			while(--index) {
				sprites.push(sprite);
			}
			sprites.push(this.graphics.getSprite(179));
			sprites.push(sprite);
			this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors['F']);

		}
	}

	if(this.height > 1) {
		// Draw bottom
		sprites = [];
		sprites.push(this.graphics.getSprite(198));
		sprites.push(this.graphics.getSprite(207));
		index = this.width - 3;
		sprite = this.graphics.getSprite(205);
		while(--index) {
			sprites.push(sprite);
		}
		sprites.push(this.graphics.getSprite(207));
		sprites.push(this.graphics.getSprite(181));
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors['F']);
	}
	
};