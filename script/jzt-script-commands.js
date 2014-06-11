/**
 * JZTScript Commands
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt = jzt || {};
jzt.jztscript = jzt.jztscript || {};
jzt.jztscript.commands = (function(my){
    
    'use strict';
    
    function Label(name) {
        
        if(!(this instanceof Label)) {
            throw jzt.ConstructorError;
        }
        
        this.name = name;
    }
    
    function BecomeCommand() {
        
    }
    
    my.BecomeCommand = BecomeCommand;
    my.Label = Label;
    return my;
    
}(jzt.jztscript.commands || {}));