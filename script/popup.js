/**
 * JZT Popup
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

"use strict";

var jzt = jzt || {};
jzt.ui = jzt.ui || {};

/**
 * Popup represents a pop-up box with a given position and size, capable of
 * holding sprite information.
 *
 * @param position a Point indicating an x, y coordinate for this popup
 * @param size a Point representing a width and height for this popup
 * @param game A Game instance to own this Popup
 */
jzt.ui.Popup = function(position, size, game) {

	if(position) {
		this.position = position;
	}
	else {

		this.position = new jzt.Point(0, 0);
		this.position.x = Math.floor((game.screenWidth - size.x) / 2);
		this.position.y = Math.floor((game.screenHeight - size.y) / 2);

	}

	this.size = size;
	this.game = game;
	this.graphics = game.resources.graphics;
	this.spriteGrid = new jzt.SpriteGrid(this.size.x, this.size.y, this.graphics);
	this.setColor(jzt.colors.Blue, jzt.colors.BrightWhite);

};

/**
 * Renders this Popup to a specified context.
 *
 * @param c A 2D context onto which to render this Popup.
 */
jzt.ui.Popup.prototype.render = function(c) {

	var x = this.position.x;
	var y = this.position.y;
	var width = this.size.x;
	var height = this.size.y;

	c.fillStyle = this.background.rgbValue;
	c.fillRect(x * this.graphics.TILE_SIZE.x, y * this.graphics.TILE_SIZE.y, width * this.graphics.TILE_SIZE.x, height * this.graphics.TILE_SIZE.y);

	this.spriteGrid.draw(c, this.position);

};

jzt.ui.Popup.prototype.redraw = function() {
	this.spriteGrid.clear();
	this.createBorder(this.spriteGrid);
};

jzt.ui.Popup.prototype.setColor = function(background, foreground, scrollbarBackground, scrollbarForeground) {
	this.background = background;
	this.foreground = foreground;
	this.scrollbarBackground = scrollbarBackground ? scrollbarBackground : background;
	this.scrollbarForeground = scrollbarForeground ? scrollbarForeground : foreground;
	this.redraw();
};

jzt.ui.Popup.prototype.setScrollBar = function(index, maximumIndex, visibleCount) {

	var barHeight = this.size.y - 4;
	var point = new jzt.Point(this.size.x - 2, 1);
	var thumbPosition;
	var thumbHeight = Math.max(1, Math.floor(barHeight * (visibleCount / maximumIndex)));
	thumbPosition = Math.round((barHeight - thumbHeight) * (index / (maximumIndex - visibleCount)));
	thumbPosition = Math.min(barHeight - thumbHeight - 1, thumbPosition);

	for(point.y = 1; point. y < this.size.y - 1; ++point.y) {

		// Draw the top arrow
		if(point.y === 1) {
			this.spriteGrid.setTile(point, 30, this.scrollbarForeground, this.scrollbarBackground);
		}

		// Draw the bottom arrow
		else if(point.y === this.size.y - 2) {
			this.spriteGrid.setTile(point, 31, this.scrollbarForeground, this.scrollbarBackground);
		}

		// Draw our position indicator
		else if(point.y - 2 >= thumbPosition && point.y - 2 <= thumbPosition + thumbHeight) {
			this.spriteGrid.setTile(point, 219, this.scrollbarForeground);
		}

		// Draw our shaded area
		else {
			this.spriteGrid.setTile(point, 177, this.scrollbarForeground, this.scrollbarBackground);
		}

	}

};

jzt.ui.Popup.prototype.createBorder = function(spriteGrid) {

	var point = new jzt.Point(0, 0);
	var width = this.size.x;
	var height = this.size.y;

	// Top Left Corner
	spriteGrid.setTile(new jzt.Point(0,0), 218, this.foreground);

	// Top Right Corner
	spriteGrid.setTile(new jzt.Point(width-1, 0), 191, this.foreground);

	// Top And Bottom
	for(point.x = 1; point.x < width-1; ++point.x) {
		point.y = 0;
		spriteGrid.setTile(point, 196, this.foreground);
		point.y = height-1;
		spriteGrid.setTile(point, 196, this.foreground);
	}

	// Sides
	for(point.y = 1; point.y < height-1; ++point.y) {
		point.x = 0;
		spriteGrid.setTile(point, 179, this.foreground);
		point.x = width-1;
		spriteGrid.setTile(point, 179, this.foreground);
	}

	// Bottom Left Corner
	spriteGrid.setTile(new jzt.Point(0, height-1), 192, this.foreground);

	// Bottom Right Corner
	spriteGrid.setTile(new jzt.Point(width-1, height-1), 217, this.foreground);

};

jzt.ui.Splash = function(game) {
	this.game = game;
	this.startTime = Date.now();
	this.done = false;
	this.animationFrame = undefined;
	this.popup = new jzt.ui.Popup(undefined, new jzt.Point(50, 20), game);
	this.popup.setColor(jzt.colors.Black);
	this.popup.spriteGrid.clear();
};

jzt.ui.Splash.prototype.update = function() {

	var time = Date.now() - this.startTime;

	if(time >= 7000) {
		this.done = true;
	}
	else if(time >= 5000) {
		this.setAnimationFrame(7);
	}
	else if(time >= 4000) {
		this.setAnimationFrame(6);
	}
	else if(time >= 2000) {
		this.setAnimationFrame(5);
	}
	else if(time >= 700) {
		this.setAnimationFrame(4);
	}
	else if(time >= 600) {
		this.setAnimationFrame(3);
	}
	else if(time >= 500) {
		this.setAnimationFrame(2);
	}
	else {
		this.setAnimationFrame(1);
	}

};

jzt.ui.Splash.prototype.setAnimationFrame = function(frame) {

	var grid = this.popup.spriteGrid;

	if(this.animationFrame !== frame) {

		if(frame === 1) {
			grid.addText(new jzt.Point(1,1), 'Mark x286 BIOS Version 2.1.16', jzt.colors.White);
			grid.addText(new jzt.Point(1,2), 'Copyright (c) 2014 Orangeline Interactive, Inc', jzt.colors.White);
		}
		else if(frame === 2) {
			grid.addText(new jzt.Point(1,4), 'Initializing ORNJtel(R) Boot Agent v1.4.14', jzt.colors.White);
			grid.addText(new jzt.Point(1,5), 'ORNJ Nostalgia Engine (v1.0.0) Loaded.', jzt.colors.White);
			this.game.resources.audio.play('i++c');
		}
		else if(frame === 3) {
			grid.addText(new jzt.Point(1,7), 'Starting ORNJ-DOS...', jzt.colors.White);
		}
		else if(frame === 4) {
			grid.addText(new jzt.Point(1,9), 'Running autoexec.bat', jzt.colors.White);
			grid.addText(new jzt.Point(1,10), 'C:\\>cd JZT', jzt.colors.White);
			grid.addText(new jzt.Point(1,11), 'C:\\JZT\\>jzt.exe', jzt.colors.White);
		}

		else if(frame === 5) {
			grid.clear();
			grid.addArt(new jzt.Point(7,3),
				' 0 0 0 0 0 0:3\n' +
				' 0 0 0 0 0 0│3\n' +
				' 0 0 0 0 0 0│B\n' +
				'-3 0─3─3─B─B┼F─B─B─3─3 0-3\n' +
				' 0 0 0 0 0 0│B 0▒C█C█C█C▒C░C 0▓C█C█C█C 0▓C█C█C█C▒C 0 0▄C\n' +
				' 0 0 0 0 0 0│3 0█C█C 0 0█C▒C 0█C█C░C 0 0█C█C▒C 0█C▌C\n' +
				' 0 0 0 0 0 0:3▐C█C█C 0▐C█C▒C 0█C█C 0 0░C█C█C 0 0█C 0█C▌C\n' +
				' 0 0 0 0 0 0 0 0▒C█C█C█C▒C░C▐C█C▌C 0 0░C█C▌C 0▐C█C 0█C▌C 0:8\n' +
				' 0 0 0 0 0 0 0 0▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C▄C█C▌C 0│7\n' +
				' 0 0 0 0 0 0 0 0 0▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C▀C 0─8─7┼F─7─8\n' +
				' 0 0 0 0☻F 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0│7\n' +
				' 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0:8'
			);
			grid.addText(new jzt.Point(13, 13), 'Orangeline Interactive', jzt.colors.BrightRed);
			grid.addText(new jzt.Point(13, 14), 'Presents...', jzt.colors.Red);

		}

		else if(frame === 6) {
			grid.clear();
			grid.addArt(new jzt.Point(6,5),
				' 0 0 0 0 0 0 0▄F▄F▀F▀F▀F▀F▀F█F▄F▄F▄F▀F▀F▀F▀F▀F▀F▄F F F▄F▄F▀F▀F▀F▀F▀F▀F▀F▄F\n' +
				' 0 0 0▄F▄F▀F▀F▄9▄9█9█9█9▀9▄F▀F▄9▄9▄9█9█9█9█9▓9 0█F▀F▀F▄9▄9█9█9█9█9█9▀9 0█F\n' +
				' 0 0█F 0▄9█9█9█9█9█9▓9 0▄F▀F█9█9▀9▀9▀9▀9 0█9▓9▓F 0█9█9█9▀9█9▓9▀9 0▄F▄F▀F▀F\n' +
				' 0 0█F▄F▀9▀9 0▄F 0█9▓9 0▓F▄F▄F▄F▓F█F▀F▄9█9▓9 0▓F 0▀9▀9 0 0█9▓9 0█F\n' +
				' 0 0 0 0▀F▀F▀F█F 0█9▓9 0█F 0 0█F▀F▄9█9█9▓9 0█F▀F▀F▀F▀F█F 0█9▓9 0▓F\n' +
				' 0▄F▀F▀F▄F 0 0█F 0█9▓9 0▓F▄F▀F 0█9█9▓9 0▄F█F▄F 0 0 0 0█F 0█9▓9 0▓F\n' +
				'█F 0█9█9 0▀F▀F▄9█9▓9▀9 0▓F█F 0█9▓9▀9 0▀F 0▄9▄9▀F▄F 0█F 0█9▓9▀9▄F▀F\n' +
				'▀F▄F 0█9█9█9█9▓9█9▀9▄F▀F█F 0█9█9█9█9█9█9█9▓9▓9 0▓F 0█F 0█9▓9 0▓F\n' +
				' 0 0▀F▄F▀9▀9▀9▀9▄F▀F 0▀F▄F▀9▀9▀9▀9▀9▀9▄F▄F▄F▄F▄F▀F F F▀F▄F▄F▄F▀F\n' +
				' 0 0 0 0▀F▀F▀F▀F F F F F F▀F▀F▀F▀F▀F▀F'
			);
		}

		else if(frame === 7) {
			grid.addText(new jzt.Point(8, 16), '(A Nostalgic DOS Game For The Web)', jzt.colors.BrightBlue);
			grid.addText(new jzt.Point(8, 17), 'Created by Mark McIntyre', jzt.colors.Cyan);
			grid.addText(new jzt.Point(13,19), '(c) 2014 Orangeline Interactive, Inc.', jzt.colors.Grey);
		}

		this.animationFrame = frame;

	}

};

jzt.ui.Splash.prototype.render = function(c) {
	this.popup.render(c);
};