/**
 * JZT User Experience: Settings UX
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ConstructorError = require('../basic').ConstructorError;

/**
 * Settings is a user experience controller that notifies interested listeners
 * in user-initiated changes in settings to volume, mute capabilities, and language.
 *
 * @param {object} settingsElement - A DOM element containing the UX elements
 */
function Settings(settingsElement) {

    var me = this;

    if (!(this instanceof Settings)) {
        throw ConstructorError;
    }

    this.listenerCallbacks = [];
    this.audioMuteElement = settingsElement.querySelector('input[name=\'audio-mute\']');
    this.audioVolumeElement = settingsElement.querySelector('input[name=\'audio-volume\']');
    this.languageElement = settingsElement.querySelector('select[name=\'language\']');

    if (this.audioMuteElement) {
        this.audioMuteElement.addEventListener('click', function (event) {
            me.notify({audioMute: event.target.checked});
        });
    }

    if (this.audioVolumeElement) {
        this.audioVolumeElement.addEventListener('change', function (event) {
            me.notify({audioVolume: parseFloat(event.target.value) / 10});
        });
    }

    if (this.languageElement) {
        this.languageElement.addEventListener('change', function (event) {
            me.notify({language: event.target.value});
        });
    }

}

/**
 * Adds a provided listener callback function to this Setting's collection of
 * interested parties.
 *
 * @param listenerCallback - A callback function to be initiated when settings change
 */
Settings.prototype.addListener = function (listenerCallback) {
    this.listenerCallbacks.push(listenerCallback);
};

/**
 * Notifies all of this Setting's listeners that one or more settings have changed.
 *
 * @param {object} settings: An object containing the setting names and new values.
 */
Settings.prototype.notify = function (settings) {
    var index;
    for (index = 0; index < this.listenerCallbacks.length; index += 1) {
        this.listenerCallbacks[index](settings);
    }
};

/**
 * Initializes this Settings instance with some initial values to use for its
 * user interface.
 *
 * @param initialSettings - An object containing initial settings
 */
Settings.prototype.initialize = function (initialSettings) {

    if (initialSettings.audioActive) {
        if (this.audioMuteElement) {
            this.audioMuteElement.checked = initialSettings.audioMute;
        }
        if (this.audioVolumeElement) {
            this.audioVolumeElement.value = initialSettings.audioVolume * 10;
        }
    } else {
        if (this.audioMuteElement) {
            this.audioMuteElement.checked = true;
            this.audioMuteElement.disabled = true;
        }
        if (this.audioVolumeElement) {
            this.audioVolumeElement.disabled = true;
        }
    }

    if (this.languageElement) {
        this.languageElement.value = initialSettings.language;
    }

};

exports.Settings = Settings;
