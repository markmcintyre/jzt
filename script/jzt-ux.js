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
	var toggleName;
	var slideToggles = container.querySelectorAll('.slide-toggle');
	var bottomContent = container.querySelector('.jzt-bottom-content');

	this.container = container;
	this.activePanel = undefined;
	this.slideToggles = {};
	this.bodyClickEvent = this.onBodyClick.bind(this);

	for(index = 0; index < slideToggles.length; ++index) {
		this.addButton(slideToggles[index], slideToggles[index].dataset.panel);
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
	
}

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
}

jzt.ux.SlidingPanel.prototype.onBodyClick = function(event) {
	this.closePanels();
	document.removeEventListener('click', this.bodyClickEvent);
};