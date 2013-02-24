window.jztscript = window.jztscript || {};
  
jztscript.CommandFactory = function() {
    this.commandParser = jztscript._createCommandParser();
};

jztscript.CommandFactory.prototype.parseLine = function(line) {
    
    var assembly = new jzt.parser.Assembly(line);
    
    // If our assembly is empty, there's no need to parse
    if(assembly.tokens.length <= 0) {
        return undefined;
    }
    
    // Match our assembly
    var result = this.commandParser.completeMatch(assembly);

    if(result == undefined || result.target == undefined) {
        throw 'Unknown command';
    };

    // Return the assembly's target
    return result.target;
    
};
  
jztscript._createCommandParser = function() {
  
    var result = new jzt.parser.Alternation();
    
    // Add all our available commands
    for(var index = 0; index < jztscript.CommandParsers.length; ++index) {
        var parser = jztscript.CommandParsers[index];
        result.add(new parser());
    }
    
    // Allow blank lines
    result.add(new jzt.parser.Empty());
    
    return result;
  
};

/*=============================================================
 * PARSERS
 *============================================================*/
 
/*
 * Char Parser
 * command = 'char' Number;
 */
jztscript.CharParser = function() {
    
    // Establish shorthand to cut character count
    var ns = jzt.parser;
    
    // Define our assembler
    var assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Char();
            var token = assembly.stack.pop();
            var character = parseInt(token);
            if(character < 0 || character > 255) {
                throw 'Char command only accepts values from 0 to 255';
            }
            command.character = character;
            assembly.target = command;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
    result.add(ns.discard(new ns.Literal('char')));
    result.add(new ns.Number());
    result.assembler = assembler;
    return result;
    
}
  
/*
 * Label Parser
 * label = ':' id;
 * id    = Word
 * 
 */
jztscript.LabelParser = function() {
    
    // Establish shorthands to cut character count
    var ns = jzt.parser;
    
    // Define our assembler
    var assembler = {
        assemble: function(assembly) {
            var label = new jzt.commands.Label();
            label.id = assembly.stack.pop();
            assembly.target = label;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal(':')));
    result.add(new ns.Word());
    result.assembler = assembler;
    return result;
    
};
  
/*
 * Move Parser
 *
 * command   = syntax1 | syntax2;
 * syntax1   = 'move' modifier* direction;
 * syntax2   = 'move' modifier* direction count;
 * modifier  = 'cw' | 'ccw' | 'opp' | 'rndp';
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek'
 *             | 'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';
 * count     = Number;            
 */
jztscript.MoveParser = function() {
    
    /* 
     * MoveCommandAssembler
     */
    var assembler = {
        assemble : function(assembly) {
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
    };
    
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
          directionModifier.add( new ns.Literal(item));
      }
    }

    // Direction
    var direction = new ns.Alternation();
    for(var item in directions) {
      if(directions.hasOwnProperty(item)) {
          direction.add( new ns.Literal(item));
      }
    }

    // Establish our literals
    result.add(ns.discard(new ns.Literal('#')));
    result.add(ns.discard(new ns.Literal('move')));
    result.add(ns.optional(new ns.Repetition(directionModifier)));
    result.add(direction);
    result.add(ns.optional(new ns.Number()));
    result.assembler = assembler;

    return result;
      
};

/*
 * Wait Parser
 */
jztscript.WaitParser = function() {
    
    var ns = jzt.parser;
    
    var assembler = {
        assemble: function(assembly) {
            var target = new jzt.commands.Wait();
            target.cycles = parseInt(assembly.stack.pop());
            assembly.target = target;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
    result.add(ns.discard(new ns.Literal('wait')));
    result.add(new ns.Number());
    result.assembler = assembler;
    return result;
    
};

jztscript.CommandParsers = [
    jztscript.CharParser,
    jztscript.LabelParser,
    jztscript.MoveParser,
    jztscript.WaitParser,
];