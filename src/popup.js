/**
 * JZT Popup
 * Copyright © 2013 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var Point = require('./basic').Point,
    SpriteGrid = require('./graphics').SpriteGrid,
    Colors = require('./graphics').Colors,
    meta = require('./metadata');

/**
 * Popup represents a pop-up box with a given position and size, capable of
 * holding sprite information.
 *
 * @param position a Point indicating an x, y coordinate for this popup
 * @param size a Point representing a width and height for this popup
 * @param game A Game instance to own this Popup
 */
function Popup(position, size, game) {

    if (position) {
        this.position = position;
    } else {

        this.position = new Point(0, 0);
        this.position.x = Math.floor((game.screenWidth - size.x) / 2);
        this.position.y = Math.floor((game.screenHeight - size.y) / 2);

    }

    this.size = size;
    this.game = game;
    this.graphics = game.resources.graphics;
    this.spriteGrid = new SpriteGrid(this.size.x, this.size.y, this.graphics);
    this.setColor(Colors.Blue, Colors.BrightWhite);

}

/**
 * Renders this Popup to a specified context.
 *
 * @param c A 2D context onto which to render this Popup.
 */
Popup.prototype.render = function (c) {

    var x = this.position.x,
        y = this.position.y,
        width = this.size.x,
        height = this.size.y;

    c.fillStyle = this.background.rgbValue;
    c.fillRect(x * this.graphics.TILE_SIZE.x, y * this.graphics.TILE_SIZE.y, width * this.graphics.TILE_SIZE.x, height * this.graphics.TILE_SIZE.y);

    this.spriteGrid.draw(c, this.position);

};

Popup.prototype.redraw = function () {
    this.spriteGrid.clear();
    this.createBorder(this.spriteGrid);
};

Popup.prototype.setColor = function (background, foreground, scrollbarBackground, scrollbarForeground) {
    this.background = background;
    this.foreground = foreground;
    this.scrollbarBackground = scrollbarBackground || background;
    this.scrollbarForeground = scrollbarForeground || foreground;
    this.redraw();
};

Popup.prototype.setScrollBar = function (index, maximumIndex, visibleCount) {

    var barHeight = this.size.y - 4,
        point = new Point(this.size.x - 2, 1),
        thumbPosition,
        thumbHeight = Math.max(1, Math.floor(barHeight * (visibleCount / maximumIndex)));
    thumbPosition = Math.round((barHeight - thumbHeight) * (index / (maximumIndex - visibleCount)));
    thumbPosition = Math.min(barHeight - thumbHeight - 1, thumbPosition);

    for (point.y = 1; point.y < this.size.y - 1; point.y += 1) {

        // Determine what to draw
        if (point.y === 1) {

            // Draw our top arrow
            this.spriteGrid.setTile(point, 30, this.scrollbarForeground, this.scrollbarBackground);

        } else if (point.y === this.size.y - 2) {

            // Draw our bottom arrow
            this.spriteGrid.setTile(point, 31, this.scrollbarForeground, this.scrollbarBackground);

        } else if (point.y - 2 >= thumbPosition && point.y - 2 <= thumbPosition + thumbHeight) {

            // Draw our position indicator
            this.spriteGrid.setTile(point, 219, this.scrollbarForeground);

        } else {

            // Draw our shaded area
            this.spriteGrid.setTile(point, 177, this.scrollbarForeground, this.scrollbarBackground);

        }

    }

};

Popup.prototype.createBorder = function (spriteGrid) {

    var point = new Point(0, 0),
        width = this.size.x,
        height = this.size.y;

    // Top Left Corner
    spriteGrid.setTile(new Point(0, 0), 218, this.foreground);

    // Top Right Corner
    spriteGrid.setTile(new Point(width - 1, 0), 191, this.foreground);

    // Top And Bottom
    for (point.x = 1; point.x < width - 1; point.x += 1) {
        point.y = 0;
        spriteGrid.setTile(point, 196, this.foreground);
        point.y = height - 1;
        spriteGrid.setTile(point, 196, this.foreground);
    }

    // Sides
    for (point.y = 1; point.y < height - 1; point.y += 1) {
        point.x = 0;
        spriteGrid.setTile(point, 179, this.foreground);
        point.x = width - 1;
        spriteGrid.setTile(point, 179, this.foreground);
    }

    // Bottom Left Corner
    spriteGrid.setTile(new Point(0, height - 1), 192, this.foreground);

    // Bottom Right Corner
    spriteGrid.setTile(new Point(width - 1, height - 1), 217, this.foreground);

};

function Animator() {
    this.startTime = Date.now();
    this.renderFunctions = [];
}

Animator.prototype.start = function (renderFunction) {
    renderFunction.frameTime = 0;
    this.renderFunctions.push(renderFunction);
    return this;
};

Animator.prototype.end = function (endTime) {
    this.then(endTime, function () { return undefined; });
};

Animator.prototype.update = function () {

    var time = Date.now() - this.startTime,
        renderFunction,
        index;

    for (index = this.renderFunctions.length - 1; index >= 0; index -= 1) {
        renderFunction = this.renderFunctions[index];
        if (time >= renderFunction.frameTime) {
            renderFunction();
            this.renderFunctions.splice(index, 1);
        }
    }

};

Animator.prototype.then = function (frameTime, renderFunction) {
    renderFunction.frameTime = frameTime;
    this.renderFunctions.push(renderFunction);
    return this;
};

Animator.prototype.isDone = function () {
    return this.renderFunctions.length <= 0;
};

function Splash(game) {

    var grid;

    this.game = game;
    this.animator = new Animator();
    this.done = false;
    this.animationFrame = undefined;
    this.popup = new Popup(undefined, new Point(50, 20), game);
    this.popup.setColor(Colors.Black);
    this.popup.spriteGrid.clear();

    grid = this.popup.spriteGrid;

    // Define our animation
    this.animator.start(function () {
        grid.addText(new Point(1, 1), '┌───┐', Colors.White);
        grid.addText(new Point(1, 2), '│ o┌┴──┐ Association of', Colors.White);
        grid.addText(new Point(1, 3), '└─┬┴──┐│ Shareware', Colors.White);
        grid.addText(new Point(1, 4), '  │ o ├┘ Unprofessionals', Colors.White);
        grid.addText(new Point(1, 5), '  └─┴─┘', Colors.White);
    }).then(300, function () {
        grid.addText(new Point(1, 7), 'x286 BIOS Version 2.1.16', Colors.White);
    }).then(400, function () {
        grid.addText(new Point(1, 9), 'Initializing Nostalgia Boot Agent v1.4.14', Colors.White);
        game.resources.audio.play('i++c');
    }).then(600, function () {
        grid.addText(new Point(1, 10), 'Nostalgia Boot Agent (v1.4.14) Loaded.', Colors.White);
    }).then(700, function () {
        grid.addText(new Point(1, 12), 'Starting Markrosoft DOS...', Colors.White);
    }).then(1200, function () {
        grid.addText(new Point(1, 14), 'Running autoexec.bat', Colors.White);
    }).then(1300, function () {
        grid.addText(new Point(1, 15), 'C:\\>cd JZT', Colors.White);
        grid.addText(new Point(1, 16), 'C:\\JZT\\>exe', Colors.White);
    }).then(2000, function () {
        grid.clear();
        grid.addArt(new Point(7, 5),
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
        grid.addText(new Point(46 - meta.version.length, 15), meta.version, Colors.Grey);
        grid.addText(new Point(13, 18), 'Created by Mark McIntyre', Colors.Grey);
        grid.addText(new Point(6, 19), '(c) ' + new Date(meta.date).getFullYear() + ' Mark McIntyre', Colors.Grey);
    }).end(4000);

}

Splash.prototype.update = function () {
    this.animator.update();
    this.done = this.animator.isDone();
};

Splash.prototype.render = function (c) {
    this.popup.render(c);
};

exports.Popup = Popup;
exports.Splash = Splash;
