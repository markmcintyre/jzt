window.jzt = window.jzt || {};

jzt.Point = function(x, y) {
    this.x = x;
    this.y = y;
};

jzt.Point.prototype.add = function(other) {
    return new jzt.Point(this.x + other.x, this.y + other.y);
};

jzt.Point.prototype.directionTo = function(other) {
    
    var xDistance = this.x - other.x;
    var yDistance = this.y - other.y;
    var axis = 'x';
    
    // There is no direction to the same point
    if(xDistance == 0 && yDistance == 0) {
        return undefined;
    }
    else if(xDistance == 0) {
        axis = 'y';
    }
    else if(yDistance == 0) {
        axis = 'x'
    }
    else {
        axis = (Math.floor(Math.random()*2)) ? 'x' : 'y';
    }
    
    if(axis == 'x') {
        return xDistance < 0 ? jzt.Direction.East : jzt.Direction.West;
    }
    else {
        return yDistance < 0 ? jzt.Direction.South : jzt.Direction.North;
    }
    
}

jzt.Point.prototype.equals = function(other) {
    return this.x == other.x && this.y == other.y;
};

jzt.Point.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
}

jzt.Direction = {
    North: new jzt.Point(0,-1),
    East: new jzt.Point(1,0),
    South: new jzt.Point(0,1),
    West: new jzt.Point(-1,0)
};

jzt.Direction.getName = function(direction) {
    switch(direction) {
        case jzt.Direction.North:
            return 'North';
        case jzt.Direction.East:
            return 'East';
        case jzt.Direction.South:
            return 'South';
        case jzt.Direction.West:
            return 'West';
    }
    
    return '[Not a direction]';
    
};

jzt.Direction.parse = function(direction) {

    var candidate = direction.toUpperCase();

    switch(candidate) {
        case 'N':
        case 'NORTH':
            return jzt.Direction.North;
        case 'E':
        case 'EAST':
            return jzt.Direction.East;
        case 'S':
        case 'SOUTH':
            return jzt.Direction.South;
        case 'W':
        case 'WEST':
            return jzt.Direction.West;
    }
    
    return undefined;
    
};

jzt.Direction.clockwise = function(direction) {
    
    switch(direction) {
        case jzt.Direction.North:
            return jzt.Direction.East;
        case jzt.Direction.East:
            return jzt.Direction.South;
        case jzt.Direction.South:
            return jzt.Direction.West;
        case jzt.Direction.West:
            return jzt.Direction.North;
    }
    
    return undefined;

};

jzt.Direction.randomY = function() {
    return Math.floor(Math.random()*2) ? jzt.Direction.North : jzt.Direction.South;
}

jzt.Direction.randomX = function() {
    return Math.floor(Math.random()*2) ? jzt.Direction.East : jzt.Direction.West;
}

jzt.Direction.random = function() {
    switch(Math.floor(Math.random()*4)) {
        case 0:
            return jzt.Direction.North;
        case 1:
            return jzt.Direction.East;
        case 2:
            return jzt.Direction.South;
        default:
            return jzt.Direction.West;
    }
}

jzt.Direction.counterClockwise = function(direction) {
    
    switch(direction) {
        case jzt.Direction.North:
            return jzt.Direction.West;
        case jzt.Direction.West:
            return jzt.Direction.South;
        case jzt.Direction.South:
            return jzt.Direction.East;
        case jzt.Direction.East:
            return jzt.Direction.North;
    }
    
    return undefined;

};

jzt.Direction.opposite = function(direction) {
    
    switch(direction) {
        case jzt.Direction.North:
            return jzt.Direction.South;
        case jzt.Direction.East:
            return jzt.Direction.West;
        case jzt.Direction.South:
            return jzt.Direction.North;
        case jzt.Direction.West:
            return jzt.Direction.East;
    }
    
    return undefined;

 };
 
 jzt.debug = jzt.debug || {};
 
 jzt.debug.log = function() {
     if(jzt.debug.on) {
         console.log.apply(console, arguments);
     }
 };