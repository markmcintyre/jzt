window.jzt = window.jzt || {};

jzt.JztObject = function(objectData) {

	this.name = objectData.name || undefined;
	this.setScript(objectData.script);
	this.setSpeed(objectData.speed);
	
	this.x = objectData.x || -1;
	this.y = objectData.y || -1;
	
	this.foregroundColor = objectData.foregroundColor || '#ffff00';
	this.backgroundColor = objectData.backgroundColor || '#000000';
	
};
	
jzt.JztObject.prototype.setOwnerBoard = function(board) {
	this.board = board;
};
	
jzt.JztObject.prototype.isScriptless = function() {
	return !this.script;
};
	
jzt.JztObject.prototype.isPaused = function() {
	return this.isScriptless() || this.scriptLine < 0 || this.scriptLine >= this.script.length;
};
	
jzt.JztObject.prototype.addMessage = function(message) {
	this._messageQueue.push(message);
};
	
jzt.JztObject.prototype.setScript = function(script) {
	
	this.script = script;
	
	if(this.script) {
		this._messageQueue = [];
		this._nextTick = Date.now();
		this.scriptLine = (this.script && this.script.length > 0 ) ? 0 : -1;
	}
	
};
	
jzt.JztObject.prototype.setSpeed = function(speed) {
	if(this.script) {
		speed = speed ? speed : 10;
		this._ticksPerCycle = 1000 / speed;
	}
}
	
jzt.JztObject.prototype.update = function() {
		
	if(this._ticksPerCycle && Date.now() > this._nextTick) {
			
		// If there is a script to run...
		if(!this.isPaused()) {
			
			var command = this.script[this.scriptLine];
			if(command == '#move n') {
				console.log(this.name + ' is moving north.');
				this.board.moveTile(this.x, this.y, this.x, this.y-1);
			}
			else if(command == '#end' ) {
				console.log(this.name + ' has ended its program.');
				this.scriptLine = -1;
			}
			else if(command == '#wait 5') {
				console.log(this.name + ' is waiting for five ticks.');
				this._nextTick = Date.now() + this._ticksPerCycle * 5;
			}
			
			if(!this.isPaused()) {
				this.scriptLine++;
			}
			
		}
		
		this._nextTick = Date.now() + this._ticksPerCycle;
			
	}
		
};