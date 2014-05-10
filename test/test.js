var mymodule = (function(exports) {
    
    'use strict';

    function MyThing() {
    
        if(!(this instanceof MyThing)) {
            throw 'Constructor must be called with new';
        }
        
        
        
    }
    
    MyThing.prototype.doSomething = function() {
        console.log('Doing something');
    };
    
    exports.MyThing = MyThing;
    return exports;

}(mymodule || {}));