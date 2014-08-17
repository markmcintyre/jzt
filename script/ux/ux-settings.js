/**
 * JZT User Experience: Settings UX
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*global jzt */

var jztux;
jztux = (function (jztux) {
    
    'use strict';
    
    /**
     * Settings is a user experience controller that notifies interested listeners
     * in user-initiated changes in settings to volume, mute capabilities, and language.
     *
     * @param {object} settingsElement - A DOM element containing the UX elements
     */
    function Settings(settingsElement) {
        
        if (!(this instanceof Settings)) {
            throw jzt.ConstructorError;
        }
        
        this.listenerCallbacks = [];
        this.audioMuteElement = settingsElement.querySelector('input[name=\'audio-mute\']');
        this.audioVolumeElement = settingsElement.querySelector('input[name=\'audio-volume\']');
        this.languageElement = settingsElement.querySelector('select[name=\'language\']');

        if(this.audioMuteElement) {
            this.audioMuteElement.addEventListener('click', this.onMuteChange.bind(this));
        }
        
        if(this.audioVolumeElement) {
            this.audioVolumeElement.addEventListener('change', this.onVolumeChange.bind(this));
        }
        
        if(this.languageElement) {
            this.languageElement.addEventListener('change', this.onLanguageChange.bind(this));
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
        for (index = 0; index < this.listenerCallbacks.length; ++index) {
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
            if(this.audioMuteElement) {
                this.audioMuteElement.checked = initialSettings.audioMute;
            }
            if(this.audioVolumeElement) {
                this.audioVolumeElement.value = initialSettings.audioVolume * 10;
            }
        } else {
            if(this.audioMuteElement) {
                this.audioMuteElement.checked = true;
                this.audioMuteElement.disabled = true;
            }
            if(this.audioVolumeElement) {
                this.audioVolumeElement.disabled = true;
            }
        }

        if(this.languageElement) {
            this.languageElement.value = initialSettings.language;
        }

    };

    /**
     * An event handler to be triggered when a mute checkbox is toggled.
     *
     * @param event - A DOM event
     */
    Settings.prototype.onMuteChange = function (event) {
        this.notify({audioMute: event.target.checked});
    };

    /**
     * An event handler to be triggered when a volume value has changed.
     *
     * @param event - A DOM event
     */
    Settings.prototype.onVolumeChange = function (event) {
        this.notify({audioVolume: parseFloat(event.target.value) / 10});
    };

    /**
     * An event handler to be triggered when the user interface language has changed.
     *
     * @param event - A DOM event
     */
    Settings.prototype.onLanguageChange = function (event) {
        this.notify({language: event.target.value});
    };
    
    jztux.Settings = Settings;
    
    return jztux;
    
}(jztux || {}));