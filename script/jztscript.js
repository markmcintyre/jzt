window.jztscript = window.jztscript || {};
  
jztscript.CommandFactory = function() {
    this.commandParser = jztscript._createCommandParser();
};

jztscript.CommandFactory.prototype.parseLine = function(line) {
    
    var assembly = new jzt.parser.Assembly(line);
    
    // Match our assembly
    var result = this.commandParser.completeMatch(assembly);

    if(result == undefined) {
        throw 'Unknown command';
    };

    // Return the assembly's target
    return result.target;
    
};
  
/**
 * Direction Modifier Enumerated Types
 * 
 * Each direction modifier has an associated token value, a display name, and a process function.
 * The process function takes a direction and returns a final, calculated direction value.
 */
jztscript.DIRECTION_MODIFIERS = {
    CW:   {name: 'Clockwise'},
    CCW:  {name: 'Counter-clockwise'},
    OPP:  {name: 'Opposite'},
    RNDP: {name: 'Perpendicularly Random'}
};

/**
 * Direction Enumerated Types
 *
 * Each direction has an associated token value, a display name, and a process function.
 * The process function takes a JztObject and returns a final, calculated direction value.
 */
jztscript.DIRECTIONS = {
    
    SEEK:  {name: 'Toward player'},
    FLOW:  {name: 'Current orientation'},
    RAND:  {name: 'Random direction'},
    RANDF: {name: 'Random free direction'},
    RANDB: {name: 'Random blocked direction'},
    RNDEW: {name: 'Randomly East or West'},
    RNDNS: {name: 'Randomly North or South'},
    RNDNE: {name: 'Randomly North or East'},
    NORTH: {name: 'North'},
    EAST:  {name: 'East'},
    SOUTH: {name: 'South'},
    WEST:  {name: 'West'},
    N:     {name: 'North shorthand'},
    E:     {name: 'East shorthand'},
    S:     {name: 'South shorthand'},
    W:     {name: 'West shorthand'}

};
  
jztscript._createCommandParser = function() {
  
    var result = new jzt.parser.Alternation();
    
    // MOVE
    result.add(jztscript._createMoveCommandParser());
    
    return result;
  
};
  
/*
 * Move Command Parser
 *
 * command = syntax1 | syntax2;
 * syntax1 = # "move" modifier* direction
 * syntax2 = # "move" modifier* direction count
 * modifier = cw | ccw | opp | rndp;
 * direction = n | s | e | w | north | south | east | west | seek
 *            | flow | rand | randf | randb | rndns | rndew | rndne
 * count = NumberLiteral            
 */
jztscript._createMoveCommandParser = function() {
    
      // Establish shorthands to cut character count
      var ns = jzt.parser;
      var modifiers = jztscript.DIRECTION_MODIFIERS;
      var directions = jztscript.DIRECTIONS;
    
      // Our resulting command
      var result = new ns.Sequence();
      
      // Direction Modifier
      var directionModifier = new ns.Alternation();
      for(var item in modifiers) {
          if(modifiers.hasOwnProperty(item)) {
              directionModifier.add( new ns.LiteralTerminal(item));
          }
      }
      
      // Direction
      var direction = new ns.Alternation();
      for(var item in directions) {
          if(directions.hasOwnProperty(item)) {
              direction.add( new ns.LiteralTerminal(item));
          }
      }
      
      // Our resulting sequence
      result.add(new ns.LiteralTerminal('#'));
      result.add(new ns.LiteralTerminal('move'));
      result.add(jzt.parser.optional(new ns.Repetition(directionModifier)));
      result.add(direction);
      result.add(jzt.parser.optional(new jzt.parser.NumberTerminal()));
      
      return result;
      
};