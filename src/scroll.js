/**
 * JZT Scroll
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ConstructorError = require('./basic').ConstructorError,
    Point = require('./basic').Point,
    DelayedEventScheduler = require('./basic').DelayedEventScheduler,
    GameState = require('./game-state').GameState,
    Colors = require('./graphics').Colors;

/**
 * Scroll represents a scrollable window used for reading text and selecting options
 * from that text to be sent to a registered listener.
 *
 * @param owner a Game instance to own this Scroll.
 */
function Scroll(owner) {

    var spaceSprite;

    if (!(this instanceof Scroll)) {
        throw ConstructorError;
    }

    this.game = owner;
    this.graphics = owner.resources.graphics;
    this.lines = [];
    this.position = 0;
    this.cursor = -1;
    this.screenWidth = owner.screenWidth;
    this.screenHeight = owner.screenHeight;
    this.width = 48;
    this.textAreaWidth = this.width - 8;
    this.height = 0;
    this.fullHeight = Math.min(Math.floor(owner.context.canvas.height / this.graphics.TILE_SIZE.y) - 2, 24);
    this.textAreaHeight = this.fullHeight - 4;
    this.state = Scroll.ScrollState.Opening;
    this.origin = new Point(0, 0);
    this.cycleCount = 0;
    this.labels = [];
    this.eventScheduler = new DelayedEventScheduler(this.game.CYCLE_TICKS * 2, 0);
    spaceSprite = this.graphics.getSprite(32);
    this.setHeight(0);
    this.setPosition(0);
}

/**
 * ScrollState is an enumerated type representing an activate state for this
 * Scroll's finite state machine.
 */
Scroll.ScrollState = {
    Opening: 0,
    Open: 1,
    Closing: 2,
    Closed: 3
};

/**
 * ScrollAction is an enumerated type representing a performable action for
 * this Scroll.
 */
Scroll.ScrollAction = {
    Up: 0,
    Down: 1,
    Select: 2,
    Exit: 3
};

/**
 * Opens this scroll, readying it for reading by a player.
 */
Scroll.prototype.open = function () {
    this.state = Scroll.ScrollState.Opening;
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
Scroll.prototype.addLine = function (line, center, lineLabel) {

    var splitLine = line.split(/\s+/),
        index,
        sprites,
        adjustedText,
        text,
        effectiveWidth = lineLabel ? this.textAreaWidth - 2 : this.textAreaWidth,
        me = this;

    function outputText(adjustedText) {
        sprites = me.graphics.textToSprites(adjustedText);

        if (center) {
            sprites.center = center;
        }

        if (lineLabel) {
            sprites.label = lineLabel;
            me.labels.push(me.lines.length);
        }

        me.lines.push(sprites);

    }

    // If we're a consecutive label, don't add a blank line
    if (!(lineLabel && this.lines.length > 0 && (this.lines[this.lines.length - 1].label))) {
        if (this.lines.length > 0) {
            me.lines.push([]);
        }
    }

    // Initialize to blank text
    adjustedText = lineLabel ? '' : ' ';
    text = '';

    for (index = 0; index < splitLine.length; index += 1) {

        text = splitLine[index];

        if (text.length > effectiveWidth) {
            text = text.substring(0, effectiveWidth);
        }

        // Add a space, unless we're exactly at the limit
        if (adjustedText.length > 0 && adjustedText.length < effectiveWidth) {
            adjustedText += ' ';
        }

        // If we've reached our maximum width, add our sprite line
        if (adjustedText.length > 0 && (adjustedText.length + text.length > effectiveWidth)) {

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
 * Sets a position for this scroll.
 * 
 * @param {object} position - A scroll position
 */
Scroll.prototype.setPosition = function(position) {

    if(position > this.lines.length - this.textAreaHeight) {
        position = this.lines.length - this.textAreaHeight;
    }
    if(position < 0) {
        position = 0;
    }

    this.position = position;

};

/**
 * Updates this scroll's position to be one line higher.
 */
Scroll.prototype.scrollUp = function () {

    var visibleLabels = this.getVisibleLabels(),
        index;

    if(visibleLabels.length) {

        if(visibleLabels[0] === this.cursor) {
            this.setPosition(this.position - 1);
        } else {
            index = visibleLabels.length - 1;
            while(visibleLabels[index] >= this.cursor) {
                index -= 1;
            }
            this.cursor = visibleLabels[index];
        }

    } else {
        this.setPosition(this.position - 1);
        visibleLabels = this.getVisibleLabels();
        this.cursor = visibleLabels.length ? visibleLabels[0] : -1;
    }
};

/**
 * Updates this scroll's position to be one line lower.
 */
 Scroll.prototype.scrollDown = function () {
    
    var visibleLabels = this.getVisibleLabels(),
        index;

    if(visibleLabels.length) {

        if(visibleLabels[visibleLabels.length-1] === this.cursor) {
            this.setPosition(this.position + 1);
        } else {
            index = 0;
            while(visibleLabels[index] <= this.cursor) {
                index += 1;
            }
            this.cursor = visibleLabels[index];
        }

    } else {
        this.setPosition(this.position + 1);
        visibleLabels = this.getVisibleLabels();
        this.cursor = visibleLabels.length ? visibleLabels[0] : -1;
    }

};

/**
 * Assigns a title for this scroll. The title will be displayed to the player at the top of
 * the scroll's window.
 */
Scroll.prototype.setTitle = function (title) {
    if (title) {
        this.title = this.graphics.textToSprites(title);
        this.title.center = true;
    } else {
        this.title = undefined;
    }
};

/**
 * Retrieves an array of labels that are actively visible in the scroll.
 * @returns An array of labels
 */
Scroll.prototype.getVisibleLabels = function () {

    var labels = [],
        index = 0;

    if(this.labels.length) {

        for( index = this.position; index < Math.min(this.lines.length, this.position + this.textAreaHeight); ++index) {
            if (this.lines[index].label) {
                labels.push(index);
            }
        }

    }

    return labels;

};

/**
 * Retrieves the currently selected label, if applicable.
 *
 * @return a label name, or undefined if no such label is selected.
 */
Scroll.prototype.getCurrentLabel = function () {
    return this.cursor >= 0 ? this.lines[this.cursor].label : undefined;
};

/**
 * Assigns a height (in blocks) for this scroll. This height will be used when rendering
 * the scroll to the screen.
 *
 * @param height A height, in blocks, for this scroll.
 */
Scroll.prototype.setHeight = function (height) {
    this.height = height;

    this.textAreaHeight = this.title ? this.height - 4 : this.height - 2;

    if (this.textAreaHeight < 0) {
        this.textAreaHeight = 0;
    }

    this.origin.x = Math.floor((this.screenWidth - this.width) / 2);
    this.origin.y = Math.floor((this.screenHeight - this.height) / 2);

};

/**
 * Performs a "tick" on this scroll.
 */
Scroll.prototype.doTick = function () {

    var event = this.eventScheduler.takeEvent(),
        currentLabel;

    if (event === Scroll.ScrollAction.Up) {
        this.scrollUp();
    } else if (event === Scroll.ScrollAction.Down) {
        this.scrollDown();
    } else if (event === Scroll.ScrollAction.Select) {

        // Update our state to Closing.
        this.state = Scroll.ScrollState.Closing;

        currentLabel = this.getCurrentLabel();

        // Deliver our label to a registered listener
        if (currentLabel && this.listener) {
            this.listener.sendMessage(currentLabel);
        }

    } else if (event === Scroll.ScrollAction.Exit) {
        this.state = Scroll.ScrollState.Closing;
    }

};

/**
 * Updates this Scroll instance.
 */
Scroll.prototype.update = function () {

    var k = this.game.keyboard,
        visibleLabels;

    // Determine our scroll state
    if (this.state === Scroll.ScrollState.Opening) {

        // Our scroll is opening, so
        // increase our scroll's height on both ends
        this.setHeight(this.height + 2);
        this.setPosition(0);
        
        // If we have reached our full height, update our state to Open
        if (this.height >= Math.min(this.fullHeight, this.lines.length + 4)) {
            this.setHeight(Math.min(this.fullHeight, this.lines.length + 4));
            visibleLabels = this.getVisibleLabels();
            if(visibleLabels.length) {
                this.cursor = visibleLabels[0];
            }
            this.state = Scroll.ScrollState.Open;
        }

    } else if (this.state === Scroll.ScrollState.Open) {

        // Our scroll is open
        
        // Depending on which key was pressed...
        if (k.isPressed(k.UP)) {

            // The up key was pressed, so scroll up one block
            this.eventScheduler.scheduleEvent(k.isPressed(k.UP), Scroll.ScrollAction.Up);

        } else if (k.isPressed(k.DOWN)) {

            // The down key was pressed, so scroll down one block
            this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), Scroll.ScrollAction.Down);

        } else if (k.isPressed(k.ENTER)) {

            // Enter was pressed, so select the item
            this.eventScheduler.scheduleEvent(k.isPressed(k.ENTER), Scroll.ScrollAction.Select);

        } else if (k.isPressed(k.ESCAPE) || k.isPressed(k.SPACE)) {

            // Space or Escape was pressed, so close the scroll
            this.eventScheduler.scheduleEvent(k.isPressed(k.ESCAPE), Scroll.ScrollAction.Exit);

        } else {

            // Nothing is pressed, so cancel our events
            this.eventScheduler.cancelEvent();

        }

        // Update the cycle and do a tick if necessary
        this.cycleCount += 1;
        if (this.cycleCount >= this.game.CYCLE_RATE) {
            this.cycleCount = 0;
            this.doTick();
        }

    } else if (this.state === Scroll.ScrollState.Closing) {

        // Our scroll is currently closing, so
        // Reduce our height on both ends
        this.setHeight(this.height - 2);

        // If we are done closing, set our state to Closed
        if (this.height <= 2) {
            this.state = Scroll.ScrollState.Closed;
        }

    } else if (this.state === Scroll.ScrollState.Closed) {

        // Our scroll is closed, so
        // update our Game's state to Playing
        this.game.setState(GameState.Playing);

    }

};

/**
 * Clears all the lines in this Scroll instance, and reset its position to 0.
 */
Scroll.prototype.clearLines = function () {
    this.lines = [];
    this.labels = [];
    this.setPosition(0);
    this.cursor = -1;
};

/**
 * Draws a single line from this Scroll at a provided scroll index. The scroll index
 * is a zero-based value representing a visible line of text, relative to the top
 * of the scroll's visible content area.
 *
 * @param scrollIndex an index of a line to be rendered.
 */
Scroll.prototype.drawLine = function (scrollIndex) {

    var lineIndex = this.position + scrollIndex,
        line = this.lines[lineIndex],
        offset = this.title ? 3 : 1,
        point;

    if (line) {

        // Draw our line of text
        point = this.origin.clone();
        point.x += 4;
        point.y += offset + scrollIndex;

        line.selected = this.position + scrollIndex === this.cursor;
        this.drawText(line, point);

    }

};

/**
 * Draws some text to this Scroll's graphics context at a provided point.
 *
 * @param sprites An array of sprites to be drawn
 * @param point A Point at which to draw the sprites.
 */
Scroll.prototype.drawText = function (sprites, point) {
    var color = Colors.Yellow;
    if (sprites.center) {
        color = Colors.BrightWhite;
        point.x += Math.floor((this.textAreaWidth - sprites.length) / 2);
    }
    if (sprites.label) {
        color = Colors.BrightWhite;
        if (sprites.selected) {
            this.graphics.getSprite(16).draw(this.game.context, point, Colors.Cycle);
        } else {
            this.graphics.getSprite(7).draw(this.game.context, point, Colors.White);
        }
        point.x += 2;
    }
    this.graphics.drawSprites(this.game.context, point, sprites, color, undefined);
};

/**
 * Draws a scroll bar to the Scroll's graphics context at a provided point for a provided height.
 * 
 * @param {*} context A context onto which to draw a scrollbar
 * @param {*} point A point at which to draw a scrollbar
 * @param {*} height A height of a scroll bar to draw
 * @param {*} currentIndex An index to represent on a scrollbar
 * @param {*} visibleCount A number of visible indicies to represent on a scrollbar
 * @param {*} maximumIndex  A maximum index for a scrollbar
 */
Scroll.prototype.drawScrollBar = function (context, point, height, currentIndex, visibleCount, maximumIndex) {

    var thumbPosition,
        scrollbarArea = height - 2,
        thumbHeight = Math.max(1, Math.floor(scrollbarArea * (visibleCount / maximumIndex))),
        lastIndex = maximumIndex - visibleCount,
        index;

    // Clone our point
    point = point.clone();

    // Determine our thumb position
    thumbPosition = Math.ceil((scrollbarArea - thumbHeight - 2) * (currentIndex / lastIndex));

    for (index = 0; index < height; index += 1, point.y += 1) {

        // Determine what to draw
        if (index === 0) {

            // Draw our top arrow
            this.graphics.getSprite(30).draw(context, point, Colors.BrightBlue);

        } else if (index === height - 1) {

            // Draw our bottom arrow
            this.graphics.getSprite(31).draw(context, point, Colors.BrightBlue);

        } else if (index >= thumbPosition + 1 && index <= thumbPosition + 1 + thumbHeight) {

            // Draw our position indicator
            this.graphics.getSprite(219).draw(context, point, Colors.BrightBlue);

        } else {

            // Draw our shaded area
            this.graphics.getSprite(177).draw(context, point, Colors.BrightBlue);

        }

    }

};

/**
 * Renders a visual representation of this Scroll instance to a provided graphics context.
 *
 * @param context A graphics context to which to render this Scroll instance.
 */
Scroll.prototype.render = function (context) {

    var sprites = [],
        sprite,
        lineIndex,
        index,
        point,
        x = this.origin.x,
        y = this.origin.y;

    context.fillStyle = Colors.Blue.rgbValue;
    context.fillRect(x * this.graphics.TILE_SIZE.x, y * this.graphics.TILE_SIZE.y, this.width * this.graphics.TILE_SIZE.x, this.height * this.graphics.TILE_SIZE.y);

    // Draw top
    sprites.push(this.graphics.getSprite(218));
    index = this.width - 1;
    sprite = this.graphics.getSprite(196);

    while ((index - 1) > 0) {
        index -= 1;
        sprites.push(sprite);
    }

    sprites.push(this.graphics.getSprite(191));
    this.graphics.drawSprites(context, new Point(x, y), sprites, Colors.BrightWhite);

    if (this.title && this.height > 3) {

        // Draw Title Area
        sprites = [];
        sprites.push(this.graphics.getSprite(179));
        index = this.width - 1;
        sprite = this.graphics.getSprite(32);

        while ((index - 1) > 0) {
            index -= 1;
            sprites.push(sprite);
        }

        sprites.push(this.graphics.getSprite(179));
        y += 1;
        point = new Point(x, y);
        this.graphics.drawSprites(context, point, sprites, Colors.BrightWhite);
        if (this.title) {
            point.x += 4;
            this.drawText(this.title, point);
        }

    }

    if (this.title && this.height > 2) {
        // Draw Title Separator
        sprites = [];
        sprites.push(this.graphics.getSprite(195));
        index = this.width - 1;
        sprite = this.graphics.getSprite(196);
        while ((index - 1) > 0) {
            index -= 1;
            sprites.push(sprite);
        }
        sprites.push(this.graphics.getSprite(180));
        y += 1;
        this.graphics.drawSprites(context, new Point(x, y), sprites, Colors.BrightWhite);
    }

    if (!this.title || this.height > 4) {

        // Draw Lines
        for (lineIndex = 0; lineIndex < this.textAreaHeight; lineIndex += 1) {

            sprites = [];
            sprites.push(this.graphics.getSprite(179));
            index = this.width - 1;
            sprite = this.graphics.getSprite(32);
            while ((index - 1) > 0) {
                index -= 1;
                sprites.push(sprite);
            }
            sprites.push(this.graphics.getSprite(179));
            y += 1;
            this.graphics.drawSprites(context, new Point(x, y), sprites, Colors.BrightWhite);
            this.drawLine(lineIndex);

        }

    }

    if (this.height > 1) {
        // Draw bottom
        sprites = [];
        sprites.push(this.graphics.getSprite(192));
        index = this.width - 1;
        sprite = this.graphics.getSprite(196);
        while ((index - 1) > 0) {
            index -= 1;
            sprites.push(sprite);
        }
        sprites.push(this.graphics.getSprite(217));
        y += 1;
        this.graphics.drawSprites(context, new Point(x, y), sprites, Colors.BrightWhite);
    }

    // Draw our scrollbar
    if (this.state === Scroll.ScrollState.Open && this.lines.length > this.textAreaHeight) {

        this.drawScrollBar(context, new Point(this.origin.x + this.width - 2, this.origin.y + 3), this.height - 4, this.position, this.textAreaHeight, this.lines.length - 1);

    }
 
};

exports.Scroll = Scroll;
