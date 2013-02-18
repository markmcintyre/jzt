window.jzt = window.jzt || {};
jzt.BuiltInFactory = jzt.BuiltInFactory || {};

jzt.BuiltInFactory.create = function(name) {
    
    if( jzt.BuiltInFactory.builtIns.hasOwnProperty(name) ) {
        return new jzt.JztObject(jzt.BuiltInFactory.builtIns[name]);
    }
    
    return undefined;
    
};

jzt.BuiltInFactory.builtIns = {
    'jztWall': {spriteIndex: 219, foregroundColor: 'yellow'},
    'jztBounder': {pushable: true, spriteIndex: 254, foregroundColor: 'yellow'},
    'jztPlayer': {}
};