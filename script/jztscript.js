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
    
    /* 
     * MoveCommandAssembler
     */
    var assembler = function() {}
    assembler.prototype.assemble = function(assembly) {
        var command = new jzt.commands.Move();
        
        // Get our top token
        var token = assembly.stack.pop();
        
        // If it's a number, then that's our count
        var count = parseInt(token);
        if(!isNaN(count)) {
            command.count = count;
            token = assembly.stack.pop();
        }
        
        // The next token is our direction
        command.direction = jzt.commands.Direction[token.toUpperCase()];
        
        // The rest of the tokens are our modifiers
        while(assembly.stack.length > 0) {
            token = assembly.stack.shift();
            command.modifiers.push(jzt.commands.DirectionModifier[token.toUpperCase()]);
        }
        
        assembly.target = command;
        
    }
    
    // Establish shorthands to cut character count
    var ns = jzt.parser;
    var modifiers = jzt.commands.DirectionModifier;
    var directions = jzt.commands.Direction;

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

    // Establish our literals
    result.add(ns.discard(new ns.LiteralTerminal('#')));
    result.add(ns.discard(new ns.LiteralTerminal('move')));
    result.add(ns.optional(new ns.Repetition(directionModifier)));
    result.add(direction);
    result.add(ns.optional(new ns.NumberTerminal()));
    result.assembler = new assembler();

    return result;
      
};