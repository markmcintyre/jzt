/*jslint node: true, browser:true */
/*global FileReader, Blob, Uint8Array, alert */

'use strict';

var JztScript = require('../jzt-script').JztScript,
    JztScriptParser = require('../jzt-script-parser').JztScriptParser,
    SpiderWeb = require('../things').things.SpiderWeb,
    Audio = require('../audio').Audio,
    Editor = require('../editor').Editor,
    LZString = require('lz-string'),
    CodeMirror = require('codemirror'),
    boardNameInput,
    boardSelector,
    northSelector,
    eastSelector,
    southSelector,
    westSelector,
    northOffsetSelector,
    eastOffsetSelector,
    southOffsetSelector,
    westOffsetSelector,
    darkSelector,
    maxPlayerBulletSelector,
    reenterSelector,
    templateEditor,
    scriptSelector,
    scriptEditor,
    editArea,
    itemSelector,
    gameName,
    authorName,
    startingBoardSelector,
    titleBoardSelector,
    victoryBoardSelector,
    scriptWarning,
    modeSelector,
    playButton,
    editor,
    oldLine = 1,
    templates,
    scriptTab,
    newBoardDialog,
    mainNavigation,
    foundation,
    downloadUrl,
    parser;

require('codemirror/addon/mode/simple');

/**
 * Validates a current script and displays or hides a warning as appropriate.
 */
function validateScript() {

    try {
        parser.parse(scriptEditor.getValue());
        scriptWarning.innerHTML = '';
        scriptWarning.style.display = 'none';
    } catch (exception) {
        scriptWarning.innerHTML = '<span class="warning-icon">⚠</span> ' + exception;
        scriptWarning.style.display = 'block';
    }

    return CodeMirror.Pass;

}

/**
 * Selects a script with a provided name
 *
 * @param scriptName {string} - A script name to be selected
 */
function selectScript(scriptName) {

    var script = editor.currentBoard.getScript(scriptName);

    if (script) {
        scriptTab.classList.remove('noscript');
        scriptEditor.setValue(script.rawScript || script.script || '');
    } else {
        scriptEditor.setValue('');
        scriptTab.classList.add('noscript');
    }

    // If our active template is for a Scriptable, update the UI
    if (editor.activeTemplate && editor.activeTemplate.type === 'Scriptable') {
        editor.setActiveTemplate(editor.activeTemplate);
    }

    validateScript();

}

/**
 * Initializes a board options dialog
 *
 * @param dialog {object} - A dialog DOM element
 */
function initializeBoardOptionsDialog(dialog) {

    /**
     * An event handler to be invoked when board options have changed
     */
    function onChange() {
        editor.setBoardOptions({
            name: boardNameInput.value,
            north: northSelector.value,
            east: eastSelector.value,
            south: southSelector.value,
            west: westSelector.value,
            northOffset: parseInt(northOffsetSelector.value, 10),
            eastOffset: parseInt(eastOffsetSelector.value, 10),
            southOffset: parseInt(southOffsetSelector.value, 10),
            westOffset: parseInt(westOffsetSelector.value, 10),
            dark: darkSelector.checked,
            maxPlayerBullets: parseInt(maxPlayerBulletSelector.value, 10),
            reenter: reenterSelector.checked
        });
    }

    boardNameInput = dialog.querySelector('[data-id="board-name"]');
    northSelector = dialog.querySelector('[data-id="north"]');
    eastSelector = dialog.querySelector('[data-id="east"]');
    southSelector = dialog.querySelector('[data-id="south"]');
    westSelector = dialog.querySelector('[data-id="west"]');
    northOffsetSelector = dialog.querySelector('[data-id="north-offset"]');
    eastOffsetSelector = dialog.querySelector('[data-id="east-offset"]');
    southOffsetSelector = dialog.querySelector('[data-id="south-offset"]');
    westOffsetSelector = dialog.querySelector('[data-id="west-offset"]');
    darkSelector = dialog.querySelector('[data-id="dark"]');
    reenterSelector = dialog.querySelector('[data-id="reenter"]');
    maxPlayerBulletSelector = dialog.querySelector('[data-id="max-player-bullets"]');

    boardNameInput.addEventListener('change', onChange, false);
    northSelector.addEventListener('change', onChange, false);
    eastSelector.addEventListener('change', onChange, false);
    southSelector.addEventListener('change', onChange, false);
    westSelector.addEventListener('change', onChange, false);
    northOffsetSelector.addEventListener('change', onChange, false);
    eastOffsetSelector.addEventListener('change', onChange, false);
    southOffsetSelector.addEventListener('change', onChange, false);
    westOffsetSelector.addEventListener('change', onChange, false);
    darkSelector.addEventListener('click', onChange, false);
    reenterSelector.addEventListener('click', onChange, false);
    maxPlayerBulletSelector.addEventListener('change', onChange, false);

}

/**
 * Initializes a world options dialog
 *
 * @param dialog {object} - A dialog DOM element
 */
function initializeWorldOptionsDialog(dialog) {

    /**
     * An event handler to be invoked when board options have changed
     */
    function onChange() {
        editor.setGameOptions({
            name: gameName.value,
            author: authorName.value,
            titleBoard: titleBoardSelector.value,
            startingBoard: startingBoardSelector.value,
            victoryBoard: victoryBoardSelector.value
        });
    }

    gameName = dialog.querySelector('[data-id="title"]');
    authorName = dialog.querySelector('[data-id="author"]');
    titleBoardSelector = dialog.querySelector('[data-id="title-board"]');
    startingBoardSelector = dialog.querySelector('[data-id="starting-board"]');
    victoryBoardSelector = dialog.querySelector('[data-id="victory-board"]');

    gameName.addEventListener('change', onChange, false);
    authorName.addEventListener('change', onChange, false);
    titleBoardSelector.addEventListener('change', onChange, false);
    startingBoardSelector.addEventListener('change', onChange, false);
    victoryBoardSelector.addEventListener('change', onChange, false);

}

/**
 * Initializes an open dialog
 *
 * @param dialog {object} - A dialog DOM element
 */
function initializeOpenDialog(dialog) {

    var openInput = dialog.querySelector('[data-id="open"]');

    openInput.addEventListener('change', function () {

        var fileReader,
            file;

        if (event.target.files && event.target.files[0]) {

            file = event.target.files[0];
            fileReader = new FileReader();

            fileReader.onload = function () {

                var json,
                    data;

                if (file.type === 'application/json') {
                    json = fileReader.result;
                } else {
                    data = fileReader.result.split(',')[1];
                    try {
                        json = LZString.decompressFromBase64(data);
                    } catch (decodeException) {
                        alert('Couldn\'t read game world.\n' + decodeException);
                    }
                }

                if (json) {

                    try {
                        editor.deserialize(JSON.parse(json));
                        openInput.value = '';
                    } catch (exception) {
                        alert(exception);
                    }

                }

            };

            if (file.type === 'application/json') {
                fileReader.readAsText(file);
            } else {
                fileReader.readAsDataURL(file);
            }

        }

        event.preventDefault();

    }, false);

}

/**
 * Initializes a new script dialog
 *
 * @param {object} dialog - A dialog DOM element
 */
function initializeNewScriptDialog(dialog) {

    dialog.querySelector('[data-id="ok"]').addEventListener('click', function () {

        var script,
            scriptElement = dialog.querySelector('[data-id="script-name"]'),
            newName = scriptElement.value;

        if (newName) {
            newName = editor.getUniqueScriptName(newName);
            script = new JztScript(newName);
            editor.currentBoard.scripts.push(script);
            scriptSelector.options[scriptSelector.options.length] = new Option(newName);
            scriptSelector.value = newName;
            selectScript(newName);
        }

        // Reset the value
        scriptElement.value = '';

    }, false);

}

function initializeConfirmDeleteBoardDialog(dialog) {

    dialog.querySelector('[data-id="delete-button"]').addEventListener('click', function () {
        editor.removeBoard(editor.currentBoard.name);
    });

}

function initializeMusicDialog(dialog) {

    var noteItems = dialog.querySelectorAll('[data-note]'),
        playItems = dialog.querySelectorAll('[data-id="play"]'),
        index,
        audio = new Audio();

    function playNoteItem(event) {
        var note = event.target.getAttribute('data-note');
        audio.play(note);
    }

    function playScore(event) {
        var scoreId = event.target.getAttribute('data-score'),
            score = dialog.querySelector('[data-id="' + scoreId + '"]').value;
        audio.play(score);
    }

    for (index = 0; index < playItems.length; index += 1) {
        playItems[index].addEventListener('click', playScore);
    }

    for (index = 0; index < noteItems.length; index += 1) {
        noteItems[index].addEventListener('click', playNoteItem);
    }

}

/**
 * Initializes a script options dialog
 *
 * @param dialog {object} - A dialog DOM element
 */
function initializeScriptTab(tab) {

    scriptTab = tab;
    scriptSelector = tab.querySelector('[data-id="selector"]');

    scriptEditor = CodeMirror.fromTextArea(tab.querySelector('[data-id="editor"]'), {
        mode: 'jztscript',
        theme: 'jzt',
        lineNumbers: true,
        lineWrapping: true
    });

    scriptWarning = tab.querySelector('[data-id="warning"]');

    // Delete Script Button
    tab.querySelector('[data-id="delete"]').addEventListener('click', function () {

        var index,
            scriptName = scriptSelector.value;

        for (index = 0; index < editor.currentBoard.scripts.length; index += 1) {
            if (editor.currentBoard.scripts[index].name === scriptName) {
                editor.currentBoard.scripts.splice(index, 1);
            }
        }

        scriptSelector.remove(scriptSelector.selectedIndex);

        selectScript(scriptSelector.value);

    }, false);

    // Script Editor
    scriptEditor.on('blur', function () {

        var script = editor.currentBoard.getScript(scriptSelector.value),
            rawScript = scriptEditor.getValue().trim();

        validateScript();
        script.rawScript = rawScript === '' ? undefined : rawScript;

    });

    scriptEditor.on('cursorActivity', function () {
        if (scriptEditor.getCursor().line !== oldLine) {
            validateScript();
        }
        oldLine = scriptEditor.getCursor().line;
    });

    scriptSelector.addEventListener('change', function (event) {
        selectScript(event.target.value);
        validateScript();
    }, false);

}

/**
 * Initializes the new board dialog
 *
 * @param dialog {object} - A dialog that allows the creation of a new board
 */
function initializeNewBoardDialog(dialog) {

    newBoardDialog = dialog;

    dialog.querySelector('[data-id="ok"]').addEventListener('click', function () {

        var name = dialog.querySelector('[data-id="name"]').value,
            width = parseInt(dialog.querySelector('[data-id="width"]').value, 10),
            height = parseInt(dialog.querySelector('[data-id="height"]').value, 10);

        if (name && width && height) {
            name = editor.getUniqueBoardName(name);
            try {
                editor.addBoard(name, width, height);
            } catch (ex) {
                alert(ex);
            }
        }

    });

}

/**
 * Initializes the primary UI options
 *
 * @param options {object} - DOM elements used for user interaction
 */
function initializePrimaryUi(options) {

    var index,
        children;

    function onToolChange(event) {

        var toolType = event.target.value,
            activeTemplate;

        if (toolType) {

            if (templates.hasOwnProperty(toolType)) {
                activeTemplate = templates[toolType];
            } else {
                activeTemplate = {type: toolType};
                switch (toolType) {
                case 'Passage':
                    activeTemplate.passageId = 1;
                    activeTemplate.targetBoard = editor.boards[0].name;
                    break;
                case 'Spider':
                    activeTemplate.under = new SpiderWeb().serialize();
                    break;
                case 'Scriptable':
                    activeTemplate.script = 'Untitled Script';
                    break;
                case 'River':
                    activeTemplate.direction = 'N';
                    break;
                }
                templates[toolType] = activeTemplate;
            }

            editor.setActiveTemplate(activeTemplate);


        } else {
            editor.setActiveTemplate(undefined);
        }

    }

    function onModeChange(event) {

        var mode = event.target.getAttribute('data-mode');

        switch (mode) {
        case 'draw':
            editor.setMode(Editor.Mode.DRAW);
            break;
        case 'select':
            editor.setMode(Editor.Mode.SELECT);
            break;
        case 'fill':
            editor.setMode(Editor.Mode.FILL);
            break;
        }

        event.preventDefault();

    }

    function onNoActionClick(event) {
        event.preventDefault();
    }

    mainNavigation = options.mainNavigation;
    modeSelector = options.modeSelector;
    playButton = options.playButton;
    boardSelector = options.boardSelector;
    templateEditor = options.templateEditor;
    itemSelector = options.itemSelector;

    // Board Selector
    boardSelector.addEventListener('change', function () {
        editor.switchBoard(event.target.value);
    }, false);

    children = modeSelector.querySelectorAll('[data-mode]');
    for (index = 0; index < children.length; index += 1) {
        children[index].addEventListener('click', onModeChange, false);
    }

    // Template Editor
    templateEditor.addEventListener('blur', function () {
        if (templateEditor.value !== '') {
            editor.setActiveTemplate(JSON.parse(templateEditor.value));
        }
    }, false);

    // New
    mainNavigation.querySelector('[data-menu-item="new"]').addEventListener('click', function () {
        if (window.confirm('Are you sure you want to start a new game world?')) {
            editor.newGame();
        }
    }, false);

    // Download
    mainNavigation.querySelector('[data-menu-item="download"]').addEventListener('click', function (event) {

        /*jslint regexp: true */

        var game = editor.serialize(),
            link,
            compressedGame = LZString.compressToUint8Array(JSON.stringify(game));

        // Revoke our old URL, if applicable
        if (downloadUrl) {
            window.URL.revokeObjectURL(downloadUrl);
        }

        // Create our new URL
        downloadUrl = window.URL.createObjectURL(new Blob([compressedGame], {type: 'application/octet-stream'}));

        event.target.download = game.name.replace(/[^a-z0-9_\-]/gi, '-').toLowerCase() + '.jzt';
        event.target.href = downloadUrl;

    }, false);

    // Download as JSON
    mainNavigation.querySelector('[data-menu-item="downloadjson"]').addEventListener('click', function (event) {

        /*jslint regexp: true */

        var game = editor.serialize(),
            json = JSON.stringify(game),
            link;

        // Revoke our old URL, if applicable
        if (downloadUrl) {
            window.URL.revokeObjectURL(downloadUrl);
        }

        // Create our new URL
        downloadUrl = window.URL.createObjectURL(new Blob([json], {type: 'application/json'}));

        event.target.download = game.name.replace(/[^a-z0-9_\-]/gi, '-').toLowerCase() + '.json';
        event.target.href = downloadUrl;

    }, false);

    // New Board
    mainNavigation.querySelector('[data-menu-item="new-board"]').addEventListener('click', function () {

        newBoardDialog.querySelector('[data-id="name"]').value = 'Untitled Board';
        newBoardDialog.querySelector('[data-id="width"]').value = '50';
        newBoardDialog.querySelector('[data-id="height"]').value = '20';

        event.preventDefault();

    }, false);

    itemSelector.addEventListener('change', onToolChange, false);

    children = document.querySelectorAll('[data-noaction]');
    for (index = 0; index < children.length; index += 1) {
        children[index].addEventListener('click', onNoActionClick, false);
    }

    options.foundation.on('change.zf.tabs', function () {
        scriptEditor.refresh();
    });

    playButton.addEventListener('click', function (event) {

        window.open(event.target.href, 'jzt-play-test');
        event.preventDefault();

    }, false);

}

/**
 * An event handler when game options have changed
 *
 * @param options {object} - Game options that have changed
 */
function onGameOptionsChanged(options) {

    gameName.value = options.name;
    authorName.value = options.author;
    titleBoardSelector.value = options.titleBoard || '';
    startingBoardSelector.value = options.startingBoard;
    victoryBoardSelector.value = options.victoryBoard || '';

}

/**
 * An event handler to be invoked when our collection of boards has changed.
 *
 */
function onBoardsChanged() {

    function initializeSelector(selector, addNone) {

        // First remove old items
        while (selector.options.length > 0) {
            selector.remove(0);
        }

        // If we need a 'None' option, add it now
        if (addNone) {
            selector.options[0] = new Option('None', '');
        }

        // Add board names
        editor.boards.forEach(function (board) {
            selector.options[selector.options.length] = new Option(board.name, board.name);
        });

    }

    initializeSelector(boardSelector);
    initializeSelector(northSelector, true);
    initializeSelector(eastSelector, true);
    initializeSelector(southSelector, true);
    initializeSelector(westSelector, true);
    initializeSelector(titleBoardSelector, true);
    initializeSelector(startingBoardSelector);
    initializeSelector(victoryBoardSelector, true);

    // If our active template is for a passage, update the UI
    if (editor.activeTemplate && editor.activeTemplate.type === 'Passage') {
        editor.setActiveTemplate(editor.activeTemplate);
    }

    // Update our world options
    onGameOptionsChanged(editor.game);

}

/**
 * An event handler to be invoked when a board has changed.
 *
 * @param boardName {string} - A name of a board that's been changed.
 */
function onBoardChanged(boardName) {

    var index;

    boardSelector.value = boardName;
    scriptSelector.options.length = 0;

    for (index = 0; index < editor.currentBoard.scripts.length; index += 1) {
        scriptSelector.options[index] = new Option(editor.currentBoard.scripts[index].name);
    }

    selectScript(scriptSelector.value);

}

/**
 * An event handler to be invoked when board options have been changed.
 *
 * @param options {object} - Board options
 */
function onBoardOptionsChanged(options) {

    boardNameInput.value = options.name || editor.currentBoard.name;
    northSelector.value = options.north || '';
    eastSelector.value = options.east || '';
    southSelector.value = options.south || '';
    westSelector.value = options.west || '';
    northOffsetSelector.value = options.northOffset || 0;
    eastOffsetSelector.value = options.eastOffset || 0;
    southOffsetSelector.value = options.southOffset || 0;
    westOffsetSelector.value = options.westOffset || 0;
    darkSelector.checked = options.dark;
    reenterSelector.checked = options.reenter;
    maxPlayerBulletSelector.value = options.maxPlayerBullets === undefined ? -1 : options.maxPlayerBullets;

}

/**
 * An event handler to be invoked when an active template has changed
 *
 * @param newTemplate {object} - A template
 */
function onTemplateChanged(newTemplate) {

    if (newTemplate) {
        templateEditor.value = JSON.stringify(newTemplate, undefined, 4);

        if (newTemplate.type) {
            itemSelector.value = newTemplate.type;
        }

        // Initialize foundation plugins
        foundation.find('#template-customizer').foundation();

    } else {
        itemSelector.value = '';
        templateEditor.value = '(None)';
    }

}

/**
 * An event handler to be invoked when an edit mode has changed
 *
 * @param newMode {int} - A new mode
 */
function onModeChanged(newMode) {

    function selectMode(mode) {

        var elements = modeSelector.querySelectorAll('[data-mode]'),
            index;

        for (index = 0; index < elements.length; index += 1) {
            if (elements[index].getAttribute('data-mode') === mode) {
                elements[index].classList.add('active');
            } else {
                elements[index].classList.remove('active');
            }
        }


    }

    switch (newMode) {
    case Editor.Mode.DRAW:
        selectMode('draw');
        break;
    case Editor.Mode.FILL:
        selectMode('fill');
        break;
    case Editor.Mode.SELECT:
        selectMode('select');
        break;
    }
}

/**
 * Initializes a user interface for a JZT game editor.
 *
 * @param options {object} - Initial object elements
 */
function initializeEditorUx(options) {

    /*jslint regexp: true */

    CodeMirror.defineSimpleMode("jztscript", {
        // The start state contains the rules that are intially used
        start: [
            // The regex matches the token, the token property contains the type
            {regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
            {regex: /\b(become|color|change|char|die|end|give|go|if|lock|move|play|put|scroll|send|senddir|set|speed|take|throwstar|torch|try|restore|say|shoot|stand|unlock|victory|wait|walk|zap)\b/, token: "command"},
            {regex: /(?:not|adjacent|blocked|aligned|peep|exists)\b/, token: "expression"},
            {regex: /\d/i, token: "number"},
            {regex: /:.*/, token: "label"},
            {regex: /\/\/.*/, token: "comment"}
        ],
        meta: {
            lineComment: "//"
        }
    });

    editArea = options.editArea;
    foundation = options.foundation;
    templates = {};
    editor = new Editor(editArea, {
        addBoard: onBoardsChanged,
        removeBoard: onBoardsChanged,
        changeBoard: onBoardChanged,
        changeMode: onModeChanged,
        changeTemplate: onTemplateChanged,
        changeBoardOptions: onBoardOptionsChanged,
        changeGameOptions: onGameOptionsChanged
    });
    parser = new JztScriptParser(true);

    initializeBoardOptionsDialog(options.boardOptionsDialog);
    initializeWorldOptionsDialog(options.worldOptionsDialog);
    initializeOpenDialog(options.openDialog);
    initializeScriptTab(options.scriptTab);
    initializeNewScriptDialog(options.newScriptDialog);
    initializeNewBoardDialog(options.newBoardDialog);
    initializeConfirmDeleteBoardDialog(options.confirmDeleteBoardDialog);
    initializeMusicDialog(options.musicDialog);
    initializePrimaryUi(options);

}

/**
 * An event handler to be triggered when a Cross-Document message is received.
 */
function onMessage(event) {

    var origin = window.location.origin || window.location.protocol + '//' + window.location.host;

    if (event.origin !== origin) {
        return;
    }

    if (event.data === 'send-game') {

        // A game was requested
        event.source.postMessage('play-game:' + JSON.stringify(editor.serialize(true)), event.origin);

    }

}

window.addEventListener('message', onMessage, false);
window.onbeforeunload = function () {
    return 'A friendly heads up: If you leave this page before downloading your work, it will be lost forever.';
};

// Pressing ALT+A toggles Advanced Mode
window.onkeydown = function (event) {
    if (event.keyCode === 65 && event.altKey) {
        document.body.classList.toggle('advanced-mode');
    }
};

exports.initializeEditorUx = initializeEditorUx;
