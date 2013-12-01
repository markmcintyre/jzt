/**
 * JZT Basic
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */
/* global console */

"use strict";

var jzt = jzt || {};
jzt.debug = jzt.debug || {};
jzt.util = jzt.util || {};

/**
 * Point represents a point on a cartesian plane.
 *
 * @param x An x coordinate.
 * @param y A y coordinate.
 */
jzt.Point = function(x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Creates a new Point with identical values to this one.
 *
 * @return A Point.
 */
jzt.Point.prototype.clone = function() {
    return new jzt.Point(this.x, this.y);
};

/**
 * Adds a provided point to this point, and returns the result.
 *
 * @param other Another point to add to this one.
 * @return A new point with the added value.
 */
jzt.Point.prototype.add = function(other) {
    return new jzt.Point(this.x + other.x, this.y + other.y);
};

/**
 * Subtracts a provided point from this point and returns the result.
 *
 * @param other Another point to subtract from this one.
 * @return A new point with the subtracted value.
 */
jzt.Point.prototype.subtract = function(other) {
    return new jzt.Point(this.x - other.x, this.y - other.y);
};

/**
 * Retrieves whether or not a provided point is aligned with this one, within a given
 * spread threshold.
 *
 * @param other A point to test for alignment.
 * @param spread A spread threshold to allow for in the alignement calculation.
 * @return true if a provided point is aligned with this one, false otherwise.
 */
jzt.Point.prototype.aligned = function(other, spread, direction) {
    spread = spread === undefined ? 1 : spread;

    if(!direction) {
        return (Math.abs(this.x - other.x) < spread) || (Math.abs(this.y - other.y) < spread);
    }
    else if(direction === jzt.Direction.North) {
        return (other.y < this.y) && Math.abs((this.x - other.x)) < spread;
    }
    else if(direction === jzt.Direction.South) {
        return (other.y > this.y) && Math.abs((this.x - other.x)) < spread;
    }
    else if(direction === jzt.Direction.East) {
        return (other.x > this.x) && Math.abs((this.y - other.y)) < spread;
    }
    else if(direction === jzt.Direction.West) {
        return (other.x < this.x) && Math.abs((this.y - other.y)) < spread;
    }
    else {
        return undefined;
    }
};

/**
 * Calculates a direction from this point to another point, along an optional axis. If 
 * no axis is provided, then the closest of either the X or Y axis will be used. If
 * the distance on both axes are the same, then one will be picked at random.
 *
 * @param other Another point to calculate the direction toward.
 * @param axis 'x' or 'y' depending on the axis to be tested.
 * @return A Point representing a direction
 */
jzt.Point.prototype.directionTo = function(other, axis) {
    
    var xDistance = this.x - other.x;
    var yDistance = this.y - other.y;
    
    // There is no direction to the same point
    if(xDistance === 0 && yDistance === 0) {
        return undefined;
    }

    if(axis === undefined) {
        if(xDistance === 0) {
            axis = 'y';
        }
        else if(yDistance === 0) {
            axis = 'x';
        }
        else {
            axis = (Math.floor(Math.random()*2)) ? 'x' : 'y';
        }
    }
    
    if(axis === 'x') {
        if(xDistance === 0) {
            return undefined;
        }
        return xDistance < 0 ? jzt.Direction.East : jzt.Direction.West;
    }
    else {
        if(yDistance === 0) {
            return undefined;
        }
        return yDistance < 0 ? jzt.Direction.South : jzt.Direction.North;
    }
    
};

jzt.Point.prototype.compareTo = function(other) {
    if(this.x < other.x) {
        return -1;
    }
    else if(this.x > other.x) {
        return 1;
    }
    else {
        if(this.y < other.y) {
            return -1;
        }
        else if(this.y > other.y) {
            return 1;
        }
    }
    return 0;
};

/**
 * Returns whether or not this Point is equal in value to another point.
 *
 * @param other A point to test for equality.
 * @return true if another point is equal in value to this point, false otherwise.
 */
jzt.Point.prototype.equals = function(other) {
    return this.x === other.x && this.y === other.y;
};

/**
 * Returns a string representation of this point.
 *
 * @return A string representation of this point.
 */
jzt.Point.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
};

jzt.PointSet = function() {
    this.points = [];
    this.sorted = false;
};

jzt.PointSet.prototype.add = function(point) {
    if(!this.contains(point)) {
        this.points.push(point);
        this.sorted = false;
    }
};

jzt.PointSet.prototype.sortPoints = function() {
    this.points.sort(function(a, b) {
        return a.compareTo(b);
    });
    this.sorted = true;
};

jzt.PointSet.prototype.contains = function(point) {
    return this.indexOf(point) >= 0;
};

jzt.PointSet.prototype.indexOf = function(point) {

    var minIndex = 0;
    var maxIndex = this.points.length - 1;
    var middle;

    if(! this.sorted) {
        this.sortPoints();
    }

    while(maxIndex >= minIndex) {
        middle = minIndex + (Math.round((maxIndex - minIndex) / 2));

        if (this.points[middle].compareTo(point) < 0) {
            minIndex = middle + 1;
        }
        else if(this.points[middle].compareTo(point) > 0) {
            maxIndex = middle - 1;
        }
        else {
            return middle;
        }

    }

    return -1;

};

/**
 * Direction is an enumerated type representing each of the four possible directions
 * on a tile-based grid.
 */
jzt.Direction = {
    North: new jzt.Point(0,-1),
    East: new jzt.Point(1,0),
    South: new jzt.Point(0,1),
    West: new jzt.Point(-1,0)
};

/**
 * Performs a provided callback function for each possible direction on a tile-based
 * grid. The callback function will be given a single parameter containing the direction
 * being iterated.
 * 
 * @param callback A callback function to be executed.
 */
jzt.Direction.each = function(callback) {
    callback(jzt.Direction.North);
    callback(jzt.Direction.East);
    callback(jzt.Direction.South);
    callback(jzt.Direction.West);
};

/**
 * Retrieves a Point representing a direction from a provided name.
 * 
 * @param name A name of a direction
 * @return A Point representing a direction.
 */
jzt.Direction.fromName = function(name) {
    switch(name) {
        case 'N':
        case 'North':
            return jzt.Direction.North;
        case 'E':
        case 'East':
            return jzt.Direction.East;
        case 'S':
        case 'South':
            return jzt.Direction.South;
        case 'W':
        case 'West':
            return jzt.Direction.West;
        default:
            return undefined;
    }
};

/**
 * Retrieves a name for a provided Point representing a direction from our
 * enumerated direction types.
 *
 * @param direction A provided direction
 * @return A direction name.
 */
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
    
    return undefined;
    
};

jzt.Direction.getShortName = function(direction) {
    switch(direction) {
        case jzt.Direction.North:
            return 'N';
        case jzt.Direction.East:
            return 'E';
        case jzt.Direction.South:
            return 'S';
        case jzt.Direction.West:
            return 'W';
    }
    return undefined;
};

/**
 * Given a direction from our Direction enumerated type, returns another
 * direction representing a clockwise rotation on 90 degrees.
 *
 * @param direction A direction.
 * @return A clockwise direction.
 */
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

/**
 * Given a direction from our Direction enumerated type, returns another direction
 * representing a random choice perpendicular to the provided one.
 * 
 * @param direction A direction.
 * @return A new direction perpendicular to the provided one, at random.
 */
jzt.Direction.randomPerpendicular = function(direction) {
    
    switch(direction) {
        case jzt.Direction.North:
        case jzt.Direction.South:
            return jzt.Direction.randomEastWest();
        default:
            return jzt.Direction.randomNorthSouth();
    }
    
};

/**
 * Returns a Point representing either North or South, at random.
 * 
 * @return A Point direction.
 */
jzt.Direction.randomNorthSouth = function() {
    return jzt.Direction.random([jzt.Direction.North, jzt.Direction.South]);
};

/**
 * Returns a Point representing either East or West, at random.
 * 
 * @return A Point direction.
 */
jzt.Direction.randomEastWest = function() {
    return jzt.Direction.random([jzt.Direction.East, jzt.Direction.West]);
};

/**
 * Returns a Point representing either North or East, at random.
 * 
 * @return A Point direction.
 */
jzt.Direction.randomNorthEast = function() {
    return jzt.Direction.random([jzt.Direction.North, jzt.Direction.East]);
};

/**
 * Returns a random direction from our Direction enumerated type from a provided array of
 * possible directions. If no such array is provided, then all directions will be considered
 * as candidates.
 *
 * @param directions An array of possible directions to choose at random
 * @return A random Point representing a Direction.
 */
jzt.Direction.random = function(directions) {
    
    // If an array of directions to pick from wasn't specified...
    if(!directions) {
        directions = [jzt.Direction.North, jzt.Direction.East, jzt.Direction.South, jzt.Direction.West];
    }
    
    // Return a random direction from our array
    return directions[Math.floor(Math.random() * directions.length)];
    
};

/**
 * Returns a Direction rotated 90 degrees counter-clockwise to a provided Direction.
 *
 * @param direction A direction
 * @return A direction rotated 90 degrees counter-clockwise.
 */
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

/**
 * Given a direction, returns a direction facing the opposite direction.
 *
 * @param direction
 * @return A Point representing an opposite direction.
 */
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

 jzt.DelayedEventScheduler = function(initialDelay, subsequentDelay) {
    this.initialDelay = initialDelay;
    this.subsequentDelay = subsequentDelay;
    this.event = undefined;
    this.nextAllowableEvent = 0;
 };

 jzt.DelayedEventScheduler.prototype.scheduleEvent = function(eventTime, event) {

    var now = Date.now();

    if(now > this.nextAllowableEvent) {
        
        if(eventTime + this.initialDelay < now) {
            this.nextAllowableEvent = now + this.subsequentDelay;
        }
        else {
            this.nextAllowableEvent = now + this.initialDelay;
        }

        this.event = event;
    }

 };

 jzt.DelayedEventScheduler.prototype.cancelEvent = function() {
    this.nextAllowableEvent = 0;
 };

 jzt.DelayedEventScheduler.prototype.takeEvent = function() {
    var result = this.event;
    this.event = undefined;
    return result;
 };
 
 /**
  * If Debug mode is on, logs all provided arguments to a console.
  */
 jzt.debug.log = function() {
     if(jzt.debug.on) {
         console.log.apply(console, arguments);
     }
 };

/**
 * Adds a property to a provided destination object as a given name and value,
 * only if the value is defined.
 *
 * @param destination A destination object 
 * @param name A name of a property
 * @param value A value to be stored.
 */
jzt.util.storeOption = function(destination, name, value) {
    if(value !== undefined) {
        destination[name] = value;
    }
};

/**
 * Generates line data between two points.
 * 
 * @param point1 A first point
 * @param point2 A second point
 * @return Line data with a points array, contains function, and forEach function.
 */
jzt.util.generateLineData = function(point1, point2) {

    var result = {};
    var dx = Math.abs(point2.x - point1.x);
    var dy = Math.abs(point2.y - point1.y);
    var sx = (point1.x < point2.x) ? 1 : -1;
    var sy = (point1.y < point2.y) ? 1 : -1;
    var err = dx-dy;
    var e2;
    var x;
    var y;

    result.points = [];

    /*
     * Returns whether or not this line data contains a provided point.
     */
    result.contains = function(point) {
        var index;
        for(index = 0; index < this.points.length; ++index) {
            if(this.points[index].equals(point)) {
                return true;
            }
        }
        return false;
    };

    /*
     * Performs a callback function for each point in this line data.
     */
    result.forEach = function(callback) {
        var index;
        if(callback && typeof callback === 'function') {
            for(index = 0; index < this.points.length; ++index) {
                callback(this.points[index]);
            }
        }
    };

    x = point1.x;
    y = point1.y;
    while(true) {
        result.points.push(new jzt.Point(x, y));
        if((x === point2.x) && (y === point2.y)) {
            return result;
        }
        e2 = 2 * err;
        if(e2 >-dy) {
            err -= dy;
            x += sx;
        }
        if(e2 < dx) {
            err += dx;
            y += sy;
        }
    }

    return result;

};

jzt.util.generateCircleData = function(point, radius) {
    return jzt.util.generateEllipseData(point, radius * 2, radius);
};

jzt.util.generateEllipseData = function(point, rx, ry) {

    var result = {};

    var rx2 = rx * rx;
    var ry2 = ry * ry;
    var twoRx2 = 2 * rx2;
    var twoRy2 = 2 * ry2;
    var p;
    var x = 0;
    var y = ry;
    var px = 0;
    var py = twoRx2 * y;
    var minMax;

    result.contains = function(point) {
        if(this[point.y]) {
            minMax = this[point.y];
            return point.x >= minMax[0] && point.x <= minMax[1];
        }
        return false;
    };

    // If there is no radius...
    if(rx === 0 && ry === 0) {

        // We should always contain the center point
        result[point.y] = [point.x, point.x];

        // Return immediately
        return result;

    }

    // Upper Region
    p = Math.round (ry2 - (rx2 * ry) + (0.25 * rx2));
    while (px < py) {
        x++;
        px += twoRy2;
        if (p < 0)
        p += ry2 + px;
        else {
        y--;
        py -= twoRx2;
        p += ry2 + px - py;
        }
        minMax = [point.x - x, point.x + x];
        result[point.y + y] = minMax;
        result[point.y - y] = minMax;
    }

    // Lower Region
    p = Math.round (ry2 * (x+0.5) * (x+0.5) + rx2 * (y-1) * (y-1) - rx2 * ry2);
    while (y > 0) {
        y--;
        py -= twoRx2;
        if (p > 0)
        p += rx2 - py;
        else {
        x++;
        px += twoRy2;
        p += rx2 - py + px;
        }
        minMax = [point.x - x, point.x + x];
        result[point.y + y] = minMax;
        result[point.y - y] = minMax;
    }

    return result;

};

jzt.util.pointsInCircle = function(point, radius) {
    return jzt.util.pointsInEllipse(point, radius * 2, radius);
};

jzt.util.pointsInEllipse = function(point, rx, ry) {

    var result = [];
    var index;
    var ellipseSegment;
    var minMax;
    var min;
    var max;
    var ellipseData = jzt.util.generateEllipseData(point, rx, ry);

    for(ellipseSegment in ellipseData) {
        if(ellipseData.hasOwnProperty(ellipseSegment)) {

            minMax = ellipseData[ellipseSegment];
            min = minMax[0];
            max = minMax[1];

            for(index = min; index <= max; ++index) {
                result.push(new jzt.Point(index, ellipseSegment));
            }

        }
    }

    return result;

};

/**
 * Retrieves a property value from a provided data object with a provided name.
 * If no such value exists, then a provided default value is returned instead.
 *
 * @param data A data object
 * @param optionName A name of a property to retrieve
 * @param defaultValue A value to be retrieved if no such property is available.
 */
jzt.util.getOption = function(data, optionName, defaultValue) {
    if(data.hasOwnProperty(optionName)) {
        return data[optionName];
    }
    return defaultValue;
};