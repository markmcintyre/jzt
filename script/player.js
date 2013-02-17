window.jzt = window.jzt || {};

jzt.Player = function(game) {
    
    this.PLAYER_SPEED = 10;
    
    this._nextMove = Date.now();
    
    this.game = game;
    this.point = new jzt.Point(1,1);
    
};
    
jzt.Player.prototype.moveNorth = function() {
    this.move(jzt.Direction.North);
};
    
jzt.Player.prototype.moveSouth = function() {
    this.move(jzt.Direction.South);
}
    
jzt.Player.prototype.moveEast = function() {
    this.move(jzt.Direction.East);
};
    
jzt.Player.prototype.moveWest = function() {
    this.move(jzt.Direction.West);
};
    
jzt.Player.prototype.move = function(direction) {
    
    var newLocation = this.point.add(direction);
    
    if( this.game.currentBoard.isPassable(newLocation) ) {
        this.point = newLocation;
        this._nextMove = Date.now() + 1000 / this.PLAYER_SPEED;
    }

};
    
jzt.Player.prototype.update = function() {
        
    // We can only move when permissable speed-wise
    if( Date.now() > this._nextMove ) {
        
        var k = this.game.keyboard;

        if (k.isPressed(k.UP)) this.moveNorth();
        else if (k.isPressed(k.LEFT)) this.moveWest();
        else if (k.isPressed(k.DOWN)) this.moveSouth();
        else if (k.isPressed(k.RIGHT)) this.moveEast();
        
    }
        
};