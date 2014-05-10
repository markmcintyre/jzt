/**
 * JZT File Management
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

 /* global LZString */

var jzt = (function(my) {
    
    'use strict';
    
    var _saveIndex = 'saveIndex';
    
    /**
     * Action is an enumerated type representing a performable action for
     * this FileManagement.
     */
    var _action = {
        Up: 0,
        Down: 1,
        Select: 2,
        Delete: 3,
        Exit: 4
    };
    
    /**
     * FileManagement represents an interface used for saving and restoring saved games.
     *
     * @param owner a Game instance to own this FileManagement.
     */
    function FileManagement(owner) {
        
        if(!(this instanceof FileManagement)) {
            throw jzt.ConstructorError;
        }

        this.game = owner;
        this.dialogType = FileManagement.SAVE;
        this.files = [];
        this.graphics = this.game.resources.graphics;
        this.cycleCount = 0;
        this.selectedIndex = 0;
        this.offset = 0;
        this.width = 48;
        this.height = Math.min(Math.floor(owner.context.canvas.height / this.graphics.TILE_SIZE.y) - 2, 24);
        this.boxWidth = this.width - 3;
        this.boxHeight = 5;
        this.visibleBoxCount = Math.floor((this.height - 2)/ this.boxHeight);
        this.eventScheduler = new jzt.DelayedEventScheduler(this.game.CYCLE_TICKS * 2, this.game.CYCLE_TICKS);
        this.popup = new jzt.ui.Popup(undefined, new jzt.Point(this.width, this.height), this.game);
        this.popup.setColor(jzt.colors.Blue, jzt.colors.BrightWhite, jzt.colors.Blue, jzt.colors.BrightBlue);
        this.spriteGrid = this.popup.spriteGrid;
    }
    
    FileManagement.Type = {
        SAVE: 1,
        OPEN: 2
    };

    FileManagement.prototype.open = function(dialogType) {

        // If we're provided a dialog type, set it here
        if(dialogType) {
            this.dialogType = dialogType;
        }

        // Re-initialize our index and scrolling offset
        this.selectedIndex = 0;
        this.offset = 0;

        // Load our save index from local storage
        this.files = localStorage.saveIndex;

        // If we've got an index...
        if(this.files) {

            // Parse it and display the most recent first
            this.files = JSON.parse(this.files);
            this.files.reverse();

        }
        else {
            this.files = [];
        }

        // If we're saving...
        if(this.dialogType === FileManagement.SAVE) {

            // Make sure our first element is an empty save slot
            if(this.files.length <= 0 || this.files[0] !== undefined) {
                this.files.splice(0, 0, undefined);
            }


        }

        // Initalize our dialog title and sprite grid
        this.popup.redraw();
        this.initializeTitle();
        this.initializeSlots();

    };

    FileManagement.prototype.update = function() {

        var k = this.game.keyboard;

        // If the up key is pressed, scroll up one block
        if(k.isPressed(k.UP)) {
            this.eventScheduler.scheduleEvent(k.isPressed(k.UP), _action.Up);
        }

        // If the down key is pressed, scroll down one block
        else if(k.isPressed(k.DOWN)) {
            this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), _action.Down);
        }

        // If Enter is pressed...
        else if(k.isPressed(k.ENTER) || k.isPressed(k.SPACE)) {
            this.eventScheduler.scheduleEvent(k.isPressed(k.ENTER), _action.Select);
        }

        else if(k.isPressed(k.DELETE) || k.isPressed(k.BACKSPACE)) {
            this.eventScheduler.scheduleEvent(k.isPressed(k.DELETE), _action.Delete);
        }

        // If Escape was pressed, close the scroll
        else if(k.isPressed(k.ESCAPE)) {
            this.eventScheduler.scheduleEvent(k.isPressed(k.ESCAPE), _action.Exit);
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

    };

    FileManagement.prototype.doTick = function() {

        var event = this.eventScheduler.takeEvent();
        var file;

        // If we're scrolling up...
        if(event === _action.Up) {
            if(--this.selectedIndex < 0) {
                this.selectedIndex = 0;
            }
            if(this.selectedIndex < this.offset) {
                this.offset = this.selectedIndex;
            }

            this.initializeSlots();
        }

        // If we're scrolling down...
        else if(event === _action.Down) {
            if(++this.selectedIndex >= this.files.length - 1) {
                this.selectedIndex = this.files.length - 1;
            }
            if(this.selectedIndex >= (this.offset + this.visibleBoxCount)) {
                this.offset = this.selectedIndex - this.visibleBoxCount + 1;
            }
            this.initializeSlots();
        }

        // If we're selecting an element
        else if(event === _action.Select) {

            // If we are saving...
            if(this.dialogType === FileManagement.SAVE) {

                // Grab our existing file (if applicable)
                file = this.files[this.selectedIndex];

                // If there is already a file, use it's id
                if(file && file.id) {

                    // TODO: Confirm overwrite
                    this.saveFile(file.id, this.game);

                }

                // Otherwise create a new id
                else {
                    this.saveFile('save-' + Date.now(), this.game);
                }

            }

            // If we are opening...
            if(this.dialogType === FileManagement.OPEN) {

                file = this.files[this.selectedIndex];

                if(file && file.id) {
                    this.loadFile(file.id, this.game);
                }

            }

            // Go back to playing!
            this.game.setState(jzt.GameState.Playing);


        }

        // If we're deleting a game
        else if(event === _action.Delete) {

            file = this.files[this.selectedIndex];

            if(file && file.id) {
                this.deleteFile(file.id);
            }

        }

        // If we're exiting
        else if(event === _action.Exit) {
            this.game.setState(jzt.GameState.Playing);
        }


    };

    FileManagement.prototype.pruneIndex = function() {

        var index;
        var file;
        var saveId;
        var saveIndex;
        var changed = false;

        saveIndex = localStorage[_saveIndex];
        saveIndex = saveIndex ? JSON.parse(saveIndex) : [];

        // For each entry in the index...
        for(index = saveIndex.length - 1; index >= 0; --index) {

            // Grab our file and its id
            file = saveIndex[index];
            saveId = file.id;

            // If there is no corresponding or id, remove it from the index
            if(!saveId || !localStorage.hasOwnProperty(saveId)) {
                saveIndex.splice(index, 1);
                changed = true;
            }


        }

        // Recommit our index if there were changes
        if(changed) {
            localStorage[_saveIndex] = JSON.stringify(saveIndex);
        }

    };

    FileManagement.prototype.addToIndex = function(saveIndex, newFile) {

        var index;
        var file;

        // For each entry in the index...
        for(index = saveIndex.length - 1; index >= 0; --index) {

            // Grab our file
            file = saveIndex[index];

            // If the ID matches, remove the old copy
            if(file.id === newFile.id) {
                saveIndex.splice(index, 1);
            }

        }

        // Push our new file to the index 
        saveIndex.push(newFile);

    };

    FileManagement.prototype.deleteFile = function(saveId) {

        // If we have a game with the right ID, delete it...
        if(localStorage.hasOwnProperty(saveId)) {

            delete localStorage[saveId];
            this.pruneIndex();

            this.open();

        }


    };

    FileManagement.prototype.loadFile = function(saveId, game) {

        var data;

        // If our save ID exists...
        if(localStorage.hasOwnProperty(saveId)) {

            // Grab our serialized game
            data = localStorage[saveId];
            data = LZString.decompressFromUTF16(data);
            data = JSON.parse(data);

            game.deserialize(data);

        }


    };

    FileManagement.prototype.saveFile = function(saveId, game) {

        var saveIndex;
        var file;

        // Grab our index from local storage, if it exists
        saveIndex = localStorage[_saveIndex];
        saveIndex = saveIndex ? JSON.parse(saveIndex) : [];

        // Create a file entry for our index
        file = {
            title: this.game.name,
            board: this.game.currentBoard.name,
            timestamp: Date.now(),
            id: saveId
        };

        // Prepare the game data
        game = this.game.serialize();
        game = JSON.stringify(game);
        game = LZString.compressToUTF16(game);

        // Store our index entry
        this.addToIndex(saveIndex, file);

        // Save back to local storage
        localStorage[_saveIndex] = JSON.stringify(saveIndex);

        // Store our game
        localStorage[saveId] = game;


    };

    FileManagement.prototype.initializeTitle = function() {

        var message = ' ' + jzt.i18n.getMessage(this.dialogType === FileManagement.SAVE ? 'file.save' : 'file.load') + ' ';
        var position = Math.round((this.width - message.length) / 2);

        this.spriteGrid.addText(new jzt.Point(position,0), message, jzt.colors.BrightWhite);

    };

    FileManagement.prototype.initializeSlots = function() {

        var index;
        var me = this;
        var boxesInView;

        function formatDate(date) {
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d) + ' ' + hours + ':' + minutes;
        }

        function initializeSlot(file, index, selected) {

            var point = new jzt.Point(0,0);
            var background = selected ? jzt.colors.White : jzt.colors.Cyan;
            var boxPosition = index * me.boxHeight + 2;
            var dateString;
            var title;

            for(point.x = 2; point.x < me.boxWidth; ++point.x) {
                for(point.y = boxPosition; point.y < boxPosition + me.boxHeight; ++point.y) {

                    // If we're rendering the top shadow edge
                    if(point.x === me.boxWidth - 1 && point.y === boxPosition) {
                        me.spriteGrid.setTile(point, 220, jzt.colors.Black);
                    }

                    // If we're rendering the right shadow edge
                    else if(point.x === me.boxWidth - 1 && point.y !== boxPosition + me.boxHeight - 1) {
                        me.spriteGrid.setTile(point, undefined, jzt.colors.BrightWhite, jzt.colors.Black);
                    }

                    // If we're rendering the bottom shadow edge
                    else if(point.y === boxPosition + me.boxHeight - 1 && point.x === 2) {
                        continue;
                    }

                    // If we're rendering the bottom shadow edge
                    else if(point.y === boxPosition + me.boxHeight - 1 && point.x !== 2) {
                        me.spriteGrid.setTile(point, 223, jzt.colors.Black);
                    }

                    else {
                        me.spriteGrid.setTile(point, undefined, jzt.colors.BrightWhite, background);
                    }

                }
            }

            // Draw our game title
            point.x = 3;
            point.y = boxPosition + 1;
            if(file) {
                title = file.title ? file.title : jzt.i18n.getMessage('file.saved');
                me.spriteGrid.addText(point, title, selected ? jzt.colors.BrightWhite : jzt.colors.Grey, background);
            }
            else {
                title = jzt.i18n.getMessage('file.new');
                point.x = Math.round((me.boxWidth - title.length) / 2);
                me.spriteGrid.addText(point, title, selected ? jzt.colors.BrightWhite : jzt.colors.Grey, background);
            }

            // Draw our timestamp
            if(file && file.timestamp) {
                dateString = formatDate(new Date(file.timestamp));
                point.x = me.boxWidth - dateString.length - 2;
                me.spriteGrid.addText(point, dateString, selected ? jzt.colors.Grey : jzt.colors.Grey, background);
            }

            // Draw our current board name
            if(file && file.board) {
                point.x = 3;
                point.y++;
                me.spriteGrid.addText(point, file.board, selected ? jzt.colors.BrightBlue : jzt.colors.Grey, background);
            }

        }

        boxesInView = Math.min(this.visibleBoxCount, this.files.length);
        for(index = 0; index < boxesInView; ++index) {
            initializeSlot(this.files[this.offset + index], index, index + this.offset === this.selectedIndex);
        }

        this.popup.setScrollBar(this.offset, this.files.length, boxesInView);

    };

    FileManagement.prototype.render = function(context) {

        this.popup.render(context);

    };
    
    my.FileManagement = FileManagement;
    return my;
    
}(jzt || {}));