/**
 * JZT File Management
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jzt = jzt || {};

/**
 * FileManagement represents an interface used for saving and restoring saved games.
 *
 * @param owner a Game instance to own this FileManagement.
 */
 jzt.FileManagement = function(owner) {

 	this.game = owner;
 	this.dialogType = jzt.FileManagement.Type.SAVE;
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
};

jzt.FileManagement.Type = {
	SAVE: 1,
	OPEN: 2
}

jzt.FileManagement.prototype.open = function() {

	if(!this.files) {
		this.files = []
	}

	this.files = [
		{
			title: 'Village of JZT',
			board: 'Board 1',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 2',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 3',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 4',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 5',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 6',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	     {
			title: 'Village of JZT',
			board: 'Board 7',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 8',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },{
			title: 'Village of JZT',
			board: 'Board 1',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 2',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 3',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 4',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 5',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 6',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	     {
			title: 'Village of JZT',
			board: 'Board 7',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 8',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },{
			title: 'Village of JZT',
			board: 'Board 1',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 2',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 3',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 4',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 5',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 6',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	     {
			title: 'Village of JZT',
			board: 'Board 7',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 8',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },{
			title: 'Village of JZT',
			board: 'Board 1',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 2',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 3',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 4',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	    {
			title: 'Village of JZT',
			board: 'Board 5',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 6',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    },
	     {
			title: 'Village of JZT',
			board: 'Board 7',
			timestamp: 1388944186478,
			id: 'savegame00'
	    },
	    {
	    	title: 'Village of JZT',
	    	board: 'Board 8',
	    	timestamp: 1388944186478,
	    	id: 'savegame00'
	    }
	];

	if(this.files[0] !== undefined) {
		this.files.splice(0, 0, undefined);
	}

	this.initializeTitle();
	this.initializeSlots();

};

jzt.FileManagement.prototype.update = function() {

	var k = this.game.keyboard;

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

};

jzt.FileManagement.prototype.doTick = function() {

	var event = this.eventScheduler.takeEvent();

	if(event === jzt.Scroll.ScrollAction.Up) {
		if(--this.selectedIndex < 0) {
			this.selectedIndex = 0;
		}
		if(this.selectedIndex < this.offset) {
			this.offset = this.selectedIndex;
		}

		this.initializeSlots();
	}
	else if(event === jzt.Scroll.ScrollAction.Down) {
		if(++this.selectedIndex >= this.files.length - 1) {
			this.selectedIndex = this.files.length - 1;
		}
		if(this.selectedIndex >= (this.offset + this.visibleBoxCount)) {
			this.offset = this.selectedIndex - this.visibleBoxCount + 1;
		}
		this.initializeSlots();
	}
	else if(event === jzt.Scroll.ScrollAction.Exit) {
		this.game.setState(jzt.GameState.Playing);
	}


};

jzt.FileManagement.prototype.initializeTitle = function() {

	var message = ' ' + jzt.i18n.getMessage(this.dialogType === jzt.FileManagement.Type.SAVE ? 'file.save' : 'file.load') + ' ';
	var position = Math.round((this.width - message.length) / 2);

	this.spriteGrid.addText(new jzt.Point(position,0), message, jzt.colors.BrightWhite);

};

jzt.FileManagement.prototype.initializeSlots = function() {

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

jzt.FileManagement.prototype.render = function(context) {

	this.popup.render(context);

};