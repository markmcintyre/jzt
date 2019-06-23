/**
 * JZT Input
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ConstructorError = require('./basic').ConstructorError;

/**
 * Keyboard input takes event-based keyboard input and stores it in a pollable
 * form that can be used to determine when keys are pressed and when.
 */
function KeyboardInput() {

    if (!(this instanceof KeyboardInput)) {
        throw ConstructorError;
    }

    this.LEFT = 37;
    this.UP = 38;
    this.RIGHT = 39;
    this.DOWN = 40;
    this.SHIFT = 16;
    this.SPACE = 32;
    this.ENTER = 13;
    this.ESCAPE = 27;
    this.T = 84;
    this.P = 80;
    this.S = 83;
    this.R = 82;
    this.BACKSPACE = 8;
    this.DELETE = 46;

    this.pressedKeys = 0;

    this.pressed = {};
    this.capturableKeys = [this.LEFT, this.UP, this.RIGHT, this.DOWN, this.SHIFT, this.SPACE, this.T, this.P, this.S, this.R, this.ENTER, this.ESCAPE, this.BACKSPACE, this.DELETE];

}

/**
 * Initializes this KeyboardInput instance by binding key listeners.
 */
KeyboardInput.prototype.initialize = function () {

    if (!this.initialized) {

        // Remember our bound functions in case we need to remove them from a listener
        this.boundOnKeyUp = this.onKeyUp.bind(this);
        this.boundOnKeyDown = this.onKeyDown.bind(this);

        window.addEventListener('keydown', this.boundOnKeyDown, false);
        window.addEventListener('keyup', this.boundOnKeyUp, false);

    }

    this.initialized = true;

};

/**
 * Cancels all tracked keyboard input.
 */
KeyboardInput.prototype.cancelInput = function () {
    var index;
    for (index in this.pressed) {
        if (this.pressed.hasOwnProperty(index)) {
            this.pressed[index] = -1;
        }
    }
    this.pressedKeys = 0;
};

/**
 * Cancels a provided key code press.
 *
 * @param keyCode A key code.
 */
KeyboardInput.prototype.cancelKey = function (keyCode) {
    if (this.pressed[keyCode] !== undefined) {
        this.pressed[keyCode] = -1;
        this.pressedKeys -= 1;
        if (this.pressedKeys < 0) {
            this.pressedKeys = 0;
        }
    }
};

/**
 * Returns whether or not any trackable key is currently being pressed.
 *
 * @return true if any key is pressed, false otherwise.
 */
KeyboardInput.prototype.isAnyPressed = function () {
    return this.pressedKeys > 0;
};

/**
 * Returns a timestamp at which a provided keycode was pressed. This code
 * can also be used as a truthy value indicating if the key is pressed.
 *
 * @param keyCode A key to check if it is pressed or not.
 * @return The timestamp at which the key was pressed, or undefined if the key is not pressed.
 */
KeyboardInput.prototype.isPressed = function (keyCode) {
    return (this.pressed[keyCode] !== undefined) && (this.pressed[keyCode] > 0) ? this.pressed[keyCode] : undefined;
};

/**
 * Retrieves the key code of the most recently pressed key out of a provided array of key codes.
 * If no array is provided, the most recently pressed key out of all possible capturable keys is returned.
 *
 * @param keys An array of key codes.
 * @return A most recently pressed key code.
 */
KeyboardInput.prototype.getMostRecentPress = function (keys) {

    var index,
        key,
        highestTimeStamp = 0,
        result;

    if (this.pressedKeys <= 0) {
        return;
    }

    if (!keys) {
        keys = this.capturableKeys;
    }

    for (index = 0; index < keys.length; index += 1) {
        key = keys[index];
        if (this.pressed[key] > highestTimeStamp) {
            highestTimeStamp = this.pressed[key];
            result = key;
        }
    }

    return result;

};

/**
 * An event handler to be triggered when a key is pressed.
 *
 * @param event A keydown event
 */
KeyboardInput.prototype.onKeyDown = function (event) {
    if (this.capturableKeys.indexOf(event.keyCode) >= 0) {
        if (this.pressed[event.keyCode] === undefined) {
            this.pressed[event.keyCode] = Date.now();
            this.pressedKeys += 1;
        }
        event.preventDefault();
    }
};

/**
 * An event handler to be triggerd when a key is released.
 *
 * @param event A keyup event.
 */
KeyboardInput.prototype.onKeyUp = function (event) {
    if (this.capturableKeys.indexOf(event.keyCode) >= 0) {
        delete this.pressed[event.keyCode];
        this.pressedKeys -= 1;
        if (this.pressedKeys < 0) {
            this.pressedKeys = 0;
        }
        event.preventDefault();
    }
};

// Exports
exports.KeyboardInput = KeyboardInput;
