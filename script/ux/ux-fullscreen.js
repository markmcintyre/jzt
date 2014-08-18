/**
 * JZT User Experience: FullScreen
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jztux;
jztux = (function (jztux) {
    
    'use strict';
    
    function isFullscreenSupported() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
    }
    
    function attachFullscreenHandler(buttonElement, canvasElement) {
        
        function isFullscreen() {
            return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
        }

        function onFullscreenChange() {

            if(isFullscreen()) {
                canvasElement.style.height = '100%';
                canvasElement.style.width = Math.round((screen.height * 800) / 640) + 'px';
            }
            else {
                canvasElement.style.width = '800px';
                canvasElement.style.height = '640px';
            }

        }

        buttonElement.addEventListener('click', function() {
            if(canvasElement.requestFullscreen) {
                canvasElement.requestFullscreen();
            }
            else if(canvasElement.webkitRequestFullscreen) {
                canvasElement.webkitRequestFullscreen();
            }
            else if(canvasElement.mozRequestFullScreen) {
                canvasElement.mozRequestFullScreen();
            }
            else if(canvasElement.msRequestFullscreen) {
                canvasElement.msRequestFullscreen();   
            }
        });
        
        if(document.fullscreenEnabled) {
            document.addEventListener('fullscreenchange', onFullscreenChange);
        }
        else if(document.webkitFullscreenEnabled) {
            document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        }
        else if(document.mozFullsSreenEnabled) {
            document.addEventListener('mozfullscreenchange', onFullscreenChange);
        }
        else if(document.msFullscreenEnabled) {
            document.addEventListener('msfullscreenchange', onFullscreenChange);
        }

    }
    
    jztux.isFullscreenSupported = isFullscreenSupported;
    jztux.attachFullscreenHandler = attachFullscreenHandler;
    
    return jztux;
    
}(jztux || {}));