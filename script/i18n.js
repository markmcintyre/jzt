/**
 * JZT I18N
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint vars:true */

var jzt;
jzt = jzt || {};
jzt.i18n = (function (my) {

    'use strict';

    var DEFAULT_LANGUAGE = 'en';
    var MESSAGES = {

        // ENGLISH-LANGUAGE MESSAGES
        en: {

            keys: {
                'collect': 'You now have the {0} key.',
                'toomany': 'You already have a {0} key.',
                '9': 'blue',
                'A': 'green',
                'B': 'cyan',
                'C': 'red',
                'D': 'purple',
                'E': 'yellow',
                'F': 'white'
            },
            doors: {
                'locked': 'The {0} door is locked.',
                'open': 'The {0} door is now open.',
                '1': 'blue',
                '2': 'green',
                '3': 'cyan',
                '4': 'red',
                '5': 'purple',
                '6': 'yellow',
                '7': 'white'
            },
            obstacles: {
                'water': 'Your way is blocked by water.',
                'signpost': 'Signpost',
                'signpostmessage': 'The signpost is curiously left blank.'
            },
            status: {
                'gameover': 'Game over!',
                'noammo': 'You don\'t have any ammo.',
                'hurt': 'Ouch!',
                'notorches': 'You don\'t have any torches.',
                'title': 'Press [P] to play.',
                'forest': 'A path is cleared through the forest.',
                'gem': 'Gems give you health.',
                'torch': 'Torches light up dark rooms.',
                'ammo': 'Ammunition: 5 shots per container.',
                'dark': 'Room is dark -- You need to light a torch.',
                'breakable': 'This wall has several cracks.',
                'noshoot': 'You can\'t shoot here.',
                'heart': 'Maximum health increased by 10!',
                'invisible': 'You are blocked by an invisible wall.',
                'notdark': 'You don\'t need a torch here.',
                'loading': 'Loading...',
                'loaderror': 'Oops! Loading failed.',
                'fatalerror': 'I has error, Jim.',
                'incompatible': 'Um, this file isn\'t compatible.'
            },
            pause: {
                'paused': 'Paused',
                'health': '    Health:',
                'ammo': '      Ammo:',
                'gems': '      Gems:',
                'torches': '   Torches:',
                'score': '     Score:',
                'keys': '      Keys:'
            },
            file: {
                'new': 'Empty Slot',
                'saved': 'Saved Game',
                'save': 'Save Game',
                'load': 'Restore Game',
                'restart': 'Restart Game'
            }
        },

        // FRENCH-LANGUAGE MESSAGES
        fr: {

            keys: {
                'collect': 'Vous avez maintenant la clé {0}.',
                'toomany': 'Vous avez déja une clé {0}.',
                '9': 'bleue',
                'A': 'verte',
                'B': 'cyan',
                'C': 'rouge',
                'D': 'violet',
                'E': 'jaune',
                'F': 'blanche'
            },
            doors: {
                'locked': 'La porte {0} est verrouillée.',
                'open': 'La porte {0} est maintenant overte.',
                '1': 'bleue',
                '2': 'verte',
                '3': 'cyan',
                '4': 'rouge',
                '5': 'violet',
                '6': 'jaune',
                '7': 'blanche'
            },
            obstacles: {
                'water': 'Votre chemin est bloquée par de l\'eau',
                'signpost': 'Poteau Indicateur',
                'signpostmessage': 'Le poteau indicateur est curieusement vierge.'
            },
            status: {
                'gameover': 'Game over !',
                'noammo': 'Vous n\'avez plus de munitions.',
                'hurt': 'Aïe !',
                'notorches': 'Vous n\'avez plus de torches.',
                'title': 'Appuyez sur [P] pour jouer.',
                'forest': 'Vous frayez un chemin dans la fôret.',
                'gem': 'Les bijoux augmentent vos PV.',
                'torch': 'Les torches éclairent des pièces sombres.',
                'ammo': 'Munitions: 5 bulles par unité.',
                'dark': 'Pièce sombre -- Vous avez besoin d\'une torche!',
                'breakable': 'Ce mur a plusieurs fissures.',
                'noshoot': 'Il est interdit de tirer ici.',
                'heart': 'PV max a augmenté par 10 !',
                'invisible': 'Vous êtes bloqué par un mur invisible.',
                'notdark': 'Vous n\'avez pas besoin d\'une torche ici.',
                'loading': 'Chargement...',
                'loaderror': 'Oups! Chargement echoué.',
                'fatalerror': 'J\'ai l\'erreur, Jim.',
                'incompatible': 'Mais, ce fichier est incompatible...'
            },
            pause: {
                'paused': 'Pause',
                'health': '        PV:',
                'ammo': ' Munitions:',
                'gems': '    Bijous:',
                'torches': '   Torches:',
                'score': '     Score:',
                'keys': '      Clés:'
            },
            file: {
                'new': 'Espace Vide',
                'saved': 'Jeu Sauvegardé',
                'save': 'Sauvegarder',
                'load': 'Ouvrir',
                'restart': 'Récommencer'
            }
        }

    };

    var currentLanguage;
    var currentMessages;

    function findMessage(source, key) {

        var path = key.split('.');
        var current = source;
        var index;

        for (index = 0; index < path.length; index += 1) {
            if (current[path[index]] === undefined) {
                return undefined;
            }

            current = current[path[index]];

        }

        return current;

    }

    function getMessage(key) {

        var argumentIndex;
        var result = findMessage(currentMessages, key);
        var regEx;

        if (result === undefined && currentMessages !== DEFAULT_LANGUAGE) {
            result = findMessage(MESSAGES[DEFAULT_LANGUAGE], key);
        }

        if (result === undefined) {
            return key;
        }

        for (argumentIndex = 1; argumentIndex < arguments.length; argumentIndex += 1) {
            regEx = new RegExp('\\{' + (argumentIndex - 1) + '\\}', 'g');
            result = result.replace(regEx, arguments[argumentIndex]);
        }

        return result;

    }

    function getLanguage() {
        return currentLanguage;
    }

    function setLanguage(language) {
        currentLanguage = language;
        currentMessages = MESSAGES.hasOwnProperty(language) ? MESSAGES[language] : MESSAGES[DEFAULT_LANGUAGE];
    }

    function getBoardMessage(board, potentialKey) {

        if (potentialKey.indexOf('i18n:') === 0) {
            return board.getMessage(potentialKey.substring(5));
        }

        return potentialKey;

    }

    // Set our default language right off the bat
    setLanguage(DEFAULT_LANGUAGE);

    // Exports
    my.DefaultLanguage = DEFAULT_LANGUAGE;
    my.Messages = MESSAGES;
    my.getMessage = getMessage;
    my.findMessage = findMessage;
    my.getLanguage = getLanguage;
    my.setLanguage = setLanguage;
    my.getBoardMessage = getBoardMessage;

    return my;

}(jzt.i18n || {}));
