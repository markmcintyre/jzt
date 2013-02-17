window.jzt = window.jzt || {};

jzt.Point = function(x, y) {
    this.x = x;
    this.y = y;
};

jzt.Point.prototype.add = function(other) {
    return new jzt.Point(this.x + other.x, this.y + other.y);
};

jzt.Point.prototype.equals = function(other) {
    return this.x == other.x && this.y == other.y;
};

jzt.Direction = {
    North: new jzt.Point(0,-1),
    East: new jzt.Point(1,0),
    South: new jzt.Point(0,1),
    West: new jzt.Point(-1,0),
    None: new jzt.Point(0,0)
};

jzt.Direction.parse = function(direction) {

    var candidate = direction.toUpperCase();

    if(candidate == 'N' || candidate == 'NORTH') {
        return jzt.Direction.North;
    }
    else if(candidate == 'E' || candidate == 'EAST') {
        return jzt.Direction.East;
    }
    else if(candidate == 'S' || candidate == 'SOUTH') {
        return jzt.Direction.South;
    }
    else if(candidate == 'W' || candidate == 'WEST') {
        return jzt.Direction.West;
    }
    
};

jzt.Direction.clockwise = function(direction) {
    if(jzt.Direction.North.equals(direction)) {
        return jzt.Direction.East;
    }
    else if(jzt.Direction.East.equals(direction)) {
        return jzt.Direction.South;
    }
    else if(jzt.Direction.South.equals(direction)) {
        return jzt.Direction.West;
    }
    else if(jzt.Direction.West.equals(direction)) {
        return jzt.Direction.North;
    }
    else {
        return jzt.Direction.None;
    }
}

jzt.Direction.counterClockwise = function(direction) {
    if(jzt.Direction.North.equals(direction)) {
        return jzt.Direction.West;
    }
    else if(jzt.Direction.West.equals(direction)) {
        return jzt.Direction.South;
    }
    else if(jzt.Direction.South.equals(direction)) {
        return jzt.Direction.East;
    }
    else if(jzt.Direction.East.equals(direction)) {
        return jzt.Direction.North;
    }
    else {
        return jzt.Direction.None;
    }
}

jzt.Direction.opposite = function(direction) {
    if(jzt.Direction.North.equals(direction)) {
        return jzt.Direction.South;
    }
    else if(jzt.Direction.East.equals(direction)) {
        return jzt.Direction.West;
    }
    else if(jzt.Direction.South.equals(direction)) {
        return jzt.Direction.North;
    }
    else if(jzt.Direction.West.equals(direction)) {
        return jzt.Direction.East;
    }
    else {
        return jzt.Direction.None;
    }
 }
 
 jzt.debug = jzt.debug || {};
 
 jzt.debug.log = function() {
     if(jzt.debug.on) {
         console.log.apply(console, arguments);
     }
 }