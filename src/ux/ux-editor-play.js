/*jslint node: true */
/*globals jzt */

'use strict';

var game,
    origin;

function receiveMessage(event) {

    if (event.origin === origin) {

        if (event.data && event.data.lastIndexOf && (event.data.lastIndexOf('play-game:', 0) === 0)) {

            document.querySelector('canvas').classList.remove('loading');

            game = new jzt.Game({
                canvasElement: document.getElementById('jzt'),
                playTest: true,
                onLoadCallback: function (success) {
                    if (success) {
                        this.run(JSON.parse(event.data.substring(10)));
                    }
                }
            });

        }

    }

}

function initialize() {
    origin = window.location.origin || window.location.protocol + '//' + window.location.host;
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('send-game', origin);
}

initialize();
