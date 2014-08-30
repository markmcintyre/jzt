/**
 * JZT Basic
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint vars:true */

var jzt;
jzt = (function (my) {

    'use strict';

    var ConstructorError = 'Constructor must be called with new.';
    var Direction;

    /**
     * Point represents a point on a cartesian plane.
     *
     * @param x An x coordinate.
     * @param y A y coordinate.
     */
    function Point(x, y) {

        if (!(this instanceof Point)) {
            throw ConstructorError;
        }

        this.x = x;
        this.y = y;
    }

    /**
     * Creates a new Point with identical values to this one.
     *
     * @return A Point.
     */
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };

    /**
     * Adds a provided point to this point, and returns the result.
     *
     * @param other Another point to add to this one.
     * @return A new point with the added value.
     */
    Point.prototype.add = function (other) {
        return new Point(this.x + other.x, this.y + other.y);
    };

    /**
     * Subtracts a provided point from this point and returns the result.
     *
     * @param other Another point to subtract from this one.
     * @return A new point with the subtracted value.
     */
    Point.prototype.subtract = function (other) {
        return new Point(this.x - other.x, this.y - other.y);
    };

    /**
     * Returns whether or not this point is directly adjacent to a provided point.
     *
     * @param other Another point to test for adjacency
     * @return true if a provided point is adjacent, false otherwise
     */
    Point.prototype.adjacent = function (other) {

        var xDeviance = Math.abs(this.x - other.x);
        var yDeviance = Math.abs(this.y - other.y);

        return !(xDeviance > 1 || yDeviance > 1);

    };

    /**
     * Retrieves whether or not a provided point is aligned with this one, within a given
     * spread threshold.
     *
     * @param other A point to test for alignment.
     * @param spread A spread threshold to allow for in the alignement calculation.
     * @return true if a provided point is aligned with this one, false otherwise.
     */
    Point.prototype.aligned = function (other, spread, direction) {
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
    Point.prototype.directionTo = function (other, axis) {

        var xDistance = this.x - other.x;
        var yDistance = this.y - other.y;

        // There is no direction to the same point
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

    };

    Point.prototype.compareTo = function (other) {
        return this.x === other.x ? this.y - other.y : this.x - other.x;
    };

    /**
     * Returns whether or not this Point is equal in value to another point.
     *
     * @param other A point to test for equality.
     * @return true if another point is equal in value to this point, false otherwise.
     */
    Point.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };

    /**
     * Returns a string representation of this point.
     *
     * @return A string representation of this point.
     */
    Point.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };

    /**
     * PointSet represents a set of Point instances. This set can be sorted
     * and indexed.
     */
    function PointSet() {

        if (!(this instanceof PointSet)) {
            throw jzt.ConstructorError;
        }

        this.points = [];
        this.sorted = false;
    }

    PointSet.prototype.add = function (point) {
        if (!this.contains(point)) {
            this.points.push(point);
            this.sorted = false;
        }
    };

    PointSet.prototype.sortPoints = function () {
        this.points.sort(function (a, b) {
            return a.compareTo(b);
        });
        this.sorted = true;
    };

    PointSet.prototype.contains = function (point) {
        return this.indexOf(point) >= 0;
    };

    PointSet.prototype.indexOf = function (point) {

        var minIndex = 0;
        var maxIndex = this.points.length - 1;
        var middle;

        if (!this.sorted) {
            this.sortPoints();
        }

        while (maxIndex >= minIndex) {
            middle = minIndex + (Math.round((maxIndex - minIndex) / 2));

            if (this.points[middle].compareTo(point) < 0) {
                minIndex = middle + 1;
            } else if (this.points[middle].compareTo(point) > 0) {
                maxIndex = middle - 1;
            } else {
                return middle;
            }

        }

        return -1;

    };

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
     * @param direction A provided direction
     * @return A direction name.
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

    function DelayedEventScheduler(initialDelay, subsequentDelay) {

        if (!(this instanceof DelayedEventScheduler)) {
            throw ConstructorError;
        }

        this.initialDelay = initialDelay;
        this.subsequentDelay = subsequentDelay;
        this.event = undefined;
        this.nextAllowableEvent = 0;
    }

    DelayedEventScheduler.prototype.scheduleEvent = function (eventTime, event) {

        var now = Date.now();

        if (now > this.nextAllowableEvent) {

            if (eventTime + this.initialDelay < now) {
                this.nextAllowableEvent = now + this.subsequentDelay;
            } else {
                this.nextAllowableEvent = now + this.initialDelay;
            }

            this.event = event;
        }

    };

    DelayedEventScheduler.prototype.cancelEvent = function () {
        this.event = undefined;
        this.nextAllowableEvent = 0;
    };

    DelayedEventScheduler.prototype.takeEvent = function () {
        var result = this.event;
        this.event = undefined;
        return result;
    };

    /**
     * NotificationListener
     */
    function NotificationListener() {

        if (!(this instanceof NotificationListener)) {
            throw ConstructorError;
        }

        this.notifications = [];
    }

    NotificationListener.prototype.addNotification = function (type, message) {
        this.notifications.push({type: type, message: message, timestamp: Date.now()});
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

        var result = {};
        var dx = Math.abs(point2.x - point1.x);
        var dy = Math.abs(point2.y - point1.y);
        var sx = (point1.x < point2.x) ? 1 : -1;
        var sy = (point1.y < point2.y) ? 1 : -1;
        var err = dx - dy;
        var e2;
        var x;
        var y;

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

    utilities.generateCircleData = function (point, radius) {
        return utilities.generateEllipseData(point, radius * 2, radius);
    };

    utilities.generateEllipseData = function (point, rx, ry) {

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

    utilities.pointsInCircle = function (point, radius) {
        return utilities.pointsInEllipse(point, radius * 2, radius);
    };

    utilities.pointsInEllipse = function (point, rx, ry) {

        var result = [];
        var index;
        var ellipseSegment;
        var minMax;
        var min;
        var max;
        var ellipseData = utilities.generateEllipseData(point, rx, ry);

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

    /**
     * Retrieves a property value from a provided data object with a provided name.
     * If no such value exists, then a provided default value is returned instead.
     *
     * @param data A data object
     * @param optionName A name of a property to retrieve
     * @param defaultValue A value to be retrieved if no such property is available.
     */
    utilities.getOption = function (data, optionName, defaultValue) {
        if (data.hasOwnProperty(optionName)) {
            return data[optionName];
        }
        return defaultValue;
    };

    my.Point = Point;
    my.PointSet = PointSet;
    my.Direction = Direction;
    my.DelayedEventScheduler = DelayedEventScheduler;
    my.NotificationListener = NotificationListener;
    my.util = utilities;
    my.ConstructorError = ConstructorError;

    return my;

}(jzt || {}));
