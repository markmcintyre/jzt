window.jzt = window.jzt || {};

jzt.JztObject = function(objectData) {

    this.name = objectData.name || undefined;
    this.scriptName = objectData.script;
    this.setSpeed(objectData.speed);
    
    this.point = new jzt.Point(objectData.x || -1, objectData.y || -1);
    
    this.foregroundColor = objectData.foregroundColor || '#ffff00';
    this.backgroundColor = objectData.backgroundColor || '#000000';
    
};
    
jzt.JztObject.prototype.setOwnerBoard = function(board) {
    this.board = board;
};
    
jzt.JztObject.prototype.hasScript = function() {
    return this.script != undefined;
};

jzt.JztObject.prototype.stopScript = function() {
    if(this.hasScript()) {
        this.script.stop();
    }
}
    
jzt.JztObject.prototype.addMessage = function(message) {
    this._messageQueue.push(message);
};
    
jzt.JztObject.prototype.setScriptData = function(scriptData) {
    
    if(scriptData && scriptData.lines && scriptData.name) {
        this.script = new jzt.Script(this, scriptData);
        this._messageQueue = [];
        this._nextTick = Date.now();
    }
    
};
    
jzt.JztObject.prototype.setSpeed = function(speed) {
    speed = speed ? speed : 10;
    this._ticksPerCycle = 1000 / speed;
}
    
jzt.JztObject.prototype.update = function() {
        
    if(this.hasScript() && this._ticksPerCycle && Date.now() > this._nextTick) {
            
        this.script.executeTick();
        this._nextTick = Date.now() + this._ticksPerCycle;
            
    }
        
};