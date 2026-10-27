/**
 * JZT Basic
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';
import { DelayedEventScheduler } from './basic/DelayedEventScheduler.js';
import { NotificationListener } from './basic/NotificationListener.js';

let Direction;

/**
 * Point represents a point on a cartesian plane.
 *
 * @param x An x coordinate.
 * @param y A y coordinate.
 */
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }

    adjacent(other) {
        var xDeviance = Math.abs(this.x - other.x),
            yDeviance = Math.abs(this.y - other.y);
        return !(xDeviance > 1 || yDeviance > 1);
    }

    aligned(other, spread, direction) {
        spread = spread === undefined ? 1 : spread;
        if (!direction) {
            return (Math.abs(this.x - other.x) < spread) || (Math.abs(this.y - other.y) < spread);
        }
        if (direction === Direction.North) {
            return (other.y < this.y) && Math.abs((this.x - other.x)) < spread;
        }
        if (direction === Direction.South) {
            return (other.y > this.y) && Math.abs((this.x - other.x)) < spread;
        }
        if (direction === Direction.East) {
            return (other.x > this.x) && Math.abs((this.y - other.y)) < spread;
        }
        if (direction === Direction.West) {
            return (other.x < this.x) && Math.abs((this.y - other.y)) < spread;
        }
        return undefined;
    }

    directionTo(other, axis) {
        var xDistance = this.x - other.x,
            yDistance = this.y - other.y;
        if (xDistance === 0 && yDistance === 0) {
            return undefined;
        }
        if (axis === undefined) {
            if (xDistance === 0) {
                axis = 'y';
            } else if (yDistance === 0) {
                axis = 'x';
            } else {
                axis = (Math.floor(Math.random() * 2)) ? 'x' : 'y';
            }
        }
        if (axis === 'x') {
            if (xDistance === 0) {
                return undefined;
            }
            return xDistance < 0 ? Direction.East : Direction.West;
        }
        if (yDistance === 0) {
            return undefined;
        }
        return yDistance < 0 ? Direction.South : Direction.North;
    }

    compareTo(other) {
        return this.x === other.x ? this.y - other.y : this.x - other.x;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    toString() {
        return '(' + this.x + ', ' + this.y + ')';
    }
}


/**
 * Direction is an enumerated type representing each of the four possible directions
 * on a tile-based grid.
 */
Direction = {
    North: new Point(0, -1),
    East: new Point(1, 0),
    South: new Point(0, 1),
    West: new Point(-1, 0)
};

/**
 * Performs a provided callback function for each possible direction on a tile-based
 * grid. The callback function will be given a single parameter containing the direction
 * being iterated.
 *
 * @param callback A callback function to be executed.
 */
Direction.each = function (callback) {
    callback(Direction.North);
    callback(Direction.East);
    callback(Direction.South);
    callback(Direction.West);
};

/**
 * Retrieves a Point representing a direction from a provided name.
 *
 * @param name A name of a direction
 * @return A Point representing a direction.
 */
Direction.fromName = function (name) {
    switch (name) {
    case 'N':
    case 'North':
        return Direction.North;
    case 'E':
    case 'East':
        return Direction.East;
    case 'S':
    case 'South':
        return Direction.South;
    case 'W':
    case 'West':
        return Direction.West;
    default:
        return undefined;
    }
};

/**
 * Retrieves a name for a provided Point representing a direction from our
 * enumerated direction types.
 *
 * @param {object} direction - A provided direction
 * @return {string} - A direction name.
 */
Direction.getName = function (direction) {

    switch (direction) {
    case Direction.North:
        return 'North';
    case Direction.East:
        return 'East';
    case Direction.South:
        return 'South';
    case Direction.West:
        return 'West';
    }

    return undefined;

};

/**
 * Retrieves a 'short' name for a provided Point representing a direction from
 * our enumerated direction types.
 *
 * @param {object} direction - A provided direction.
 * @param {string} - A direction name
 */
Direction.getShortName = function (direction) {

    switch (direction) {
    case Direction.North:
        return 'N';
    case Direction.East:
        return 'E';
    case Direction.South:
        return 'S';
    case Direction.West:
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
Direction.clockwise = function (direction) {

    switch (direction) {
    case Direction.North:
        return Direction.East;
    case Direction.East:
        return Direction.South;
    case Direction.South:
        return Direction.West;
    case Direction.West:
        return Direction.North;
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
Direction.randomPerpendicular = function (direction) {

    switch (direction) {
    case Direction.North:
    case Direction.South:
        return Direction.randomEastWest();
    default:
        return Direction.randomNorthSouth();
    }

};

/**
 * Returns a Point representing either North or South, at random.
 *
 * @return A Point direction.
 */
Direction.randomNorthSouth = function () {
    return Direction.random([Direction.North, Direction.South]);
};

/**
 * Returns a Point representing either East or West, at random.
 *
 * @return A Point direction.
 */
Direction.randomEastWest = function () {
    return Direction.random([Direction.East, Direction.West]);
};

/**
 * Returns a Point representing either North or East, at random.
 *
 * @return A Point direction.
 */
Direction.randomNorthEast = function () {
    return Direction.random([Direction.North, Direction.East]);
};

/**
 * Returns a random direction from our Direction enumerated type from a provided array of
 * possible directions. If no such array is provided, then all directions will be considered
 * as candidates.
 *
 * @param directions An array of possible directions to choose at random
 * @return A random Point representing a Direction.
 */
Direction.random = function (directions) {

    // If an array of directions to pick from wasn't specified...
    if (!directions) {
        directions = [Direction.North, Direction.East, Direction.South, Direction.West];
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
Direction.counterClockwise = function (direction) {

    switch (direction) {
    case Direction.North:
        return Direction.West;
    case Direction.West:
        return Direction.South;
    case Direction.South:
        return Direction.East;
    case Direction.East:
        return Direction.North;
    }

    return undefined;

};

/**
 * Given a direction, returns a direction facing the opposite direction.
 *
 * @param direction
 * @return A Point representing an opposite direction.
 */
Direction.opposite = function (direction) {

    switch (direction) {
    case Direction.North:
        return Direction.South;
    case Direction.East:
        return Direction.West;
    case Direction.South:
        return Direction.North;
    case Direction.West:
        return Direction.East;
    }

    return undefined;

};


/**
 * An object to store utility functions.
 */
var utilities = {};

/**
 * Adds a property to a provided destination object as a given name and value,
 * only if the value is doesn't match a provided default.
 *
 * @param destination A destination object
 * @param name A name of a property
 * @param value A value to be stored.
 * @param defaultValue A default value.
 */
utilities.storeOption = function (destination, name, value, defaultValue) {
    if (value !== defaultValue) {
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
utilities.generateLineData = function (point1, point2) {

    var result = {},
        dx = Math.abs(point2.x - point1.x),
        dy = Math.abs(point2.y - point1.y),
        sx = (point1.x < point2.x) ? 1 : -1,
        sy = (point1.y < point2.y) ? 1 : -1,
        err = dx - dy,
        e2,
        x,
        y;

    result.points = [];

    /*
     * Returns whether or not this line data contains a provided point.
     */
    result.contains = function (point) {
        var index;
        for (index = 0; index < this.points.length; index += 1) {
            if (this.points[index].equals(point)) {
                return true;
            }
        }
        return false;
    };

    /*
     * Performs a callback function for each point in this line data.
     */
    result.forEach = function (callback) {
        var index;
        if (callback && typeof callback === 'function') {
            for (index = 0; index < this.points.length; index += 1) {
                callback(this.points[index]);
            }
        }
    };

    x = point1.x;
    y = point1.y;
    while (true) {
        result.points.push(new Point(x, y));
        if ((x === point2.x) && (y === point2.y)) {
            return result;
        }
        e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }

    return result;

};

/**
 * Generates a circle given a center point and a radius to surround it.
 * Note that since tiles are twice as high as they are wide, the circle
 * is adjusted to have double the width as the height.
 *
 * @param {object} point - A center point
 * @param {number} radius - A radius
 * @return {object} - An ellipse object representing the tiles covered by an ellipse
 */
utilities.generateCircleData = function (point, radius) {
    return utilities.generateEllipseData(point, radius * 2, radius);
};

/**
 * Generates an ellipse given a center point, an X radius, and a Y radius.
 *
 * @param {object} point - A center point
 * @param {number} rx - An X radius
 * @param {number} ry - A Y radius
 * @return {object} - An ellipse object representing the tiles covered by an ellipse
 */
utilities.generateEllipseData = function (point, rx, ry) {

    var result = {},
        rx2 = rx * rx,
        ry2 = ry * ry,
        twoRx2 = 2 * rx2,
        twoRy2 = 2 * ry2,
        p,
        x = 0,
        y = ry,
        px = 0,
        py = twoRx2 * y,
        minMax;

    /**
     * Retrieves whether or not a provided point is covered by this
     * ellipse.
     *
     * @param {object} point - A point to test
     * @return {boolean} - True if the provided point is inside this ellipse, false otherwise
     */
    result.contains = function (point) {
        if (this[point.y]) {
            minMax = this[point.y];
            return point.x >= minMax[0] && point.x <= minMax[1];
        }
        return false;
    };

    // If there is no radius...
    if (rx === 0 && ry === 0) {

        // We should always contain the center point
        result[point.y] = [point.x, point.x];

        // Return immediately
        return result;

    }

    // Upper Region
    p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
    while (px < py) {
        x += 1;
        px += twoRy2;
        if (p < 0) {
            p += ry2 + px;
        } else {
            y -= 1;
            py -= twoRx2;
            p += ry2 + px - py;
        }
        minMax = [point.x - x, point.x + x];
        result[point.y + y] = minMax;
        result[point.y - y] = minMax;
    }

    // Lower Region
    p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
    while (y > 0) {
        y -= 1;
        py -= twoRx2;
        if (p > 0) {
            p += rx2 - py;
        } else {
            x += 1;
            px += twoRy2;
            p += rx2 - py + px;
        }
        minMax = [point.x - x, point.x + x];
        result[point.y + y] = minMax;
        result[point.y - y] = minMax;
    }

    return result;

};

/**
 * Retrieves an array of points that fall within a defined circle with
 * a provided center point and radius.
 *
 * @param {object} point - A center point
 * @param {number} radius - A radius
 * @return {object[]} - An array of points
 */
utilities.pointsInCircle = function (point, radius) {
    return utilities.pointsInEllipse(point, radius * 2, radius);
};

/**
 * Retrieves an array of points that fall within a defined ellipse with
 * a provided center point and provided x and y radius..
 *
 * @param {object} point - A center point
 * @param {number} rx - An X radius
 * @param {number} ry - A Y radius
 * @return {object[]} - An array of points
 */
utilities.pointsInEllipse = function (point, rx, ry) {

    var result = [],
        index,
        ellipseSegment,
        minMax,
        min,
        max,
        ellipseData = utilities.generateEllipseData(point, rx, ry);

    for (ellipseSegment in ellipseData) {
        if (ellipseData.hasOwnProperty(ellipseSegment)) {

            minMax = ellipseData[ellipseSegment];
            min = minMax[0];
            max = minMax[1];

            for (index = min; index <= max; index += 1) {
                result.push(new Point(index, ellipseSegment));
            }

        }
    }

    return result;

};

export { Point, Direction, DelayedEventScheduler, NotificationListener, utilities };
