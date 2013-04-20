window.jzt = window.jzt || {};
jzt.Scroll = function(owner) {
	this.game = owner;
	this.graphics = owner.resources.graphics;
	this.lines = [];
	this.position = 0;
	this.width = 49;
	this.height = 6;
	this.setSize(0,0);
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

jzt.Scroll.prototype.setSize = function(width, height) {
	this.width = this.width < width ? width : this.width;
	this.height = this.height < height ? height : this.height;
	this.textAreaWidth = this.width - 6;
	this.textAreaHeight = this.height - 4;
};

jzt.Scroll.prototype.update = function() {

};

jzt.Scroll.prototype.render = function(context) {

	var sprites = [];
	var sprite;
	var lineIndex;
	var index;
	var y = 0;

	context.fillStyle = jzt.colors.Colors['1'].rgbValue;
	context.fillRect(0, 0, this.width * this.game.TILE_SIZE.x, this.height * this.game.TILE_SIZE.y);

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
	this.graphics.drawSprites(context, new jzt.Point(0,y), sprites, jzt.colors.Colors['F']);

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
	this.graphics.drawSprites(context, new jzt.Point(0,++y), sprites, jzt.colors.Colors['F']);

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
	this.graphics.drawSprites(context, new jzt.Point(0,++y), sprites, jzt.colors.Colors['F']);

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
		this.graphics.drawSprites(context, new jzt.Point(0,++y), sprites, jzt.colors.Colors['F']);

	}

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
	this.graphics.drawSprites(context, new jzt.Point(0,++y), sprites, jzt.colors.Colors['F']);
	
};