/*jslint browser: true */
/*global LZString, Base64, FileReader, alert, CodeMirror */

var jzt;
var jztux;
jztux = (function (jzt, jztux) {

    'use strict';

    var boardSelector,
        northSelector,
        eastSelector,
        southSelector,
        westSelector,
        darkSelector,
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
        editor,
        templates,
        parser;

    /**
     * Selects a script with a provided name
     *
     * @param scriptName {string} - A script name to be selected
     */
    function selectScript(scriptName) {

        var script = editor.currentBoard.getScript(scriptName);

        if (script) {
            scriptEditor.setValue(script.rawScript || script.script);
        } else {
            scriptEditor.setValue('');
        }

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
                dark: darkSelector.value
            });
        }

        northSelector = dialog.querySelector('[data-id="north"]');
        eastSelector = dialog.querySelector('[data-id="east"]');
        southSelector = dialog.querySelector('[data-id="south"]');
        westSelector = dialog.querySelector('[data-id="west"]');
        darkSelector = dialog.querySelector('[data-id="dark"]');

        northSelector.addEventListener('change', onChange, false);
        eastSelector.addEventListener('change', onChange, false);
        southSelector.addEventListener('change', onChange, false);
        westSelector.addEventListener('change', onChange, false);
        darkSelector.addEventListener('click', onChange, false);

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
     * Initializes a script options dialog
     *
     * @param dialog {object} - A dialog DOM element
     */
    function initializeScriptDialog(dialog) {

        scriptSelector = dialog.querySelector('[data-id="selector"]');

        scriptEditor = CodeMirror.fromTextArea(dialog.querySelector('[data-id="editor"]'), {
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
                scriptEditor.setValue(editor.currentBoard.getScript(newName).rawScript);
                scriptSelector.value = newName;
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

            var script = editor.currentBoard.getScript(scriptSelector.value);

            try {
                parser.parse(scriptEditor.getValue());
                scriptWarning.innerHTML = '';
            } catch (exception) {
                scriptWarning.innerHTML = exception;
            }
            script.rawScript = scriptEditor.getValue();

        });

        scriptSelector.addEventListener('change', function (event) {
            selectScript(event.target.value);
        }, false);

    }

    /**
     * Initializes the primary UI options
     *
     * @param options {object} - DOM elements used for user interaction
     */
    function initializePrimaryUi(options) {

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

        boardSelector = options.boardSelector;
        templateEditor = options.templateEditor;
        itemSelector = options.itemSelector;

        // Board Selector
        boardSelector.addEventListener('change', function () {
            editor.switchBoard(event.target.value);
        }, false);

        // Template Editor
        templateEditor.addEventListener('blur', function () {
            if (templateEditor.value !== '') {
                editor.setActiveTemplate(JSON.parse(templateEditor.value));
            }
        }, false);

        // Download
        options.download.addEventListener('click', function (event) {
            var game = editor.serialize();
            event.target.download = game.name.replace(/[a-z0-9_\-]/gi, '-').toLowerCase() + '.jzt';
            event.target.href = 'data:application/octet-stream;charset=utf-8;base64,' +     LZString.compressToBase64(JSON.stringify(game));
        }, false);

        // Download JSON
        options.downloadJson.addEventListener('click', function (event) {
            var game = editor.serialize();
            event.target.download = game.name.replace(/[a-z0-9_\-]/gi, '-').toLowerCase() + '.json';
            event.target.href = 'data:application/json;charset=utf-8;base64,' + Base64.encode(JSON.stringify(game));
        }, false);

        // New Board
        options.newBoard.addEventListener('click', function () {

            var newName = window.prompt('Please enter a board name.', 'Untitled'),
                width = parseInt(window.prompt('Please enter a board width.', '40'), 10),
                height = parseInt(window.prompt('Please enter a board height.', '20'), 10);

            if (newName && width && height) {
                newName = editor.getUniqueBoardName(newName);
                try {
                    editor.addBoard(newName, width, height);
                } catch (ex) {
                    alert(ex);
                }
            }

        }, false);

        // Delete Board
        options.deleteBoard.addEventListener('click', function () {
            editor.removeBoard(editor.currentBoard.name);
        }, false);

        // Load Game
        /*options.loadGame.addEventListener('click', function () {

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

                    editor.deserialize(JSON.parse(json));

                };

                if (file.type === 'application/json') {
                    fileReader.readAsText(file);
                } else {
                    fileReader.readAsDataURL(file);
                }

            }
        }, false);*/

        itemSelector.addEventListener('change', onToolChange, false);

        options.saveButton.addEventListener('click', function () {
            editor.save();
            alert('Game Saved!');
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
        darkSelector.checked = options.dark;

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
            itemSelector.value = 'Nothing';
            templateEditor.value = '(None)';
        }

    }



    /**
     * Initializes a user interface for a JZT game editor.
     *
     * @param options {object} - Initial object elements
     */
    function initializeEditorUx(options) {

        editArea = options.editArea;
        templates = {};
        editor = new jzt.Editor(editArea, {
            addBoard: onBoardAdded,
            removeBoard: onBoardRemoved,
            changeBoard: onBoardChanged,
            changeTemplate: onTemplateChanged,
            changeBoardOptions: onBoardOptionsChanged,
            changeGameOptions: onGameOptionsChanged
        });
        parser = new jzt.jztscript.JztScriptParser(true);

        initializeBoardOptionsDialog(options.boardOptionsDialog);
        initializeWorldOptionsDialog(options.worldOptionsDialog);
        initializeScriptDialog(options.scriptDialog);
        initializePrimaryUi(options);

    }

    jztux.initializeEditorUx = initializeEditorUx;

    return jztux;

}(jzt || {}, jztux || {}));
