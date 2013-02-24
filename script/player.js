window.jzt = window.jzt || {};

jzt.Player = function(game) {
    
    var now = Date.now();
    
    this.PLAYER_SPEED = 9;
    this.TORCH_TTL = 60000; // One Minute
    this.MAX_TORCH_STRENGTH = 4;
    
    this._nextMove = now;
    
    this.spriteIndex = 2;
    this.game = game;
    this.point = new jzt.Point(1,1);
    this.color = '1F';
    this.torch = false;
    
    this._torchStrength = 0;
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

      var torchModifier = this.MAX_TORCH_STRENGTH - this._torchStrength;
      yDiff = yDiff + torchModifier;

      switch(yDiff) {
          case 0:
                return xDiff <= 7 - torchModifier;
          case 1:
          case 2:
                return xDiff <= 6 - torchModifier;
          case 3:
                return xDiff <= 5 - torchModifier;
          case 4:
                return xDiff <= 4 - torchModifier;
          default:
                return false;
      }
      
  }
    
};

jzt.Player.prototype.useTorch = function() {
    this.torch = true;
    this._torchStrength = this.MAX_TORCH_STRENGTH;
    this._torchExpiry = Date.now() + this.TORCH_TTL;
};
    
jzt.Player.prototype.update = function() {
        
    var now = Date.now();
        
    if(this.torch) {
        
        if(now > this._torchExpiry) {
            this.torch = false;
        }
        else {
            
            var torchLife = this._torchExpiry - now;
            if(torchLife > 20000) {
                this._torchStrength = 4;
            }
            else if(torchLife > 10000) {
                this._torchStrength = 3;
            }
            else if(torchLife > 5000) {
                this._torchStrength = 2;
            }
            else {
                this._torchStrength = 1;
            }
            
        }
        
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