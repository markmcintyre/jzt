/**
 * JZT Scroll
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jzt = jzt || {};

/**
 * Scroll represents a scrollable window used for reading text and selecting options
 * from that text to be sent to a registered listener.
 *
 * @param owner a Game instance to own this Scroll.
 */
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

/**
 * ScrollState is an enumerated type representing an activate state for this
 * Scroll's finite state machine.
 */
jzt.Scroll.ScrollState = {
	Opening: 0,
	Open: 1,
	Closing: 2,
	Closed: 3
};

/**
 * Opens this scroll, readying it for reading by a player.
 */
jzt.Scroll.prototype.open = function() {
	this.state = jzt.Scroll.ScrollState.Opening;
};

/**
 * Adds a line of text to this scroll. This line can be optionally centered in
 * its window, and given a label which will present it for selection and delivery
 * to a registered listener.
 *
 * @param line A line of text to add to this Scroll instance.
 * @param center Whether or not to center the line in the window
 * @param lineLabel A label to be delivered to a registered listener if the line is selected.
 */
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

/**
 * Updates this scroll's position to be one line higher.
 */
jzt.Scroll.prototype.scrollUp = function() {
	if(--this.position < 0) {
		this.position = 0;
	}
};

/**
 * Assigns a title for this scroll. The title will be displayed to the player at the top of
 * the scroll's window.
 */
jzt.Scroll.prototype.setTitle = function(title) {
	this.title = this.graphics.textToSprites(title);
	this.title.center = true;
};

/**
 * Updates this scroll's position to be one line lower.
 */
jzt.Scroll.prototype.scrollDown = function() {
	if(++this.position >= this.lines.length) {
		this.position = this.lines.length-1;
	}
};

/**
 * Retrieves the currently selected label, if applicable.
 *
 * @return a label name, or undefined if no such label is selected.
 */
jzt.Scroll.prototype.getCurrentLabel = function() {
	return this.lines[this.position].label;
};

/**
 * Assigns a height (in blocks) for this scroll. This height will be used when rendering
 * the scroll to the screen.
 * 
 * @param height A height, in blocks, for this scroll.
 */
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

/**
 * Updates this Scroll instance.
 */
jzt.Scroll.prototype.update = function() {

	var k = this.game.keyboard;

	// If the scroll is currently opening...
	if (this.state === jzt.Scroll.ScrollState.Opening) {

		// Increase our scroll's height on both ends
		this.setHeight(this.height+2);

		// If we have reached our full height, update our state to Open
		if(this.height >= this.fullHeight) {
			this.state = jzt.Scroll.ScrollState.Open;
		}

	}

	// If this scroll is currently open...
	else if(this.state === jzt.Scroll.ScrollState.Open) {

		// If the up key is pressed, scroll up one block
		if(k.isPressed(k.UP)) {
			this.scrollUp();
		}

		// If the down key is pressed, scroll down one block
		else if(k.isPressed(k.DOWN)) {
			this.scrollDown();
		}

		// If Enter is pressed...
		else if(k.isPressed(k.ENTER)) {

			// Update our state to Closing.
			this.state = jzt.Scroll.ScrollState.Closing;

			// Deliver our label to a registered listnere
			if(this.getCurrentLabel()) {
				this.listener.sendMessage();
			}

		}

		// If Escape was pressed, close the scroll
		else if(k.isPressed(k.ESCAPE)) {
			this.state = jzt.Scroll.ScrollState.Closing;
		}

	}

	// If this scroll is currently closing...
	else if(this.state === jzt.Scroll.ScrollState.Closing) {

		// Reduce our height on both ends
		this.setHeight(this.height-2);

		// If we are done closing, set our state to Closed
		if(this.height <= 2) {
			this.state = jzt.Scroll.ScrollState.Closed;
		}

	}

	// IF this scroll is currently closed
	else if(this.state === jzt.Scroll.ScrollState.Closed) {

		// Update our Game's state to Playing
		this.game.setState(jzt.GameState.Playing);

	}

};

/**
 * Clears all the lines in this Scroll instance, and reset its position to 0.
 */
jzt.Scroll.prototype.clearLines = function() {
	this.lines = [];
	this.position = 0;
};

/**
 * Draws a single line from this Scroll at a provided scroll index. The scroll index
 * is a zero-based value representing a visible line of text, relative to the top
 * of the scroll's visible content area.
 * 
 * @param scrollIndex an index of a line to be rendered.
 */
jzt.Scroll.prototype.drawLine = function(scrollIndex) {

	var lineIndex = this.position + scrollIndex - this.middlePosition;
	var line = this.lines[lineIndex];
	var point;

	// If there is text to be rendered...
	if(line) {
		point = this.origin.clone();
		point.x += 4;
		point.y += 3 + scrollIndex;
		this.drawText(line, point);
	}

	// If we are before the first line, or after the last line of text...
	else if(lineIndex === -1 || lineIndex === this.lines.length) {
		point = this.origin.clone();
		point.x += 4;
		point.y += 3 + scrollIndex;
		this.drawText(this.dots, point);
	}

};

/**
 * Draws some text to this Scroll's graphics context at a provided point.
 * 
 * @param sprites An array of sprites to be drawn
 * @param point A Point at which to draw the sprites.
 */
jzt.Scroll.prototype.drawText = function(sprites, point) {
	var color = jzt.colors.Colors.E;
	if(sprites.center) {
		color = jzt.colors.Colors.F;
		point.x += Math.floor((this.textAreaWidth - sprites.length) / 2);
	}
	this.graphics.drawSprites(this.game.context, point, sprites, color, '*');
};

/**
 * Renders a visual representation of this Scroll instance to a provided graphics context.
 *
 * @param context A graphics context to which to render this Scroll instance.
 */
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
	this.graphics.drawSprites(context, new jzt.Point(x,y), sprites, jzt.colors.Colors.F);

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
		this.graphics.drawSprites(context, point, sprites, jzt.colors.Colors.F);
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
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors.F);
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
			this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors.F);
			this.drawLine(lineIndex);

			// Draw the cursor
			if(lineIndex === this.middlePosition) {
				sprite = this.graphics.getSprite(175);
				sprite.draw(context, new jzt.Point(x+2,y), jzt.colors.Colors.C);
				sprite = this.graphics.getSprite(174);
				sprite.draw(context, new jzt.Point(x+this.width-3,y), jzt.colors.Colors.C);
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
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.Colors.F);
	}
	
};