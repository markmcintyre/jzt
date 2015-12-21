/**
 * JZT Preparations

 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var packageMetadata = require('../package.json'),
    meta = {
        version: packageMetadata.version,
        date: new Date('2015-12-21')
    };

// Define Object.freeze if it hasn't already been defined so
// non-ECMAScript 5 browsers don't freak out
if (typeof Object.freeze !== 'function') {
    Object.freeze = function (o) {
        return o;
    };
}

exports.meta = meta;
