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
	var bottomContent = container.querySelector('.jzt-bottom-content');

	this.container = container;
	this.bodyClickEvent = this.onBodyClick.bind(this);

	for(index = 0; index < slideToggles.length; ++index) {
		this.addButton(slideToggles[index], bottomContent.querySelector('.' + slideToggles[index].dataset.panel));
	}

};

jzt.ux.SlidingPanel.prototype.addButton = function(buttonElement, panelElement) {

	var me = this;

	buttonElement.addEventListener('click', function(event) {
		me.onButtonClick(event, panelElement);
	});

};

jzt.ux.SlidingPanel.prototype.onButtonClick = function(event, panelElement) {

	var index;
	var contentPanels = document.querySelectorAll('#' + this.container.id + ' .jzt-bottom-content div.panel');

	// We're handling the event fully
	event.stopPropagation();
	event.preventDefault();

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
}

jzt.ux.SlidingPanel.prototype.onBodyClick = function(event) {
	this.container.className = 'jzt-sliding-container';
	document.removeEventListener('click', this.bodyClickEvent);
};