window.jzt = window.jzt || {};

jzt.KeyboardInput = function() {
 
    this.LEFT = 37;
    this.UP = 38;
    this.RIGHT = 39;
    this.DOWN = 40;
    this.SHIFT = 16;
    this.ENTER = 13;
    this.ESCAPE = 27;
    this.T = 84;
    this.P = 80;

    this.pressedKeys = 0;

    this._pressed = {};
    this._capturableKeys = [this.LEFT, this.UP, this.RIGHT, this.DOWN, this.SHIFT, this.T, this.P, this.ENTER, this.ESCAPE];
    
};

jzt.KeyboardInput.prototype.initialize = function() {
    
    // Remember our bound functions in case we need to remove them from a listener
    this._boundOnKeyUp = this.onKeyUp.bind(this);
    this._boundOnKeyDown = this.onKeyDown.bind(this);
    
    window.addEventListener('keydown', this._boundOnKeyDown, false);
    window.addEventListener('keyup', this._boundOnKeyUp, false);
    
};

jzt.KeyboardInput.prototype.cancelInput = function() {
    this.pressedKeys = 0;
};

jzt.KeyboardInput.prototype.isAnyPressed = function() {
    return this.pressedKeys > 0;
};
    
jzt.KeyboardInput.prototype.isPressed = function(keyCode) {
    return this._pressed[keyCode];  
};
  
jzt.KeyboardInput.prototype.onKeyDown = function(event) {
    if( this._capturableKeys.indexOf(event.keyCode) >= 0) {
        if(!this._pressed[event.keyCode]) {
            this._pressed[event.keyCode] = Date.now();
            this.pressedKeys++;
        }
        event.preventDefault();
    }
};

jzt.KeyboardInput.prototype.onKeyUp = function(event) {
    if( this._capturableKeys.indexOf(event.keyCode) >= 0) {
        delete this._pressed[event.keyCode];
        if(--(this.pressedKeys) < 0) {
            this.pressedKeys = 0;
        }
        event.preventDefault();
    }
};