/**
 * JZT Preparations

 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt;
jzt = (function (my) {

    'use strict';

    var meta = {
        version: '1.0.2',
        date: new Date('2015-01-04')
    };

    // Define Object.freeze if it hasn't already been defined so
    // non-ECMAScript 5 browsers don't freak out
    if (typeof Object.freeze !== 'function') {
        Object.freeze = function (o) {
            return o;
        };
    }

    my.meta = meta;

    return my;

}(jzt || {}));
