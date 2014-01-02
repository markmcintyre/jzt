var jzt = jzt || {};
jzt.i18n = jzt.i18n || {};
jzt.i18n.Messages = jzt.i18n.Messages || {};

// The default language is English
jzt.i18n.DefaultLanguage = 'en';

// English
jzt.i18n.Messages.en = {

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
		'dark': 'Room is dark -- You need to light a torch.'
	},
	pause: {
		'paused': 'Paused',
		'health': '   Health:',
		'ammo': '     Ammo:',
		'gems': '     Gems:',
		'torches': '  Torches:',
		'score': '    Score:',
		'keys': '     Keys:'
	}

};

// Français
jzt.i18n.Messages.fr = {

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
		'dark': 'Pièce sombre -- Vous avez besoin d\'une torche!'
	},
	pause: {
		'paused': 'Pause',
		'health': '       PV:',
		'ammo': 'Munitions:',
		'gems': '   Bijous:',
		'torches': '  Torches:',
		'score': '    Score:',
		'keys': '     Clés:'
	}

};

jzt.i18n.getMessage = function(key) {

	var argumentIndex;
	var result = jzt.i18n.findMessage(jzt.i18n.Messages.currentLanguage, key);
	var regEx;

	if(result === undefined && jzt.i18n.Messages.currentLanguage !== jzt.i18n.DefaultLanguage) {
		result = jzt.i18n.findMessage(jzt.i18n.Messages[jzt.i18n.DefaultLanguage], key);
	}

	if(result === undefined) {
		return undefined;
	}
	
	for(argumentIndex = 1; argumentIndex < arguments.length; ++argumentIndex) {
		regEx = new RegExp('\\{' + (argumentIndex - 1) + '\\}', 'g');
		result = result.replace(regEx, arguments[argumentIndex]);
	}

	return result;

};

jzt.i18n.findMessage = function(source, key) {

	var path = key.split('.');
	var current = source;
	var index;

	for(index = 0; index < path.length; ++index) {
		if(current[path[index]] === undefined) {
			return undefined;
		}
		else {
			current = current[path[index]];
		}
	}

	return current;

};

jzt.i18n.getLanguage = function() {
	return jzt.i18n.language;
};

jzt.i18n.setLanguage = function(language) {
	jzt.i18n.language = language;
	jzt.i18n.Messages.currentLanguage = jzt.i18n.Messages[language];
};

jzt.i18n.setLanguage(jzt.i18n.DefaultLanguage);