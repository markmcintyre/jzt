/**
 * JZT Editor
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node: true */
/*global LZString */


'use strict';

var darkColors = ['0', '1', '2', '3', '4', '5', '6', '7'],
    allColorsNoBlack = ['9', 'A', 'B', 'C', 'D', 'E', 'F', '7', '1', '2', '3', '4', '5', '6', '8'],
    playerSprite,
    Point = require('./basic').Point,
    Graphics = require('./graphics').Graphics,
    i18n = require('./i18n').i18n,
    Colors = require('./graphics').Colors,
    things = require('./things').things,
    Direction = require('./basic').Direction,
    Board = require('./board').Board,
    serializeColor = require('./graphics').serialize;

/**
 * Editor represents a JZT game editor, capable of creating and testing JZT game worlds,
 * and providing definitions and UI elements to drive the editor.
 *
 * @param editorElement {object} - A DOM element representing the editor
 * @param configuration {object} - Configuration values.
 */
function Editor(editorElement, configuration) {

    var mockGame,
        me = this;

    this.formatVersion = '1.0.0';

    this.editorElement = editorElement;
    this.templateCustomizer = document.getElementById('template-customizer');

    this.addBoardCallback = configuration.addBoard;
    this.removeBoardCallback = configuration.removeBoard;
    this.changeBoardCallback = configuration.changeBoard;
    this.changeTemplateCallback = configuration.changeTemplate;
    this.changeModeCallback = configuration.changeMode;
    this.changeBoardOptionsCallback = configuration.changeBoardOptions;
    this.changeGameOptionsCallback = configuration.changeGameOptions;

    this.mode = Editor.Mode.DRAW;

    this.boards = [];
    this.cursor = new Point(0, 0);
    this.playerPosition = new Point(0, 0);

    /* We don't need a "real" game instance, since we're not actually
     * executing a playable instance, so we mock our game instead.
     */
    mockGame = {
        resources: {},
        isEditor: true,
        version: this.formatVersion,
        notifyListeners: function () {
            return;
        },
        context: {
            canvas: {
                width: 1,
                height: 1
            }
        }
    };

    this.game = mockGame;

    // Assign a Graphics instance to drive the rendering engine
    mockGame.resources.graphics = new Graphics(function () {
        me.newGame();
        playerSprite = me.graphics.getSprite(2);
    });

    // Let's keep a local copy for convenience, too.
    this.graphics = mockGame.resources.graphics;

    // The player isn't really an item on the board when editing, but rather just a concept of a position.
    this.playerPosition = new Point(0, 0);

    // Finally, we need to listen for keyboard presses
    window.addEventListener('keydown', this.onKeyDown.bind(this), false);

}

/**
 * Editor.Mode is an enumerated type representing a "mode" for drawing actions.
 */
Editor.Mode = {
    DRAW: 0,
    SELECT: 1,
    FILL: 2
};

/**
 * The Editor knows about several Things used by JZT, and defines their configurable properties.
 * This enumerated type structure defines these so that UI elements can be generated and used
 * to configure them.
 */
Editor.Thing = {

    Bear: {
        sensitivity: {type: 'number', min: 1, max: 10, defaultValue: 1, label: 'Sensitivity'}
    },

    Blinker: {
        direction: {type: 'direction', defaultValue: 'N', label: 'Direction'},
        period: {type: 'number', min: 1, max: 50, defaultValue: 3, label: 'Period'},
        delay: {type: 'number', min: 0, max: 50, defaultValue: 0, label: 'Delay'},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Bomb: {
        radius: {type: 'number', defaultValue: 4, min: 2, max: 20, label: 'Radius', advanced: true},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Boulder: {
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    BreakableWall: {
        color: {type: 'color', defaultValue: '0B', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Centipede: {
        head: {type: 'boolean', defaultValue: false, label: 'Head'},
        deviance: {type: 'number', min: 0, max: 10, defaultValue: 0, label: 'Deviance'},
        intelligence: {type: 'number', min: 0, max: 10, defaultValue: 0, label: 'Intelligence'},
        color: {type: 'color', defaultValue: '*9', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Conveyor: {
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'},
        clockwise: {type: 'boolean', defaultValue: true, label: 'Clockwise'}
    },



    Door: {
        color: {type: 'color', defaultValue: '1F', options: ['1', '2', '3', '4', '5', '6', '7'], foreground: false, label: 'Color'}
    },

    Duplicator: {
        copyDirection: {type: 'direction', defaultValue: 'E', label: 'Clone Direction'},
        speed: {type: 'number', min: 1, max: 10, defaultValue: 5, label: 'Speed'}
    },

    FakeWall: {
        color: {type: 'color', defaultValue: '0E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Gem: {
        color: {type: 'color', defaultValue: '0D', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    InvisibleWall: {
        color: {type: 'color', defaultValue: '0A', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Key: {
        color: {type: 'color', defaultValue: '*9', options: ['9', 'A', 'B', 'C', 'D', 'E', 'F'], foreground: true, label: 'Color'}
    },

    LineWall: {
        color: {type: 'color', defaultValue: '09', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Lion: {
        intelligence: {type: 'number', min: 1, max: 10, defaultValue: 3, label: 'Intelligence'}
    },

    Passage: {
        color: {type: 'color', defaultValue: '1F', options: ['1', '2', '3', '4', '5', '6', '7'], foreground: false, label: 'Color'},
        passageId: {type: 'text', defaultValue: 'Door 1', label: 'ID'},
        targetBoard: {type: 'board', label: 'Target Board'}
    },

    Pusher: {
        speed: {type: 'number', defaultValue: 3, min: '1', max: '10', label: 'Speed', advanced: true},
        orientation: {type: 'direction', defaultValue: 'S', label: 'Direction'},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    River: {
        direction: {type: 'direction', defaultValue: 'N', label: 'Direction'}
    },

    Ruffian: {
        intelligence: {type: 'number', defaultValue: 5, min: '1', max: '10', label: 'Intelligence'},
        restingTime: {type: 'number', defaultValue: 5, min: '1', max: '20', label: 'Resting time'}
    },

    Scriptable: {
        spriteIndex: {type: 'sprite', defaultValue: 1, label: 'Character'},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'},
        name: {type: 'text', defaultValue: 'Unknown', label: 'Name'},
        script: {type: 'script', label: 'Script'},
        speed: {type: 'number', min: 1, max: 10, defaultValue: 3, label: 'Speed'}
    },

    Signpost: {
        text: {type: 'text', label: 'Signpost Text'}
    },

    SliderEw: {
        color: {type: 'color', defaultValue: '*F', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    SliderNs: {
        color: {type: 'color', defaultValue: '*F', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Snake: {
        speed: {type: 'number', defaultValue: 3, min: 1, max: 10, label: 'Speed'}
    },

    SolidWall: {
        color: {type: 'color', defaultValue: '0E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Spider: {
        intelligence: {type: 'number', defaultValue: 5, min: 1, max: 5, label: 'Intelligence'},
        color: {type: 'color', defaultValue: '*C', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    SpinningGun: {
        intelligence: {type: 'number', defaultValue: 5, min: 1, max: 5, label: 'Intelligence'},
        firingRate: {type: 'number', defaultValue: 5, min: 1, max: 10, label: 'Firing rate'},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Teleporter: {
        orientation: {type: 'direction', defaultValue: 'E', label: 'Direction'},
        color: {type: 'color', defaultValue: '*E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    },

    Text: {
        color: {type: 'color', defaultValue: '0F', options: darkColors, foreground: false, label: 'Color'},
        text: {type: 'text', defaultValue: '', label: 'Text'}
    },

    Tiger: {
        intelligence: {type: 'number', min: 1, max: 10, defaultValue: 3, label: 'Intelligence'},
        firingRate: {type: 'number', min: 1, max: 20, defaultValue: 5, label: 'Firing rate'}
    },

    Wall: {
        color: {type: 'color', defaultValue: '0E', options: allColorsNoBlack, foreground: true, label: 'Color'}
    }

};

/**
 * Initializes this Editor's primary Board DOM element.
 *
 * @param board {object} - A DOM element to be initialized.
 */
Editor.prototype.initializeBoardElement = function (board) {

    // Remove the old canvas
    if (this.canvasElement) {
        this.editorElement.removeChild(this.canvasElement);
    }

    // Create a new canvas
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = 800;
    this.canvasElement.height = 640;

    // Add our canvas
    this.editorElement.appendChild(this.canvasElement);

    // Add our event listeners
    this.canvasElement.addEventListener('mousemove', this.onCanvasMouseMoved.bind(this), false);
    this.canvasElement.addEventListener('mousedown', this.onCanvasMouseDown.bind(this), false);
    this.canvasElement.addEventListener('mouseup', this.onCanvasMouseUp.bind(this), false);
    this.canvasElement.addEventListener('mousewheel', this.onCanvasScroll.bind(this), false);

    // Assign our context
    this.context = this.canvasElement.getContext('2d');
    this.game.context = this.context;
    this.context.imageSmoothingEnabled = false;
    this.context.webkitImageSmoothingEnabled = false;
    this.context.mozImageSmoothingEnabled = false;

    // Assign our focus
    this.focusPoint = new Point(board.defaultPlayerX, board.defaultPlayerY);
    this.cursor = this.focusPoint;

};

/**
 * Sets this Editor's cursor position to a provided point, ensuring that the
 * position is within the restricted range, and that "drawing mode" being enabled
 * will contine to plot tiles.
 */
Editor.prototype.setCursorPosition = function (point) {

    this.cursor = point;

    if (this.cursor.x < 0) {
        this.cursor.x = 0;
    }
    if (this.cursor.y < 0) {
        this.cursor.y = 0;
    }
    if (this.cursor.x >= this.currentBoard.width) {
        this.cursor.x = this.currentBoard.width - 1;
    }
    if (this.cursor.y >= this.currentBoard.height) {
        this.cursor.y = this.currentBoard.height - 1;
    }

    // If drawing mode is enabled, plot a tile immediately.
    if (this.drawing) {
        this.plot();
    }

    this.render(this.context);

};

/**
 * Toggles the existence of a Thing at the current cursor position.
 */
Editor.prototype.togglePlot = function () {

    var thing = this.currentBoard.getTile(this.cursor);

    if (thing) {
        this.currentBoard.addThing(this.cursor, undefined);
        this.render(this.context);
    } else {
        this.plot();
    }

};

/**
 * Plots a Thing, based on this Editor's active template, at this Editor's
 * current cursor position.
 */
Editor.prototype.plot = function () {

    var thing,
        index,
        c;

    // No need to plot the same tile twice
    if (!this.previousPlot || !this.previousPlot.equals(this.cursor)) {

        this.previousPlot = this.cursor;

        // If there is a template available...
        if (this.activeTemplate) {

            // Which template have we got?

            if (this.activeTemplate.type === 'Player') {

                // It's a player

                this.currentBoard.defaultPlayerX = this.cursor.x;
                this.currentBoard.defaultPlayerY = this.cursor.y;
                this.playerPosition.x = this.currentBoard.defaultPlayerX;
                this.playerPosition.y = this.currentBoard.defaultPlayerY;

            } else if (this.activeTemplate.type === 'Text') {

                // It's Text

                if (this.activeTemplate.text) {

                    // Output a text character for each character in the string
                    for (index = 0; index < this.activeTemplate.text.length; index += 1) {

                        c = this.activeTemplate.text.charAt(index);
                        c = this.graphics.convertSpecialCharacter(c);

                        thing = this.currentBoard.getTile(this.cursor);

                        /* If there's already a Text thing in our position, set it's character
                         * depending on the active language, and change its color if necessary.
                         * Otherwise, we can go ahead and add a brand new Text Thing.
                         */
                        if (thing && thing.type === 'Text') {
                            thing.i18n[i18n.getLanguage()] = c;
                            thing.foreground = Colors.deserializeForeground(this.activeTemplate.color);
                            thing.background = Colors.deserializeBackground(this.activeTemplate.color);
                        } else {
                            thing = {type: 'Text', i18n: {}, color: this.activeTemplate.color};
                            thing.i18n[i18n.getLanguage()] = c;
                            this.currentBoard.addThing(this.cursor, things.ThingFactory.deserialize(thing, this.currentBoard));
                        }
                        this.cursor = this.cursor.add(Direction.East);
                    }


                    this.cursor = this.previousPlot;

                }

            } else {

                // It's something else

                this.currentBoard.addThing(this.cursor, things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard));

            }


        } else {

            // No active template, means we should plot an empty space
            this.currentBoard.addThing(this.cursor, undefined);

        }

    }

    this.render(this.context);

};

/**
 * Creates a new game world.
 */
Editor.prototype.newGame = function () {
    this.deserialize({
        name: 'Untitled World',
        version: this.game.version,
        author: 'Anonymous',
        titleBoard: 'Untitled Board',
        startingBoard: 'Untitled Board',
        boards: [this.createBoard('Untitled Board', 50, 20)]
    });
};

/**
 * Moves this Editor's cursor in a given direction.
 */
Editor.prototype.moveCursor = function (direction) {

    var startX,
        endX;

    this.setCursorPosition(this.cursor.add(direction));

    if (this.currentBoard.isOutsideWindow(this.cursor)) {

        startX = this.currentBoard.windowOrigin.x;
        endX = startX + this.currentBoard.windowSize.x;

        if (this.cursor.x < startX || this.cursor.x >= endX) {
            this.focusPoint.x = this.cursor.x;
        } else {
            this.focusPoint.y = this.cursor.y;
        }

        this.render(this.context);

    }

};

/**
 * Sets this Editor's currently active board to a provided set of options.
 *
 * @param options {object} - A set of options to apply to the current board.
 */
Editor.prototype.setBoardOptions = function (options) {
    this.currentBoard.dark = options.dark;
    this.currentBoard.north = options.north !== '' ? options.north : undefined;
    this.currentBoard.south = options.south !== '' ? options.south : undefined;
    this.currentBoard.east = options.east !== '' ? options.east : undefined;
    this.currentBoard.west = options.west !== '' ? options.west : undefined;
    this.currentBoard.northOffset = options.northOffset !== '' ? options.northOffset : undefined;
    this.currentBoard.southOffset = options.southOffset !== '' ? options.southOffset : undefined;
    this.currentBoard.eastOffset = options.eastOffset !== '' ? options.eastOffset : undefined;
    this.currentBoard.westOffset = options.westOffset !== '' ? options.westOffset : undefined;
    this.currentBoard.reenter = options.reenter;
    this.currentBoard.maxPlayerBullets = options.maxPlayerBullets < 0 ? undefined : options.maxPlayerBullets;
    this.changeBoardOptionsCallback(options);
};

/**
 * Sets this Editor's current game world's options to a provided set.
 *
 * @param options {object} - A set of options to apply to this Editor's current game world.
 */
Editor.prototype.setGameOptions = function (options) {
    this.game.name = options.name;
    this.game.id = options.id;
    this.game.author = options.author;
    this.game.titleBoard = options.titleBoard;
    this.game.startingBoard = options.startingBoard;
    this.game.victoryBoard = options.victoryBoard;
    this.changeGameOptionsCallback(options);
};

/**
 * Generates a unique board name given a candidate name. This ensures that no
 * two boards have the same name when run through this generator.
 *
 * @param candidate {string} - A name to turn unique, if it's not already
 * @return {string} - A unique board name based on a given candidate
 */
Editor.prototype.getUniqueBoardName = function (candidate) {

    var index = 2,
        currentTry = candidate;

    while (this.getBoard(currentTry)) {
        currentTry = candidate + index;
        index += 1;
    }

    return currentTry;

};

/**
 * Generates a unique script name given a candidate name. This ensures that no two scripts
 * on this Editor's current board have the same name when run through this generator.
 *
 * @param candidate {string} - A name to turn unique, if it's not already
 * @return {string} - A unique script name based on a given candidate, for this Editor's current board.
 */
Editor.prototype.getUniqueScriptName = function (candidate) {

    var index = 2,
        currentTry = candidate;

    while (this.currentBoard.getScript(currentTry)) {
        currentTry = candidate + index;
        index += 1;
    }

    return currentTry;

};

/**
 * Retrieves a board from this Editor's current game world.
 *
 * @param boardName {string} - A name of a board to retrieve
 * @return {object} - A game board with a provided name.
 */
Editor.prototype.getBoard = function (boardName) {
    var index;

    for (index = 0; index < this.boards.length; index += 1) {
        if (this.boards[index].name === boardName) {
            return this.boards[index];
        }
    }

    return undefined;
};

/**
 * Switches this Editor's current board to a board with a provided name.
 *
 * @param boardName {string} - A name of a board to switch to
 */
Editor.prototype.switchBoard = function (boardName) {

    var board = this.getBoard(boardName),
        boardOptions;

    this.currentBoard = board;

    this.playerPosition.x = board.defaultPlayerX;
    this.playerPosition.y = board.defaultPlayerY;

    this.initializeBoardElement(board);

    this.currentBoard.initializeWindow();
    this.render(this.context);

    this.changeBoardCallback(boardName);
    boardOptions = {
        north: board.north,
        east: board.east,
        south: board.south,
        west: board.west,
        northOffset: board.northOffset,
        eastOffset: board.eastOffset,
        southOffset: board.southOffset,
        westOffset: board.westOffset,
        dark: board.dark,
        reenter: board.reenter
    };
    this.changeBoardOptionsCallback(boardOptions);

};

Editor.prototype.deserialize = function (data) {

    var index,
        board,
        options = {};

    if (!data.version || data.version !== this.formatVersion) {
        throw 'Incompatible version';
    }

    for (index = 0; index < this.boards.length; index += 1) {
        this.removeBoardCallback(this.boards[index].name);
    }



    this.boards = [];

    for (index = 0; index < data.boards.length; index += 1) {
        board = new Board(data.boards[index], this.game);
        this.boards.push(board);
        this.addBoardCallback(board.name);
    }


    options.name = data.name;
    options.id = data.id;
    options.author = data.author;
    options.titleBoard = data.titleBoard;
    options.startingBoard = data.startingBoard;
    options.victoryBoard = data.victoryBoard;

    this.setGameOptions(options);

    this.switchBoard(data.startingBoard);

};

Editor.prototype.serialize = function (playTest) {
    var result = {},
        index;
    result.name = this.game.name;
    result.version = this.game.version;
    result.id = this.game.id;
    result.titleBoard = this.game.titleBoard;
    result.startingBoard = playTest ? this.currentBoard.name : this.game.startingBoard;
    result.victoryBoard = this.game.victoryBoard;
    result.savedGame = true;
    result.author = this.game.author;
    result.boards = [];
    for (index = 0; index < this.boards.length; index += 1) {
        result.boards.push(this.boards[index].serialize());
    }
    return result;
};

Editor.prototype.setMode = function (mode) {
    this.mode = mode;
    this.changeModeCallback(mode);
};

Editor.prototype.removeBoard = function (boardName) {
    var index,
        found = -1;
    for (index = 0; index < this.boards.length; index += 1) {
        if (this.boards[index].name === boardName) {
            found = index;
            break;
        }
    }
    if (found >= 0) {
        this.boards.splice(found, 1);
        this.removeBoardCallback(boardName);

        if (this.boards.length > 0) {
            this.switchBoard(this.boards[0].name);
        }
    }

};

Editor.prototype.createBoard = function (boardName, width, height) {

    var template = {
            name: boardName,
            playerX: Math.floor(width / 2),
            playerY: Math.floor(height / 2),
            height: height,
            width: width,
            tiles: [],
            scripts: []
        },
        row,
        column;

    for (row = 0; row < height; row += 1) {
        for (column = 0; column < width; column += 1) {

            switch (row) {
            case 0:
            case height - 1:
                template.tiles[column + row * width] = {type: 'Wall'};
                break;
            default:
                if (column === 0 || column === width - 1) {
                    template.tiles[column + row * width] = {type: 'Wall'};
                } else {
                    template.tiles[column + row * width] = {};
                }
            }
        }
    }

    return template;

};

Editor.prototype.addBoard = function (boardName, width, height) {

    var newBoard,
        template = this.createBoard(boardName, width, height);

    newBoard = new Board(template, this.game);
    this.playerPosition.x = newBoard.defaultPlayerX;
    this.playerPosition.y = newBoard.defaultPlayerY;

    this.boards.push(newBoard);

    if (this.addBoardCallback) {
        this.addBoardCallback(newBoard.name);
    }

    this.switchBoard(newBoard.name);

};

Editor.prototype.getTemplateThing = function (template) {

    var thing;

    if (template && template.type) {

        for (thing in Editor.Thing) {
            if (Editor.Thing.hasOwnProperty(thing)) {

                if (thing === template.type) {
                    return Editor.Thing[thing];
                }

            }
        }

    }

};

Editor.prototype.createField = function (fieldName, field, template) {

    var label,
        element,
        me = this,
        index,
        sprite,
        elementTemplate,
        innerElement,
        color,
        nonStandard = false;

    function getFriendlyName(name) {
        switch (name) {
        case 'BrightBlue':
            return 'Bright Blue';
        case 'BrightGreen':
            return 'Bright Green';
        case 'BrightCyan':
            return 'Bright Cyan';
        case 'BrightRed':
            return 'Bright Red';
        case 'BrightMagenta':
            return 'Bright Magenta';
        case 'BrightWhite':
            return 'Bright White';
        case undefined:
            return 'Transparent';
        default:
            return name;
        }
    }

    function initializeSpritePosition(domElement) {

        var row, column, spriteIndex;

        spriteIndex = domElement.getAttribute('data-sprite-index');

        column = spriteIndex % 16;
        row = Math.floor(spriteIndex / 16);

        domElement.style.backgroundPosition = (column * -16) + 'px ' + (row * -32) + 'px';


    }

    function onSpriteClick(event) {
        var spriteIndex = event.target.getAttribute('data-sprite-index'),
            spriteFieldName = event.target.getAttribute('data-field-name'),
            mainElement = document.querySelector('.' + spriteFieldName + '-spritepicker'),
            spriteDisplay = mainElement.querySelector('button .sprite');

        template[spriteFieldName] = spriteIndex;
        spriteDisplay.setAttribute('data-sprite-index', spriteIndex);
        initializeSpritePosition(spriteDisplay);
        me.changeTemplateCallback(template);

    }

    label = document.createElement('label');
    label.innerHTML = field.label;

    if (field.type === 'number') {

        // Our field type is a number, so create a number input
        element = document.createElement('input');
        element.type = 'number';
        element.min = field.min;
        element.max = field.max;

    } else if (field.type === 'direction') {

        // Our field type is a direction, so create a direction selector
        element = document.createElement('select');
        element.options[element.options.length] = new Option('North', 'N');
        element.options[element.options.length] = new Option('East', 'E');
        element.options[element.options.length] = new Option('South', 'S');
        element.options[element.options.length] = new Option('West', 'W');

    } else if (field.type === 'boolean') {

        // Our field type is a boolean, so create a sliding toggle

        // Establish our template (based on Foundation framework's toggle markup)
        elementTemplate = '<input id="{{fieldId}}" type="checkbox"><label for="{{fieldId}}"></label>';
        elementTemplate = elementTemplate.replace(/\{\{fieldId\}\}/g, fieldName + '-checkbox');

        element = document.createElement('div');
        element.innerHTML = elementTemplate;
        element.classList.add('switch');
        nonStandard = true;
        innerElement = element.querySelector('#' + fieldName + '-checkbox');

        // Add an event listner to our checkbox...
        innerElement.addEventListener('click', function () {
            template[fieldName] = innerElement.checked;
            me.changeTemplateCallback(me.activeTemplate);
        }, false);

        // Set our default value for the element...
        if (template.hasOwnProperty(fieldName)) {
            innerElement.checked = template[fieldName];
        } else if (field.defaultValue) {
            innerElement.checked = field.defaultValue;
        }

    } else if (field.type === 'sprite') {

        // Our field type is a sprite

        // This is a non-standard form element, naturally
        nonStandard = true;

        elementTemplate = '<button class="large secondary button dropdown expand spritepicker" data-dropdown="{{fieldId}}" data-options="align: right"><div class="sprite"></div></button><div id="{{fieldId}}" data-dropdown-content class="f-dropdown medium content"><div class="sprites" /></div><input type="hidden">';
        elementTemplate = elementTemplate.replace(/\{\{fieldId\}\}/g, fieldName + '-spritepicker');

        element = document.createElement('div');
        element.className = fieldName + '-spritepicker';
        element.innerHTML = elementTemplate;

        innerElement = element.querySelector('.sprite');
        innerElement.style.margin = '0 0 0 1em';

        if (template.hasOwnProperty(fieldName)) {
            innerElement.setAttribute('data-sprite-index', template[fieldName]);
            initializeSpritePosition(innerElement);
        } else if (field.defaultValue) {
            innerElement.setAttribute('data-sprite-index', field.defaultValue);
            initializeSpritePosition(innerElement);
        }

        innerElement = element.querySelector('.sprites');

        for (index = 0; index < 256; index += 1) {

            sprite = document.createElement('div');
            sprite.className = 'sprite';
            sprite.setAttribute('data-sprite-index', index);
            sprite.setAttribute('data-field-name', fieldName);
            sprite.addEventListener('click', onSpriteClick, false);
            initializeSpritePosition(sprite);
            innerElement.appendChild(sprite);

        }

    } else if (field.type === 'color') {

        // Our field type is a color...
        element = document.createElement('select');
        for (index = 0; index < field.options.length; index += 1) {
            element.options[element.options.length] = new Option(getFriendlyName(Colors.getColor(field.options[index]).name), field.options[index]);
        }
        nonStandard = true;
        element.addEventListener('change', function () {
            var oldValue = template[fieldName],
                background,
                foreground;

            oldValue = oldValue || field.defaultValue ? field.defaultValue : '**';
            background = Colors.deserializeBackground(oldValue);
            foreground = Colors.deserializeForeground(oldValue);

            if (field.foreground) {
                template[fieldName] = serializeColor(background, Colors.getColor(element.value));
            } else {
                template[fieldName] = serializeColor(Colors.getColor(element.value), foreground);
            }

            me.changeTemplateCallback(me.activeTemplate);

        }, false);
        if (template.hasOwnProperty(fieldName)) {
            if (field.foreground) {
                color = Colors.deserializeForeground(template[fieldName]);
                element.value = color ? color.code : Colors.Yellow;
            } else {
                color = Colors.deserializeBackground(template[fieldName]);
                element.value = color ? color.code : Colors.Blue;
            }
        } else if (field.defaultValue) {
            if (field.foreground) {
                color = Colors.deserializeForeground(field.defaultValue);
                element.value = color ? color.code : Colors.Yellow;
            } else {
                color = Colors.deserializeBackground(field.defaultValue);
                element.value = color ? color.code : Colors.Blue;
            }
        }

    } else {

        // Our field type is anything else...
        element = document.createElement('input');
        element.type = 'text';

    }

    // If our element is available and it's standard behaviour...
    if (!nonStandard && element) {

        element.addEventListener('change', function () {
            template[fieldName] = element.value;
            me.changeTemplateCallback(me.activeTemplate);
        }, false);

        if (template.hasOwnProperty(fieldName)) {
            element.value = template[fieldName];
        } else if (field.defaultValue) {
            element.value = field.defaultValue;
        }

    }

    label.appendChild(element);

    if (field.advanced) {
        label.classList.add('advanced');
    }

    return label;


};

Editor.prototype.setActiveTemplate = function (template) {

    var thing,
        field;

    this.activeTemplate = template;
    this.templateCustomizer.innerHTML = '';

    thing = this.getTemplateThing(template);
    if (thing) {

        for (field in thing) {
            if (thing.hasOwnProperty(field)) {
                this.templateCustomizer.appendChild(this.createField(field, thing[field], template));
            }
        }

    }


    this.changeTemplateCallback(this.activeTemplate);
};

Editor.prototype.setTemplateForeground = function (foreground) {
    var background;
    if (!this.activeTemplate) {
        return;
    }
    if (this.activeTemplate.color) {
        background = Colors.deserializeBackground(this.activeTemplate.color);
        this.activeTemplate.color = serializeColor(background, foreground);
    } else {
        this.activeTemplate.color = serializeColor(Colors.Black, foreground);
    }
    this.changeTemplateCallback(this.activeTemplate);
};

Editor.prototype.setTemplateBackground = function (background) {
    var foreground;
    if (!this.activeTemplate) {
        return;
    }
    if (this.activeTemplate.color) {
        foreground = Colors.deserializeForeground(this.activeTemplate.color);
        this.activeTemplate.color = serializeColor(background, foreground);
    } else {
        this.activeTemplate.color = serializeColor(background, Colors.Yellow);
    }
    this.changeTemplateCallback(this.activeTemplate);
};

Editor.prototype.eventToBoardPoint = function (event) {

    var scaleX = this.canvasElement.width / this.canvasElement.offsetWidth,
        scaleY = this.canvasElement.height / this.canvasElement.offsetHeight,
        x = Math.floor((event.offsetX * scaleX) / this.game.resources.graphics.TILE_SIZE.x),
        y = Math.floor((event.offsetY * scaleY) / this.game.resources.graphics.TILE_SIZE.y);
    return new Point(x, y).add(this.currentBoard.windowOrigin);
};

Editor.prototype.onKeyDown = function (event) {

    var oldMode,
        activeElement = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';

    if (activeElement !== 'input' && activeElement !== 'textarea' && activeElement !== 'select' && activeElement !== 'button') {

        if (event.keyCode === 37) {
            this.moveCursor(Direction.West);
            event.preventDefault();
        } else if (event.keyCode === 38) {
            this.moveCursor(Direction.North);
            event.preventDefault();
        } else if (event.keyCode === 39) {
            this.moveCursor(Direction.East);
            event.preventDefault();
        } else if (event.keyCode === 40) {
            this.moveCursor(Direction.South);
            event.preventDefault();
        } else if (event.keyCode === 83) {
            this.setMode(Editor.Mode.SELECT);
            event.preventDefault();
        } else if (event.keyCode === 68) {
            this.setMode(Editor.Mode.DRAW);
            event.preventDefault();
        } else if (event.keyCode === 70) {
            this.setMode(Editor.Mode.FILL);
            event.preventDefault();
        } else if (event.keyCode === 32) {

            if (this.mode === Editor.Mode.DRAW) {
                this.togglePlot();
            } else {
                this.invokeTool();
            }
            event.preventDefault();

        } else if (event.keyCode === 13) {
            oldMode = this.mode;
            this.mode = Editor.Mode.SELECT;
            this.invokeTool();
            this.mode = oldMode;
            event.preventDefault();
        } else if (event.keyCode === 88) {
            oldMode = this.mode;
            this.mode = Editor.Mode.FILL;
            this.invokeTool();
            this.mode = oldMode;
            event.preventDefault();
        } else if (event.keyCode === 9) {

            this.drawing = !this.drawing;
            this.plot();
            event.preventDefault();
        }

    }

};

Editor.prototype.invokeTool = function () {

    var thing;

    if (this.mode === Editor.Mode.SELECT) {

        thing = this.currentBoard.getTile(this.cursor);
        if (thing) {
            this.setActiveTemplate(thing.serialize());
        } else {
            this.setActiveTemplate(undefined);
        }

    } else if (this.mode === Editor.Mode.FILL) {

        this.fill(this.cursor);

    }

    this.render(this.context);

};

Editor.prototype.onCanvasMouseDown = function (event) {

    if (this.mode === Editor.Mode.DRAW) {
        this.drawing = true;
        this.previousPlot = new Point(-1, -1);
    }

    this.setCursorPosition(this.eventToBoardPoint(event));

};

Editor.prototype.onCanvasMouseMoved = function (event) {

    this.setCursorPosition(this.eventToBoardPoint(event));
    document.activeElement.blur();

};

Editor.prototype.onCanvasMouseUp = function (event) {

    this.drawing = false;

    this.setCursorPosition(this.eventToBoardPoint(event));
    this.invokeTool();

};

Editor.prototype.onCanvasScroll = function (event) {

    var deltaX = Math.round(event.deltaX / 10),
        deltaY = Math.round(event.deltaY / 10);
    deltaX = deltaX > 2 ? 2 : deltaX < -2 ? -2 : deltaX;
    deltaY = deltaY > 2 ? 2 : deltaY < -2 ? -2 : deltaY;

    this.focusPoint = this.focusPoint.add(new Point(deltaX, deltaY));
    event.preventDefault();
    this.render(this.context);

};

Editor.prototype.fill = function (point) {

    var thing,
        targetDetails,
        me = this;

    function getDetails(thing) {

        var type,
            color;

        if (thing && thing.constructor && thing.constructor.type) {
            type = thing.constructor.type;
        }

        if (thing) {
            color = serializeColor(thing.foreground, thing.background);
        }

        return String(type) + String(color);

    }

    function fillNeighbour(point, targetDetails) {

        var details = getDetails(me.currentBoard.getTile(point));
        if (details === targetDetails) {
            me.fill(point);
        }

    }

    if (this.currentBoard.isOutside(point)) {
        return;
    }

    thing = this.currentBoard.getTile(point);
    targetDetails = getDetails(thing);

    // Don't fill if we're already the correct type
    if (getDetails(things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard)) === targetDetails) {
        return;
    }

    // If we have an active template, add our thing
    if (this.activeTemplate) {
        this.currentBoard.addThing(point, things.ThingFactory.deserialize(this.activeTemplate, this.currentBoard));
    } else {
        this.currentBoard.addThing(point, undefined);
    }

    fillNeighbour(point.add(Direction.North), targetDetails);
    fillNeighbour(point.add(Direction.East), targetDetails);
    fillNeighbour(point.add(Direction.South), targetDetails);
    fillNeighbour(point.add(Direction.West), targetDetails);

};

Editor.prototype.render = function (context) {

    // If we aren't fully loaded, don't render anything yet
    if (!this.currentBoard || !playerSprite) {
        return;
    }

    this.currentBoard.focusPoint = this.focusPoint;
    this.currentBoard.render(context);
    playerSprite.draw(context, this.playerPosition.subtract(this.currentBoard.windowOrigin), Colors.BrightWhite, Colors.Blue);
    this.drawCursor(context);
};

Editor.prototype.drawCursor = function (context) {

    var xSize = this.graphics.TILE_SIZE.x,
        ySize = this.graphics.TILE_SIZE.y,
        xPos = this.cursor.subtract(this.currentBoard.windowOrigin).x * this.graphics.TILE_SIZE.x,
        yPos = this.cursor.subtract(this.currentBoard.windowOrigin).y * this.graphics.TILE_SIZE.y;

    context.fillStyle = 'rgba(222, 222, 255, 0.25)';
    context.strokeStyle = '#DDDDFF';
    context.lineWidth = this.drawing ? 4 : 2;

    context.fillRect(xPos, yPos,  xSize, ySize);

    // If we're in drawing mode
    if (this.mode === Editor.Mode.DRAW) {
        context.strokeRect(xPos, yPos, xSize, ySize);
    } else if (this.mode === Editor.Mode.SELECT) {
        context.beginPath();
        context.moveTo(xPos + (xSize / 2), yPos);
        context.lineTo(xPos + (xSize / 2), yPos + ySize);
        context.moveTo(xPos, yPos + (ySize / 2));
        context.lineTo(xPos + xSize, yPos + (ySize / 2));
        context.stroke();
    }

    context.font = '9pt Arial';
    context.fillStyle = 'black';
    context.fillText('(' + (this.cursor.x + 1) + ', ' + (this.cursor.y + 1) + ')', 5, 15);
    context.fillStyle = 'white';
    context.fillText('(' + (this.cursor.x + 1) + ', ' + (this.cursor.y + 1) + ')', 4, 14);

};

exports.Editor = Editor;
