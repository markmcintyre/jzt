/**
 * JZT User Experience: High Score Listener
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node: true */

'use strict';

var i18n = require('../i18n');

/**
 * HighScoreListener is a notification listener that specifically expects victory and gameover
 * events so that it can display a high score to the player.
 *
 * @param {object} alertElement - A DOM element of an alert to display
 */
function HighScoreListener(alertElement) {

    var me = this;

    this.alertElement = alertElement;
    this.types = ['victory', 'game-over', 'file-management'];

    alertElement.querySelector('.close').addEventListener('click', function () {
        me.alertElement.classList.remove('in');
    }, false);

}

/**
 * An event to be triggered when this HighScoreListener should display a victory or
 * game over notification.
 *
 * @param {string} type - A type of notification to display
 * @param {object} notification - Notification details
 */
HighScoreListener.prototype.callback = function (type, notification) {

    var hours,
        minutes,
        seconds,
        index,
        socialLink,
        template,
        formattedScore,
        messageElement  = this.alertElement.querySelector('.message'),
        scoreElement    = this.alertElement.querySelector('.score'),
        playtimeElement = this.alertElement.querySelector('.playtime'),
        scoreValue      = scoreElement.querySelector('.value'),
        playtimeValue   = playtimeElement.querySelector('.value'),
        socialLinks     = this.alertElement.querySelectorAll('.social-share'),
        me              = this;

    setTimeout(function () {

        // Depending on our type of notification...
        if (type === 'victory') {

            // The player has won!
            messageElement.innerHTML = 'Congratulations; you’ve won!';

            // Calculate our total play time
            hours = Math.floor(notification.time / 36e5);
            minutes = Math.floor((notification.time % 36e5) / 6e4);
            seconds = Math.floor((notification.time % 6e4) / 1000);

            seconds = seconds < 9 ? '0' + seconds : seconds;
            minutes = minutes < 9 ? '0' + minutes : minutes;
            hours = hours < 9 ? '0' + hours : hours;

            playtimeElement.style.display = 'block';
            playtimeValue.innerHTML = hours + ':' + minutes + ':' + seconds;


        } else if (type === 'game-over') {

            // It's game over
            messageElement.innerHTML = 'Better luck next time!';

            // No need to display the playtime
            playtimeElement.style.display = 'none';

        } else {

            // Anything else...
            me.alertElement.classList.remove('in');
            return;

        }

        // Show our score
        formattedScore = notification.score.toLocaleString(i18n.getLanguage());
        scoreValue.innerHTML = formattedScore;

        // Update our social sharing links
        for (index = 0; index < socialLinks.length; index += 1) {
            socialLink = socialLinks[index];
            template = socialLink.getAttribute('data-uri-template');
            socialLink.href = template.replace('{url}', encodeURIComponent(document.URL)).replace('{score}', encodeURIComponent(formattedScore));
        }

        me.alertElement.classList.add('in');

    }, type === 'victory' || type === 'game-over' ? 1000 : 0);

};

exports.HighScoreListener = HighScoreListener;
