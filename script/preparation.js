/**
 * JZT Preparations
 
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
(function() {
    
    'use strict';
    
    // Define Object.freeze if it hasn't already been defined so
    // non-ECMAScript 5 browsers don't freak out
    if (typeof Object.freeze !== 'function') {
        Object.freeze = function (o) {
            return o;
        };
    }
    
}());