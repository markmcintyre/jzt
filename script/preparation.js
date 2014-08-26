/**
 * JZT Preparations

 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt;
jzt = (function (my) {

    'use strict';

    var meta = {
        version: '1.0.0ß2',
        date: new Date('2014-08-25')
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
