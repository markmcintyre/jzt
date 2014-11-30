/*jslint browser: true */
/*global LZString, Base64, FileReader, alert, CodeMirror, jQuery */

var jzt;
var jztux;
jztux = (function (jzt, jztux) {

    'use strict';

    var boardSelector,
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
        parser;

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
                north: northSelector.value,
                east: eastSelector.value,
                south: southSelector.value,
                west: westSelector.value,
                northOffset: northOffsetSelector.value,
                eastOffset: eastOffsetSelector.value,
                southOffset: southOffsetSelector.value,
                westOffset: westOffsetSelector.value,
                dark: darkSelector.checked,
                maxPlayerBullets: parseInt(maxPlayerBulletSelector.value, 10),
                reenter: reenterSelector.checked
            });
        }

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

        gameName = dialog.querySelector('[data-id="title"]');
        authorName = dialog.querySelector('[data-id="author"]');
        titleBoardSelector = dialog.querySelector('[data-id="title-board"]');
        startingBoardSelector = dialog.querySelector('[data-id="starting-board"]');
        victoryBoardSelector = dialog.querySelector('[data-id="victory-board"]');

    }

    /**
     * Initializes an open dialog
     *
     * @param dialog {object} - A dialog DOM element
     */
    function initializeOpenDialog(dialog) {

        // Load Game
        dialog.querySelector('[data-id="open"]').addEventListener('change', function () {

            var fileReader,
                file;

            if (event.target.files && event.target.files[0]) {

                file = event.target.files[0];
                fileReader = new FileReader();

                fileReader.onload = function () {

                    var json;

                    if (file.type === 'application/json') {
                        json = fileReader.result;
                    } else {
                        json = fileReader.result.split(',')[1];
                        json = LZString.decompressFromBase64(json);
                    }

                    try {
                        editor.deserialize(JSON.parse(json));
                    } catch (exception) {
                        alert(exception);
                    }

                };

                if (file.type === 'application/json') {
                    fileReader.readAsText(file);
                } else {
                    fileReader.readAsDataURL(file);
                }

            }

            event.preventDefault();
            jQuery(dialog.querySelector('.close-reveal-modal')).trigger('click');

        }, false);


    }

    /**
     * Initializes a script options dialog
     *
     * @param dialog {object} - A dialog DOM element
     */
    function initializeScriptDialog(dialog) {

        scriptTab = dialog;
        scriptSelector = dialog.querySelector('[data-id="selector"]');

        scriptEditor = CodeMirror.fromTextArea(dialog.querySelector('[data-id="editor"]'), {
            mode: 'jztscript',
            theme: 'jzt',
            lineNumbers: true,
            lineWrapping: false
        });

        scriptWarning = dialog.querySelector('[data-id="warning"]');

        // New Script Button
        dialog.querySelector('[data-id="new"]').addEventListener('click', function () {

            var script,
                newName = window.prompt('Please enter a script name.', 'Untitled');

            if (newName) {
                newName = editor.getUniqueScriptName(newName);
                script = new jzt.jztscript.JztScript(newName);
                editor.currentBoard.scripts.push(script);
                scriptSelector.options[scriptSelector.options.length] = new Option(newName);
                scriptSelector.value = newName;
                selectScript(newName);
            }

        }, false);

        // Delete Script Button
        dialog.querySelector('[data-id="delete"]').addEventListener('click', function () {

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

            jQuery(dialog.querySelector('.close-reveal-modal')).trigger('click');

        });

    }

    /**
     * Initializes the primary UI options
     *
     * @param options {object} - DOM elements used for user interaction
     */
    function initializePrimaryUi(options) {

        var index,
            mainMenu,
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
                        activeTemplate.targetBoard = 'Untitled';
                        break;
                    case 'Spider':
                        activeTemplate.under = new jzt.things.SpiderWeb().serialize();
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
                editor.setMode(jzt.Editor.Mode.DRAW);
                break;
            case 'select':
                editor.setMode(jzt.Editor.Mode.SELECT);
                break;
            case 'fill':
                editor.setMode(jzt.Editor.Mode.FILL);
                break;
            }

            event.preventDefault();

        }

        function onNoActionClick(event) {
            event.preventDefault();
        }

        mainNavigation = options.mainNavigation;
        mainMenu = mainNavigation.querySelector('section.top-bar-section');
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
        mainMenu.querySelector('[data-menu-item="new"]').addEventListener('click', function () {
            if (window.confirm('Are you sure you want to start a new game world?')) {
                editor.newGame();
            }
        }, false);

        // Download
        mainMenu.querySelector('[data-menu-item="download"]').addEventListener('click', function () {

            /*jslint regexp: true */

            var game = editor.serialize(),
                link;

            link = document.createElement('a');
            link.download = game.name.replace(/[^a-z0-9_\-]/gi, '-').toLowerCase() + '.jzt';
            link.href = 'data:application/octet-stream;charset=utf-8;base64,' +     LZString.compressToBase64(JSON.stringify(game));
            link.click();

        }, false);

        // New Board
        mainMenu.querySelector('[data-menu-item="new-board"]').addEventListener('click', function () {

            newBoardDialog.querySelector('[data-id="name"]').value = 'Untitled Board';
            newBoardDialog.querySelector('[data-id="width"]').value = '50';
            newBoardDialog.querySelector('[data-id="height"]').value = '20';

            event.preventDefault();

        }, false);

        // Delete Board
        mainMenu.querySelector('[data-menu-item="delete-board"]').addEventListener('click', function () {

            editor.removeBoard(editor.currentBoard.name);

            event.preventDefault();

        }, false);


        itemSelector.addEventListener('change', onToolChange, false);

        children = mainNavigation.querySelectorAll('[data-noaction]');
        for (index = 0; index < children.length; index += 1) {
            children[index].addEventListener('click', onNoActionClick, false);
        }

        options.sidebarTabs.on('toggled', function () {
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

        gameName.value = options.name || 'Untitled';
        authorName.value = options.author || 'Anonymous';
        titleBoardSelector.value = options.titleBoard || '';
        startingBoardSelector.value = options.startingBoard || editor.currentBoard.name;
        victoryBoardSelector.value = options.victoryBoard || '';

    }

    /**
     * An event handler to be invoked when a board has been added.
     *
     * @param boardName {string} - A name of a board that's been added.
     */
    function onBoardAdded(boardName) {
        boardSelector.options[boardSelector.options.length] = new Option(boardName, boardName);
        northSelector.options[northSelector.options.length] = new Option(boardName, boardName);
        southSelector.options[southSelector.options.length] = new Option(boardName, boardName);
        eastSelector.options[eastSelector.options.length] = new Option(boardName, boardName);
        westSelector.options[westSelector.options.length] = new Option(boardName, boardName);
        titleBoardSelector.options[titleBoardSelector.options.length] = new Option(boardName, boardName);
        startingBoardSelector.options[startingBoardSelector.options.length] = new Option(boardName, boardName);
        victoryBoardSelector.options[victoryBoardSelector.options.length] = new Option(boardName, boardName);
    }

    /**
     * An event handler to be invoked when a board has been removed.
     *
     * @param boardName {string} = A name of a board that's been removed.
     */
    function onBoardRemoved(boardName) {

        function findIndex(element, name) {
            var index;
            for (index = 0; index < element.length; index += 1) {
                if (element.options[index].value === name) {
                    return index;
                }
            }
        }

        boardSelector.remove(findIndex(boardSelector, boardName));
        northSelector.remove(findIndex(northSelector, boardName));
        eastSelector.remove(findIndex(eastSelector, boardName));
        southSelector.remove(findIndex(southSelector, boardName));
        westSelector.remove(findIndex(westSelector, boardName));
        titleBoardSelector.remove(findIndex(titleBoardSelector, boardName));
        startingBoardSelector.remove(findIndex(startingBoardSelector, boardName));
        victoryBoardSelector.remove(findIndex(victoryBoardSelector, boardName));

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

        northSelector.value = options.north || '';
        eastSelector.value = options.east || '';
        southSelector.value = options.south || '';
        westSelector.value = options.west || '';
        northOffsetSelector.value = options.northOffset || '';
        eastOffsetSelector.value = options.eastOffset || '';
        southOffsetSelector.value = options.southOffset || '';
        westOffsetSelector.value = options.westOffset || '';
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
        case jzt.Editor.Mode.DRAW:
            selectMode('draw');
            break;
        case jzt.Editor.Mode.FILL:
            selectMode('fill');
            break;
        case jzt.Editor.Mode.SELECT:
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
                {regex: /\b(become|change|char|die|end|give|if|lock|move|play|put|scroll|send|set|take|throwstar|torch|restore|say|shoot|stand|unlock|victory|wait|walk|zap)\b/, token: "command"},
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
        templates = {};
        editor = new jzt.Editor(editArea, {
            addBoard: onBoardAdded,
            removeBoard: onBoardRemoved,
            changeBoard: onBoardChanged,
            changeMode: onModeChanged,
            changeTemplate: onTemplateChanged,
            changeBoardOptions: onBoardOptionsChanged,
            changeGameOptions: onGameOptionsChanged
        });
        parser = new jzt.jztscript.JztScriptParser(true);

        initializeBoardOptionsDialog(options.boardOptionsDialog);
        initializeWorldOptionsDialog(options.worldOptionsDialog);
        initializeOpenDialog(options.openDialog);
        initializeScriptDialog(options.scriptDialog);
        initializeNewBoardDialog(options.newBoardDialog);
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
    }

    // Pressing ALT+A toggles Advanced Mode
    window.onkeydown = function (event) {
        if (event.keyCode === 65 && event.altKey) {
            document.body.classList.toggle('advanced-mode');
        }
    };

    jztux.initializeEditorUx = initializeEditorUx;

    return jztux;

}(jzt || {}, jztux || {}));
