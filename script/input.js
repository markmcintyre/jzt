jzt.KeyboardInput = function() {
  
	var pressed = {};
	var self = this;

  	self.LEFT = 37;
  	self.UP = 38;
  	self.RIGHT = 39;
  	self.DOWN = 40;

	var capturableKeys = [self.LEFT, self.UP, self.RIGHT, self.DOWN];
	
	self.initialize = function() {
		window.addEventListener('keydown', function(event) { self.onKeydown(event); }, false);
		window.addEventListener('keyup', function(event) {self.onKeyup(event); }, false);
	}
	
  	self.isPressed = function(keyCode) {
		return pressed[keyCode];	
	}
  
  	self.onKeydown = function(event) {
		if( capturableKeys.indexOf(event.keyCode) >= 0) {
			pressed[event.keyCode] = true;
			event.preventDefault();
		}
  	};

	self.onKeyup = function(event) {
		if( capturableKeys.indexOf(event.keyCode) >= 0) {
			delete pressed[event.keyCode];
			event.preventDefault();
		}
	};

};
