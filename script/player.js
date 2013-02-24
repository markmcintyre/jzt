window.jzt = window.jzt || {};

jzt.Player = function(game) {
    
    this.PLAYER_SPEED = 9;
    
    this._nextMove = Date.now();
    
    this.spriteIndex = 2;
    this.game = game;
    this.point = new jzt.Point(1,1);
    this.color = '1F';
    
};
    
jzt.Player.prototype.isWillingToMove = function(direction) {
    return true;
};
    
jzt.Player.prototype.move = function(direction) {
    
    var newLocation = this.point.add(direction);
    
    var tile = this.game.currentBoard.getTile(newLocation);
    if(tile) {
        tile.addMessage('TOUCH');
    }
    
    var success = this.game.currentBoard.moveTile(this.point, newLocation);

    this._nextMove = Date.now() + Math.round(1000 / this.PLAYER_SPEED);
    
    return success;

};
    
jzt.Player.prototype.update = function() {
        
    // We can only move when permissable speed-wise
    if( Date.now() > this._nextMove ) {
        
        var k = this.game.keyboard;

        if (k.isPressed(k.UP)) this.move(jzt.Direction.North);
        else if (k.isPressed(k.LEFT)) this.move(jzt.Direction.West);
        else if (k.isPressed(k.DOWN)) this.move(jzt.Direction.South);
        else if (k.isPressed(k.RIGHT)) this.move(jzt.Direction.East);
        
    }
        
};