/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

/**
 * GameState is an enumerated type representing a state in our game's finite state
 * machine.
 */
var GameState = {
    Error: -2,
    Splash: -1,
    Loading: 0,
    Playing: 1,
    Paused: 2,
    GameOver: 3,
    Reading: 4,
    Title: 5,
    Victory: 6,
    FileManagement: 7,
    Transition: 8
};

exports.GameState = GameState;
