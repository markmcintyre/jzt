/**
 * JZT User Experience
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node: true */

'use strict';

var ConstructorError = require('basic').ConstructorError,
    NotificationListener = require('basic').NotificationListener;

function SlidingPanel(container) {

    var index,
        slideToggles = container.querySelectorAll('.slide-toggle');

    if (!(this instanceof SlidingPanel)) {
        throw ConstructorError;
    }

    this.container = container;
    this.activePanel = undefined;
    this.slideToggles = {};
    this.bodyClickEvent = this.onBodyClick.bind(this);

    for (index = 0; index < slideToggles.length; index += 1) {
        this.addButton(slideToggles[index], slideToggles[index].getAttribute('data-panel'));
    }

}

SlidingPanel.prototype.addButton = function (buttonElement, panelName) {

    var me = this;

    // Remember our toggle for later
    this.slideToggles[panelName] = buttonElement;

    // Add a click event
    buttonElement.addEventListener('click', function (event) {
        me.onButtonClick(event, panelName);
    });

};

SlidingPanel.prototype.onButtonClick = function (event, panelName) {

    // We're handling the event fully
    event.stopPropagation();
    event.preventDefault();

    // If our panel isn't already open...
    if (this.activePanel !== panelName) {
        this.openPanel(panelName);
    } else {
        this.closePanels();
    }

};

SlidingPanel.prototype.openPanel = function (panelName) {

    var index,
        slideToggle,
        panelElement = document.querySelector('#' + this.container.id + ' .jzt-bottom-content div.panel.' + panelName),
        contentPanels = document.querySelectorAll('#' + this.container.id + ' .jzt-bottom-content div.panel');

    // Set our active panel
    this.activePanel = panelName;

    this.removeDecoration();

    // Add an active class to the active slide toggle, if it exists
    slideToggle = this.slideToggles[panelName];
    if (slideToggle) {
        slideToggle.classList.add('active');
    }

    // First, ensure our panels are hidden
    for (index = 0; index < contentPanels.length; index += 1) {
        contentPanels[index].style.display = 'none';
    }

    // Except for our main panel
    panelElement.style.display = 'block';

    // Add our open class
    this.container.className = 'jzt-sliding-container open';

    // Listen for panel closing clicks
    document.addEventListener('click', this.bodyClickEvent);

};

SlidingPanel.prototype.removeDecoration = function () {

    var index;

    // Remove our active class from our slide toggles
    for (index in this.slideToggles) {
        if (this.slideToggles.hasOwnProperty(index)) {
            this.slideToggles[index].classList.remove('active');
        }
    }

};

SlidingPanel.prototype.closePanels = function () {
    this.activePanel = undefined;
    this.removeDecoration();
    this.container.className = 'jzt-sliding-container';
};

SlidingPanel.prototype.onBodyClick = function () {
    this.closePanels();
    document.removeEventListener('click', this.bodyClickEvent);
};

function setFullScreenButton(buttonElement, canvasElement) {

    function isFullScreen() {
        return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
    }

    function onFullScreenChange() {

        if (isFullScreen()) {
            canvasElement.style.height = '100%';
            canvasElement.style.width = Math.round((screen.height * 800) / 640) + 'px';
        } else {
            canvasElement.style.width = '800px';
            canvasElement.style.height = '640px';
        }

    }

    buttonElement.addEventListener('click', function () {
        if (canvasElement.requestFullscreen) {
            canvasElement.requestFullscreen();
        } else if (canvasElement.webkitRequestFullscreen) {
            canvasElement.webkitRequestFullscreen();
        } else if (canvasElement.mozRequestFullScreen) {
            canvasElement.mozRequestFullScreen();
        }
    });


    document.addEventListener('fullscreenchange', onFullScreenChange);
    document.addEventListener('webkitfullscreenchange', onFullScreenChange);
    document.addEventListener('mozfullscreenchange', onFullScreenChange);
    document.addEventListener('msfullscreenchange', onFullScreenChange);

}

function DisplayableNotificationListener(configuration) {

    if (!(this instanceof DisplayableNotificationListener)) {
        throw ConstructorError;
    }

    NotificationListener.call(this);
    this.warningButton = configuration.warningButton;
    this.warningElement = configuration.warningListElement;
}
DisplayableNotificationListener.prototype = new NotificationListener();
DisplayableNotificationListener.prototype.constructor = DisplayableNotificationListener;

DisplayableNotificationListener.prototype.addNotification = function (type, message) {
    NotificationListener.prototype.addNotification.call(this, type, message);
    if (type === 'warning') {
        this.warningButton.style.display = 'block';
    }
    this.updateListElement();
};

DisplayableNotificationListener.prototype.updateListElement = function () {

    var index,
        notification;

    // Clear any existing warnings
    this.warningElement.innerHTML = '';

    for (index = this.notifications.length - 1; index >= 0; index -= 1) {
        notification = this.notifications[index];
        if (notification.type === 'warning') {
            this.warningElement.innerHTML += '<li>' + '<p>' + notification.message.split('\n').join('</p><p>') + '</p><p><small>' + new Date(notification.timestamp).toLocaleString() + '</small></p></li>';
        }
    }

};

DisplayableNotificationListener.prototype.clear = function () {
    this.updateListElement();
    this.warningButton.style.display = 'none';
};

function Settings(settingsElement) {

    if (!(this instanceof Settings)) {
        throw ConstructorError;
    }

    this.listenerCallbacks = [];
    this.audioMuteElement = settingsElement.querySelector('input[name=\'audio-enabled\']');
    this.audioVolumeElement = settingsElement.querySelector('input[name=\'audio-volume\']');
    this.languageElement = settingsElement.querySelector('select[name=\'language\']');

    this.audioMuteElement.addEventListener('click', this.onMuteChange.bind(this));
    this.audioVolumeElement.addEventListener('change', this.onVolumeChange.bind(this));
    this.languageElement.addEventListener('change', this.onLanguageChange.bind(this));

}

Settings.prototype.addListener = function (listenerCallback) {
    this.listenerCallbacks.push(listenerCallback);
};

Settings.prototype.notify = function (settings) {
    var index;
    for (index = 0; index < this.listenerCallbacks.length; index += 1) {
        this.listenerCallbacks[index](settings);
    }
};

Settings.prototype.initialize = function (initialSettings) {

    if (initialSettings.audioActive) {
        this.audioMuteElement.checked = initialSettings.audioMute;
        this.audioVolumeElement.value = initialSettings.audioVolume * 10;
    } else {
        this.audioMuteElement.checked = true;
        this.audioMuteElement.disabled = true;
        this.audioVolumeElement.disabled = true;
    }

    this.languageElement.value = initialSettings.language;

};

Settings.prototype.onMuteChange = function (event) {
    this.notify({audioMute: event.target.checked});
};

Settings.prototype.onVolumeChange = function (event) {
    this.notify({audioVolume: parseFloat(event.target.value) / 10});
};

Settings.prototype.onLanguageChange = function (event) {
    this.notify({language: event.target.value});
};

// Exports
exports.setFullScreenButton = setFullScreenButton;
exports.SlidingPanel = SlidingPanel;
exports.DisplayableNotificationListener = DisplayableNotificationListener;
exports.Settings = Settings;
