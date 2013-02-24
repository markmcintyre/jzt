window.jzt = window.jzt || {};
jzt.BuiltInFactory = jzt.BuiltInFactory || {};

jzt.BuiltInFactory.create = function(name) {
    
    if( jzt.BuiltInFactory.builtIns.hasOwnProperty(name) ) {
        return new jzt.JztObject(jzt.BuiltInFactory.builtIns[name]);
    }
    
    return undefined;
    
};

jzt.BuiltInFactory.builtIns = {
    'jztWall': {spriteIndex: 178, color: '0E'},
    'jztBounder': {pushable: true, spriteIndex: 254, color: '0E'},
    'jztPlayer': {}
};