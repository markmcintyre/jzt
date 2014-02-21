/**
 * JZT User Experience
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

"use strict";

var jzt = jzt || {};
jzt.ux = jzt.ux || {};

jzt.ux.SlidingPanel = function(container) {

	var index;
	var slideToggles = container.querySelectorAll('.slide-toggle');

	this.container = container;
	this.activePanel = undefined;
	this.slideToggles = {};
	this.bodyClickEvent = this.onBodyClick.bind(this);

	for(index = 0; index < slideToggles.length; ++index) {
		this.addButton(slideToggles[index], slideToggles[index].getAttribute('data-panel'));
	}

};

jzt.ux.SlidingPanel.prototype.addButton = function(buttonElement, panelName) {

	var me = this;

	// Remember our toggle for later
	this.slideToggles[panelName] = buttonElement;

	// Add a click event
	buttonElement.addEventListener('click', function(event) {
		me.onButtonClick(event, panelName);
	});

};

jzt.ux.SlidingPanel.prototype.onButtonClick = function(event, panelName) {

	// We're handling the event fully
	event.stopPropagation();
	event.preventDefault();

	// If our panel isn't already open...
	if(this.activePanel !== panelName) {
		this.openPanel(panelName);
	}
	else {
		this.closePanels();
	}
	
};

jzt.ux.SlidingPanel.prototype.openPanel = function(panelName) {

	var index;
	var slideToggle;
	var panelElement = document.querySelector('#' + this.container.id + ' .jzt-bottom-content div.panel.' + panelName);
	var contentPanels = document.querySelectorAll('#' + this.container.id + ' .jzt-bottom-content div.panel');

	// Set our active panel
	this.activePanel = panelName;

	this.removeDecoration();

	// Add an active class to the active slide toggle, if it exists
	slideToggle = this.slideToggles[panelName];
	if(slideToggle) {
		slideToggle.classList.add('active');
	}

	// First, ensure our panels are hidden
	for(index = 0; index < contentPanels.length; ++index) {
		contentPanels[index].style.display = 'none';
	}

	// Except for our main panel
	panelElement.style.display = 'block';

	// Add our open class
	this.container.className = 'jzt-sliding-container open';

	// Listen for panel closing clicks
	document.addEventListener('click', this.bodyClickEvent);

};

jzt.ux.SlidingPanel.prototype.removeDecoration = function() {

	var index;

	// Remove our active class from our slide toggles
	for(index in this.slideToggles) {
		if(this.slideToggles.hasOwnProperty(index)) {
			this.slideToggles[index].classList.remove('active');
		}
	}

};

jzt.ux.SlidingPanel.prototype.closePanels = function() {
	this.activePanel = undefined;
	this.removeDecoration();
	this.container.className = 'jzt-sliding-container';
};

jzt.ux.SlidingPanel.prototype.onBodyClick = function() {
	this.closePanels();
	document.removeEventListener('click', this.bodyClickEvent);
};

jzt.ux.setFullScreenButton = function(buttonElement, canvasElement) {

	function isFullScreen() {
		return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
	}

	function onFullScreenChange() {

		if(isFullScreen()) {
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
	});


	document.addEventListener('fullscreenchange', onFullScreenChange);
	document.addEventListener('webkitfullscreenchange', onFullScreenChange);
	document.addEventListener('mozfullscreenchange', onFullScreenChange);
	document.addEventListener('msfullscreenchange', onFullScreenChange);

};

jzt.ux.DisplayableNotificationListener = function(configuration) {
	jzt.NotificationListener.call(this);
	this.warningButton = configuration.warningButton;
	this.warningElement = configuration.warningListElement;
};
jzt.ux.DisplayableNotificationListener.prototype = new jzt.NotificationListener();
jzt.ux.DisplayableNotificationListener.prototype.constructor = jzt.ux.DisplayableNotificationListener;

jzt.ux.DisplayableNotificationListener.prototype.addNotification = function(type, message) {
	jzt.NotificationListener.prototype.addNotification.call(this, type, message);
	if(type === 'warning') {
		this.warningButton.style.display = 'block';
	}
	this.updateListElement();
};

jzt.ux.DisplayableNotificationListener.prototype.updateListElement = function() {

	var index;
	var notification;

	// Clear any existing warnings
	this.warningElement.innerHTML = '';

	for(index = this.notifications.length-1; index >= 0; --index) {
		notification = this.notifications[index];
		if(notification.type === 'warning') {
			this.warningElement.innerHTML += '<li>' + '<p>' + notification.message.split('\n').join('</p><p>') + '</p><p><small>' + new Date(notification.timestamp).toLocaleString() + '</small></p></li>';
		}
	}

};

jzt.ux.DisplayableNotificationListener.prototype.clear = function() {
	this.updateListElement();
	this.warningButton.style.display = 'none';
}
