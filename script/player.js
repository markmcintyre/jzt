window.jzt = window.jzt || {};

jzt.Player = function(game) {
    
    var now = Date.now();
    
    this.PLAYER_SPEED = 9;
    this.TORCH_TTL = 10000; // One Minute
    
    this._nextMove = now;
    
    this.spriteIndex = 2;
    this.game = game;
    this.point = new jzt.Point(1,1);
    this.color = '1F';
    this.torch = false;
    this._torchExpiry = now;
    
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

jzt.Player.prototype.inVisibleRadius = function(point) {
  
  if(!this.torch) {
      return point.x == this.point.x && point.y == this.point.y;
  }
  else {
      
      var xDiff = Math.abs(point.x - this.point.x);
      var yDiff = Math.abs(point.y - this.point.y);

      switch(yDiff) {
          case 0:
                return xDiff <= 7;
          case 1:
          case 2:
                return xDiff <= 6;
          case 3:
                return xDiff <= 5;
          case 4:
                return xDiff <= 4;
          default:
                return false;
      }
      
  }
    
};

jzt.Player.prototype.useTorch = function() {
    this.torch = true;
    this._torchExpiry = Date.now() + this.TORCH_TTL;
};
    
jzt.Player.prototype.update = function() {
        
    var now = Date.now();
        
    if(this.torch && now > this._torchExpiry) {
        this.torch = false;
    }
        
    // We can only move when permissable speed-wise
    if( now > this._nextMove ) {
        
        var k = this.game.keyboard;

        if (k.isPressed(k.UP)) this.move(jzt.Direction.North);
        else if (k.isPressed(k.LEFT)) this.move(jzt.Direction.West);
        else if (k.isPressed(k.DOWN)) this.move(jzt.Direction.South);
        else if (k.isPressed(k.RIGHT)) this.move(jzt.Direction.East);
        
    }
        
};