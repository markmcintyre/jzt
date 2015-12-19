/**
 * JZT File Management
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */
/*global LZString */

'use strict';

/**
 * Action is an enumerated type representing a performable action for
 * this FileManagement.
 */
var ConstructorError = require('basic').ConstructorError,
    Point = require('basic').Point,
    DelayedEventScheduler = require('basic').DelayedEventScheduler,
    Popup = require('jzt-ux').Popup,
    colors = require('graphics').colors,
    i18n = require('i18n'),
    action = {
        Up: 0,
        Down: 1,
        Select: 2,
        Delete: 3,
        Exit: 4
    };

function getMetaName(timestamp) {
    return 'jzt-save-meta|' + (timestamp || '');
}

function getSaveName(timestamp) {
    return 'jzt-save|' + (timestamp || '');
}

/**
 * FileManagement represents an interface used for saving and restoring saved games.
 *
 * @param owner a Game instance to own this FileManagement.
 */
function FileManagement(owner) {

    if (!(this instanceof FileManagement)) {
        throw ConstructorError;
    }

    this.game = owner;
    this.dialogType = FileManagement.Type.SAVE;
    this.files = [];
    this.graphics = this.game.resources.graphics;
    this.cycleCount = 0;
    this.selectedIndex = 0;
    this.offset = 0;
    this.width = 48;
    this.height = Math.min(Math.floor(owner.context.canvas.height / this.graphics.TILE_SIZE.y) - 2, 24);
    this.boxWidth = this.width - 3;
    this.boxHeight = 5;
    this.visibleBoxCount = Math.floor((this.height - 2) / this.boxHeight);
    this.eventScheduler = new DelayedEventScheduler(this.game.CYCLE_TICKS * 2, this.game.CYCLE_TICKS);
    this.popup = new Popup(undefined, new Point(this.width, this.height), this.game);
    this.popup.setColor(colors.Blue, colors.BrightWhite, colors.Blue, colors.BrightBlue);
    this.spriteGrid = this.popup.spriteGrid;

}

FileManagement.Type = {
    SAVE: 1,
    OPEN: 2
};

FileManagement.prototype.setAlert = function (message) {

    // Cancel any keyboard events
    var k = this.game.keyboard;
    k.cancelInput();

    // Create our alert message
    this.alert = new Popup(undefined, new Point(message.length + 4, 3), this.game);
    this.alert.spriteGrid.addText(new Point(2, 1), message, colors.BrightWhite, colors.Blue);

};

FileManagement.prototype.clearAlert = function () {

    this.alert = undefined;

};

FileManagement.prototype.open = function (dialogType, noEmptySlot) {

    var saveGameMetaPrefix = getMetaName(),
        file,
        key;

    // If we're provided a dialog type, set it here
    if (dialogType) {
        this.dialogType = dialogType;
    }

    // Re-initialize our index and scrolling offset
    this.selectedIndex = 0;
    this.offset = 0;

    this.files = [];

    // For each of our stored items...
    for (key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {

            // If we found some saved game metadata...
            if (key.lastIndexOf(saveGameMetaPrefix, 0) === 0) {

                file = JSON.parse(localStorage[key]);

                // If it's the same game, add it to our list
                if (file.name === this.game.name) {
                    this.files.push(file);
                }

            }

        }
    }

    // Sort our saved games by time
    this.files.sort(function (a, b) {
        return b.timestamp - a.timestamp;
    });

    // Add an empty item as the first item
    if (!noEmptySlot) {
        this.files.unshift(null);
    }

    // Initalize our dialog title and sprite grid
    this.popup.redraw();
    this.initializeTitle();
    this.initializeSlots();

};

FileManagement.prototype.update = function () {

    var k = this.game.keyboard;

    // Depending on which key was pressed...
    if (k.isPressed(k.UP)) {

        // The up key was pressed, so scroll up
        this.eventScheduler.scheduleEvent(k.isPressed(k.UP), action.Up);

    } else if (k.isPressed(k.DOWN)) {

        // The down key was pressed, so scroll down
        this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), action.Down);

    } else if (k.isPressed(k.ENTER) || k.isPressed(k.SPACE)) {

        // The enter or space key was pressed, so select the active element
        this.eventScheduler.scheduleEvent(k.isPressed(k.ENTER), action.Select);

    } else if (k.isPressed(k.DELETE) || k.isPressed(k.BACKSPACE)) {

        // Delete or backspace was pressed, so delete the active element
        this.eventScheduler.scheduleEvent(k.isPressed(k.DELETE), action.Delete);

    } else if (k.isPressed(k.ESCAPE) || k.isPressed(k.S) || k.isPressed(k.R)) {

        // Escape or S or R was pressed, so close our screen
        this.eventScheduler.scheduleEvent(k.isPressed(k.ESCAPE), action.Exit);

    } else {
        this.eventScheduler.cancelEvent();
    }

    // Update the cycle and do a tick if necessary
    this.cycleCount += 1;
    if (this.cycleCount >= this.game.CYCLE_RATE) {
        this.cycleCount = 0;
        this.doTick();
    }

};

FileManagement.prototype.doTick = function () {

    var event = this.eventScheduler.takeEvent(),
        file;

    // If we're displaying an alert, select or exit dismisses it.
    if (this.alert && (event === action.Select || event === action.Exit)) {
        this.clearAlert();
        return;
    }

    // Determine the action taken
    if (event === action.Up) {

        // We're scrolling up
        this.selectedIndex -= 1;
        if (this.selectedIndex < 0) {
            this.selectedIndex = 0;
        }
        if (this.selectedIndex < this.offset) {
            this.offset = this.selectedIndex;
        }

        this.initializeSlots();

    } else if (event === action.Down) {

        // We're scrolling down
        this.selectedIndex += 1;
        if (this.selectedIndex >= this.files.length - 1) {
            this.selectedIndex = this.files.length - 1;
        }
        if (this.selectedIndex >= (this.offset + this.visibleBoxCount)) {
            this.offset = this.selectedIndex - this.visibleBoxCount + 1;
        }
        this.initializeSlots();

    } else if (event === action.Select) {

        // We're selecting an element

        if (this.dialogType === FileManagement.Type.SAVE) {

            // We are saving.
            // Grab our existing file (if applicable)
            file = this.files[this.selectedIndex];

            // If there is already a file, delete it first
            if (file) {
                this.deleteFile(file);
            }

            try {
                this.saveFile();
            } catch (exception) {
                this.setAlert(i18n.getMessage('status.nosave'));
                return;
            }

        } else if (this.dialogType === FileManagement.Type.OPEN) {

            // We are loading
            file = this.files[this.selectedIndex];
            this.loadFile(file);

        }

        // Go back to playing!
        this.game.restoreState();


    } else if (event === action.Delete) {

        // We're deleting a game

        file = this.files[this.selectedIndex];

        if (file) {
            this.deleteFile(file);
        }

    } else if (event === action.Exit) {

        // We're exiting
        this.game.restoreState();

    }


};

FileManagement.prototype.deleteFile = function (file) {

    var saveKey = getSaveName(file.timestamp),
        saveMetaKey = getMetaName(file.timestamp);

    // Delete the saved game
    if (localStorage.hasOwnProperty(saveKey)) {
        delete localStorage[saveKey];
    }

    // Delete the meta data
    if (localStorage.hasOwnProperty(saveMetaKey)) {
        delete localStorage[saveMetaKey];
    }

    this.open();

};

FileManagement.prototype.loadFile = function (file) {

    var data,
        saveKey;

    if (file) {
        saveKey = getSaveName(file.timestamp);

        // If our save ID exists...
        if (localStorage.hasOwnProperty(saveKey)) {

            // Grab our serialized game
            data = localStorage[saveKey];
            data = LZString.decompressFromUTF16(data);
            data = JSON.parse(data);

            this.game.deserialize(data);

        }

    } else {
        this.game.restartGame();
    }


};

FileManagement.prototype.saveFile = function () {

    var gameData,
        file = {
            name: this.game.name,
            board: this.game.currentBoard.name,
            timestamp: Date.now()
        },
        metaName = getMetaName(file.timestamp),
        saveName = getSaveName(file.timestamp);

    // Prepare the game data
    gameData = this.game.serialize();
    gameData = JSON.stringify(gameData);
    gameData = LZString.compressToUTF16(gameData);

    // Save to local storage
    localStorage[metaName] = JSON.stringify(file);
    localStorage[saveName] = gameData;

};

FileManagement.prototype.initializeTitle = function () {

    var message = ' ' + i18n.getMessage(this.dialogType === FileManagement.Type.SAVE ? 'file.save' : 'file.load') + ' ',
        position = Math.round((this.width - message.length) / 2);

    this.spriteGrid.addText(new Point(position, 0), message, colors.BrightWhite);

};

FileManagement.prototype.initializeSlots = function () {

    var index,
        me = this,
        boxesInView;

    function pad(value) {
        return value <= 9 ? '0' + value : value;
    }

    function formatDate(date) {
        var d = date.getDate(),
            m = date.getMonth() + 1,
            y = date.getFullYear(),
            hours = date.getHours(),
            minutes = date.getMinutes();
        return y + '-' + pad(m) + '-' + pad(d) + ' ' + hours + ':' + pad(minutes);
    }

    function initializeSlot(file, index, selected) {

        var point = new Point(0, 0),
            background = selected ? colors.White : colors.Cyan,
            boxPosition = index * me.boxHeight + 2,
            dateString,
            title;

        for (point.x = 2; point.x < me.boxWidth; point.x += 1) {
            for (point.y = boxPosition; point.y < boxPosition + me.boxHeight; point.y += 1) {

                // Determine which edge we're drawing
                if (point.x === me.boxWidth - 1 && point.y === boxPosition) {

                    // We're rendering the top shadow edge
                    me.spriteGrid.setTile(point, 220, colors.Black);

                } else if (point.x === me.boxWidth - 1 && point.y !== boxPosition + me.boxHeight - 1) {

                    // We're rendering the right shadow edge
                    me.spriteGrid.setTile(point, undefined, colors.BrightWhite, colors.Black);

                } else if (point.y === boxPosition + me.boxHeight - 1 && point.x !== 2) {

                    // We're rendering the bottom shadow edge
                    me.spriteGrid.setTile(point, 223, colors.Black);

                } else if (!(point.y === boxPosition + me.boxHeight - 1 && point.x === 2)) {

                    me.spriteGrid.setTile(point, undefined, colors.BrightWhite, background);

                }

            }
        }

        // Draw our game title
        point.x = 3;
        point.y = boxPosition + 1;

        // Determine what to draw
        if (file) {

            // We've got a file, so draw it
            title = file.name || i18n.getMessage('file.saved');
            me.spriteGrid.addText(point, title, selected ? colors.BrightWhite : colors.Grey, background);

        } else if (me.dialogType === FileManagement.Type.SAVE) {

            // There's no file, so it's an empty spot
            title = i18n.getMessage('file.new');
            point.x = Math.round((me.boxWidth - title.length) / 2);
            me.spriteGrid.addText(point, title, selected ? colors.BrightWhite : colors.Grey, background);

        } else {

            // There's no file and our dialog is not a save dialog, so
            // add an invitation to restart the game

            title = i18n.getMessage('file.restart');
            point.x = Math.round((me.boxWidth - title.length) / 2);
            me.spriteGrid.addText(point, title, selected ? colors.BrightWhite : colors.Grey, background);
            point.y += 1;
            point.x = Math.round((me.boxWidth - me.game.name.length) / 2);
            me.spriteGrid.addText(point, me.game.name, selected ? colors.BrightBlue : colors.Grey, background);

        }

        // Draw our timestamp
        if (file && file.timestamp) {
            dateString = formatDate(new Date(file.timestamp));
            point.x = me.boxWidth - dateString.length - 2;
            me.spriteGrid.addText(point, dateString, colors.Grey, background);
        }

        // Draw our current board name
        if (file && file.board) {
            point.x = 3;
            point.y += 1;
            me.spriteGrid.addText(point, file.board, selected ? colors.BrightBlue : colors.Grey, background);
        }

    }

    boxesInView = Math.min(this.visibleBoxCount, this.files.length);
    for (index = 0; index < boxesInView; index += 1) {
        initializeSlot(this.files[this.offset + index], index, index + this.offset === this.selectedIndex);
    }

    this.popup.setScrollBar(this.offset, this.files.length, boxesInView);

};

FileManagement.prototype.render = function (context) {

    if (this.alert) {
        this.alert.render(context);
    } else {
        this.popup.render(context);
    }

};

exports.FileManagement = FileManagement;
