window.jzt = window.jzt || {};
jzt.BuiltInFactory = jzt.BuiltInFactory || {};

jzt.BuiltInFactory.create = function(name) {
    
    if( jzt.BuiltInFactory.builtIns.hasOwnProperty(name) ) {
        return new jzt.JztObject(jzt.BuiltInFactory.builtIns[name]);
    }
    
    return undefined;
    
};

jzt.BuiltInFactory.builtIns = {
    'jztWall': {},
    'jztBounder': {pushable: true},
    'jztPlayer': {
        foregroundColor: '#00ffff'
    }
};