/**
 * JZT User Experience: FullScreen
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint browser: true, vars: true */

var jztux;
jztux = (function (jztux) {

    'use strict';

    function isFullscreenSupported() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
    }

    function attachFullscreenHandler(buttonElement, fullscreenElement) {

        function isFullscreen() {
            return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
        }

        function onFullscreenChange() {

            if (isFullscreen()) {
                fullscreenElement.style.height = '100%';
                fullscreenElement.style.width = '100%';
            } else {
                fullscreenElement.style.width = '800px';
                fullscreenElement.style.height = '640px';
            }

            buttonElement.checked = false;

        }

        buttonElement.addEventListener('click', function () {
            if (fullscreenElement.requestFullscreen) {
                fullscreenElement.requestFullscreen();
            } else if (fullscreenElement.webkitRequestFullscreen) {
                fullscreenElement.webkitRequestFullscreen();
            } else if (fullscreenElement.mozRequestFullScreen) {
                fullscreenElement.mozRequestFullScreen();
            } else if (fullscreenElement.msRequestFullscreen) {
                fullscreenElement.msRequestFullscreen();
            }
        });

        if (document.fullscreenEnabled) {
            document.addEventListener('fullscreenchange', onFullscreenChange);
        } else if (document.webkitFullscreenEnabled) {
            document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        } else if (document.mozFullsSreenEnabled) {
            document.addEventListener('mozfullscreenchange', onFullscreenChange);
        } else if (document.msFullscreenEnabled) {
            document.addEventListener('msfullscreenchange', onFullscreenChange);
        }

    }

    jztux.isFullscreenSupported = isFullscreenSupported;
    jztux.attachFullscreenHandler = attachFullscreenHandler;

    return jztux;

}(jztux || {}));
