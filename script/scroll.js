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
	this.screenWidth = owner.screenWidth;
	this.screenHeight = owner.screenHeight;
	this.width = 48;
	this.textAreaWidth = this.width - 8;
	this.height = 0;
	this.fullHeight = Math.min(Math.floor(owner.context.canvas.height / this.graphics.TILE_SIZE.y) - 2, 24);
	this.state = jzt.Scroll.ScrollState.Opening;
	this.origin = new jzt.Point(0,0);
	this.dots = [];
	this.cycleCount = 0;
	this.eventScheduler = new jzt.DelayedEventScheduler(this.game.CYCLE_TICKS * 2, 0);
	spaceSprite = this.graphics.getSprite(32);
	dotSprite = this.graphics.getSprite(7);
	for(index = 0; index < this.textAreaWidth-1; ++index) {
		if(index % 5 === 0) {
			this.dots.push(dotSprite);
		}
		else {
			this.dots.push(spaceSprite);
		}
	}
	this.dots.push(dotSprite);
	this.setHeight(0);
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
 * ScrollAction is an enumerated type representing a performable action for
 * this Scroll.
 */
jzt.Scroll.ScrollAction = {
	Up: 0,
	Down: 1,
	Select: 2,
	Exit: 3
}

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

	var splitLine = line.split(/\s+/);
	var index;
	var sprites;
	var adjustedText;
	var text;
	var effectiveWidth = lineLabel ? this.textAreaWidth - 2 : this.textAreaWidth;
	var me = this;

	function outputText(text) {
		sprites = me.graphics.textToSprites(adjustedText);
			
		if(center) {
			sprites.center = center;
		}

		if(lineLabel) {
			sprites.label = lineLabel;
		}

		me.lines.push(sprites);

	}

	// If we're a consecutive label, don't add a blank line
	if(!(lineLabel && this.lines.length > 0 && (this.lines[this.lines.length-1].label))) {
		if(this.lines.length > 0) {
			me.lines.push([]);
		}
	}

	// Initialize to blank text
	adjustedText = lineLabel ? '' : ' ';
	text = '';

	for(index = 0; index < splitLine.length; ++index) {

		text = splitLine[index];

		if(text.length > effectiveWidth) {
			text = text.substring(0, effectiveWidth);
		}

		// Add a space, unless we're exactly at the limit
		if(adjustedText.length > 0 && adjustedText.length < effectiveWidth) {
			adjustedText += ' ';
		}

		// If we've reached our maximum width, add our sprite line
		if(adjustedText.length > 0 && (adjustedText.length + text.length > effectiveWidth)) {
			
			outputText(adjustedText);

			// Clear our text
			adjustedText = '';

		}

		// Form our new adjusted text
		adjustedText += text;

	}

	// Add any remaining characters
	outputText(adjustedText);


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
	if(title) {
		this.title = this.graphics.textToSprites(title);
		this.title.center = true;
	}
	else {
		this.title = undefined;
	}
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
	
	this.textAreaHeight = this.title ? this.height - 4 : this.height - 2;

	if(this.textAreaHeight < 0) {
		this.textAreaHeight = 0;
	}

	this.middlePosition = Math.floor(this.textAreaHeight / 2);

	this.origin.x = Math.floor((this.screenWidth- this.width) / 2);
	this.origin.y = Math.floor((this.screenHeight- this.height) / 2);

};

jzt.Scroll.prototype.doTick = function() {

	var event = this.eventScheduler.takeEvent();
	var currentLabel;

	if(event === jzt.Scroll.ScrollAction.Up) {
		this.scrollUp();
	}
	else if(event === jzt.Scroll.ScrollAction.Down) {
		this.scrollDown();
	}
	else if(event === jzt.Scroll.ScrollAction.Select) {

		// Update our state to Closing.
		this.state = jzt.Scroll.ScrollState.Closing;

		currentLabel = this.getCurrentLabel();

		// Deliver our label to a registered listnere
		if(currentLabel && this.listener) {
			this.listener.sendMessage(currentLabel);
		}

	}
	else if(event === jzt.Scroll.ScrollAction.Exit) {
		this.state = jzt.Scroll.ScrollState.Closing;
	}

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
			this.eventScheduler.scheduleEvent(k.isPressed(k.UP), jzt.Scroll.ScrollAction.Up);
		}

		// If the down key is pressed, scroll down one block
		else if(k.isPressed(k.DOWN)) {
			this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), jzt.Scroll.ScrollAction.Down);
		}

		// If Enter is pressed...
		else if(k.isPressed(k.ENTER) || k.isPressed(k.SPACE)) {
			this.eventScheduler.scheduleEvent(k.isPressed(k.ENTER), jzt.Scroll.ScrollAction.Select);
		}

		// If Escape was pressed, close the scroll
		else if(k.isPressed(k.ESCAPE)) {
			this.eventScheduler.scheduleEvent(k.isPressed(k.ESCAPE), jzt.Scroll.ScrollAction.Exit);
		}

		// If nothing was currently down, cancel any previously scheduled event
		else {
			this.eventScheduler.cancelEvent();
		}

		// Update the cycle and do a tick if necessary
		if(++this.cycleCount >= this.game.CYCLE_RATE) {
	        this.cycleCount = 0;
	        this.doTick();
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
	var offset = this.title ? 3 : 1;
	var point;

	// If there is text to be rendered...
	if(line) {
		point = this.origin.clone();
		point.x += 4;
		point.y += offset + scrollIndex;
		this.drawText(line, point);
	}

	// If we are before the first line, or after the last line of text...
	else if(lineIndex === -1 || lineIndex === this.lines.length) {
		point = this.origin.clone();
		point.x += 4;
		point.y += offset + scrollIndex;
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
	var color = jzt.colors.Yellow;
	if(sprites.center) {
		color = jzt.colors.BrightWhite;
		point.x += Math.floor((this.textAreaWidth - sprites.length) / 2);
	}
	if(sprites.label) {
		color = jzt.colors.BrightWhite;
		this.graphics.getSprite(16).draw(this.game.context, point, jzt.colors.BrightMagenta);
		point.x += 2;
	}
	this.graphics.drawSprites(this.game.context, point, sprites, color, undefined);
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
	
	context.fillStyle = jzt.colors.Blue.rgbValue;
	context.fillRect(x * this.graphics.TILE_SIZE.x, y * this.graphics.TILE_SIZE.y, this.width * this.graphics.TILE_SIZE.x, this.height * this.graphics.TILE_SIZE.y);

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
	this.graphics.drawSprites(context, new jzt.Point(x,y), sprites, jzt.colors.BrightWhite);

	if(this.title && this.height > 3) {

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
		this.graphics.drawSprites(context, point, sprites, jzt.colors.BrightWhite);
		if(this.title) {
			point.x += 4;
			this.drawText(this.title, point);
		}

	}

	if(this.title && this.height > 2) {
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
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.BrightWhite);
	}

	if(!this.title || this.height > 5) {

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
			this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.BrightWhite);
			this.drawLine(lineIndex);

			// Draw the cursor
			if(lineIndex === this.middlePosition) {
				sprite = this.graphics.getSprite(175);
				sprite.draw(context, new jzt.Point(x+2,y), jzt.colors.BrightRed);
				sprite = this.graphics.getSprite(174);
				sprite.draw(context, new jzt.Point(x+this.width-3,y), jzt.colors.BrightRed);
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
		this.graphics.drawSprites(context, new jzt.Point(x,++y), sprites, jzt.colors.BrightWhite);
	}
	
};