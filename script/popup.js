/**
 * JZT Popup
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

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

	var screenWidth;
	var screenHeight;

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
	this.background = jzt.colors.Blue;
	this.graphics = game.resources.graphics;
	this.spriteGrid = new jzt.SpriteGrid(this.size.x, this.size.y, this.graphics);
	this.createBorder(this.spriteGrid);

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

	c.fillStyle = jzt.colors.Blue.rgbValue;
	c.fillRect(x * this.graphics.TILE_SIZE.x, y * this.graphics.TILE_SIZE.y, width * this.graphics.TILE_SIZE.x, height * this.graphics.TILE_SIZE.y);

	this.spriteGrid.draw(c, this.position);

};

jzt.ui.Popup.prototype.createBorder = function(spriteGrid) {

	var point = new jzt.Point(0, 0);
	var width = this.size.x;
	var height = this.size.y;

	// Top Left Corner
	spriteGrid.setTile(new jzt.Point(0,0), 218, jzt.colors.BrightWhite);

	// Top Right Corner
	spriteGrid.setTile(new jzt.Point(width-1, 0), 191, jzt.colors.BrightWhite);

	// Top And Bottom
	for(point.x = 1; point.x < width-1; ++point.x) {
		point.y = 0;
		spriteGrid.setTile(point, 196, jzt.colors.BrightWhite);
		point.y = height-1;
		spriteGrid.setTile(point, 196, jzt.colors.BrightWhite);
	}

	// Sides
	for(point.y = 1; point.y < height-1; ++point.y) {
		point.x = 0;
		spriteGrid.setTile(point, 179, jzt.colors.BrightWhite);
		point.x = width-1;
		spriteGrid.setTile(point, 179, jzt.colors.BrightWhite);
	}

	// Bottom Left Corner
	spriteGrid.setTile(new jzt.Point(0, height-1), 192, jzt.colors.BrightWhite);

	// Bottom Right Corner
	spriteGrid.setTile(new jzt.Point(width-1, height-1), 217, jzt.colors.BrightWhite);

};