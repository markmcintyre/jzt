window.jzt = window.jzt || {};
jzt.Scroll = function(owner) {
	var index;
	var spaceSprite;
	var dotSprite;
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
	this.origin = new jzt.Point(0,0);
	this.dots = [];
	spaceSprite = this.graphics.getSprite(32);
	dotSprite = this.graphics.getSprite(7);
	for(index = 0; index < this.textAreaWidth; ++index) {
		if(index % 5 === 0) {
			this.dots.push(dotSprite);
		}
		else {
			this.dots.push(spaceSprite);
		}
	}
};

jzt.Scroll.ScrollState = {
	Opening: 0,
	Open: 1,
	Closing: 2,
	Closed: 3
};

jzt.Scroll.prototype.open = function() {
	this.state = jzt.Scroll.ScrollState.Opening;
};

jzt.Scroll.prototype.addLine = function(line, center, lineLabel) {
	var sprites = this.graphics.textToSprites(line);
	if(center) {
		sprites.center = true;
	}
	if(lineLabel) {
		sprites.label = lineLabel;
	}
	this.lines.push(sprites);
};

jzt.Scroll.prototype.scrollUp = function() {
	if(--this.position < 0) {
		this.position = 0;
	}
};

jzt.Scroll.prototype.setTitle = function(title) {
	this.title = this.graphics.textToSprites(title);
	this.title.center = true;
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

	this.middlePosition = Math.floor(this.textAreaHeight / 2);

	this.origin.x = Math.floor((this.screenWidth- this.width) / 2);
	this.origin.y = Math.floor((this.screenHeight- this.height) / 2);

};

jzt.Scroll.prototype.update = function() {

	var k = this.game.keyboard;

	if (this.state === jzt.Scroll.ScrollState.Opening) {
		this.setHeight(this.height+2);
		if(this.height >= this.fullHeight) {
			this.state = jzt.Scroll.ScrollState.Open;
		}
	}
	else if(this.state === jzt.Scroll.ScrollState.Open) {

		if(k.isPressed(k.UP)) {
			this.scrollUp();
		}
		else if(k.isPressed(k.DOWN)) {
			this.scrollDown();
		}
		else if(k.isPressed(k.ENTER) || k.isPressed(k.ESCAPE)) {
			this.state = jzt.Scroll.ScrollState.Closing;
		}

	}
	else if(this.state === jzt.Scroll.ScrollState.Closing) {
		this.setHeight(this.height-2);
		if(this.height <= 2) {
			this.state = jzt.Scroll.ScrollState.Closed;
		}
	}
	else if(this.state === jzt.Scroll.ScrollState.Closed) {
		this.game.setState(jzt.GameState.Playing);
	}
};

jzt.Scroll.prototype.clearLines = function() {
	this.lines = [];
	this.position = 0;
};

jzt.Scroll.prototype.drawLine = function(scrollIndex) {

	var lineIndex = this.position + scrollIndex - this.middlePosition;
	var line = this.lines[lineIndex];

	if(line) {
		var point = this.origin.clone();
		point.x += 4;
		point.y += 3 + scrollIndex;
		this.drawText(line, point);
	}
	else if(lineIndex === -1 || lineIndex === this.lines.length) {
		var point = this.origin.clone();
		point.x += 4;
		point.y += 3 + scrollIndex;
		this.drawText(this.dots, point);
	}

};

jzt.Scroll.prototype.drawText = function(sprites, point) {
	var color = jzt.colors.Colors['E'];
	if(sprites.center) {
		color = jzt.colors.Colors['F'];
		point.x += Math.floor((this.textAreaWidth - sprites.length) / 2);
	}
	this.graphics.drawSprites(this.game.context, point, sprites, color, '*');
};

jzt.Scroll.prototype.render = function(context) {

	var sprites = [];
	var sprite;
	var lineIndex;
	var index;
	var point;
	var x = this.origin.x;
	var y = this.origin.y;
	
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
		point = new jzt.Point(x,++y);
		this.graphics.drawSprites(context, point, sprites, jzt.colors.Colors['F']);
		if(this.title) {
			point.x += 4;
			this.drawText(this.title, point);
		}

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
			this.drawLine(lineIndex);

			// Draw the cursor
			if(lineIndex === this.middlePosition) {
				sprite = this.graphics.getSprite(175);
				sprite.draw(context, new jzt.Point(x+2,y), jzt.colors.Colors['C']);
				sprite = this.graphics.getSprite(174);
				sprite.draw(context, new jzt.Point(x+this.width-3,y), jzt.colors.Colors['C']);
			}

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