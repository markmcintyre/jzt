window.jzt = window.jzt || {};

jzt.JztObject = function(name) {

	var self = this;
	var messageQueue = [];
	var ticksPerCycle;
	var nextTick = Date.now();
	var scriptLine = 0;
	var script = [];
	
	self.name = name;
	self.x = -1;
	self.y = -1;
	
	self.addMessage = function(message) {
		messageQueue.push(message);
	};
	
	self.setScript = function(newScript) {
		script = newScript;
	}
	
	self.setSpeed = function(speed) {
		ticksPerCycle = speed ? 1000 / speed : 0;
	}
	
	self.update = function() {
		
		if(ticksPerCycle && Date.now() > nextTick) {
			
		}
		
	};
	
};