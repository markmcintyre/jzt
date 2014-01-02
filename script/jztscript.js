/**
 * JZT JZTScript
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/* jshint globalstrict: true */

"use strict";

var jztscript = jztscript || {};
  
jztscript.CommandFactory = function() {
    this.commandParser = jztscript.createCommandParser();
};

jztscript.CommandFactory.prototype.parseLine = function(line) {
    
    var assembly = new jzt.parser.Assembly(line);
    
    // If our assembly is empty, there's no need to parse
    if(assembly.tokens.length <= 0) {
        return undefined;
    }
    
    // Match our assembly
    var result = this.commandParser.completeMatch(assembly);

    if(result === undefined || result.error || result.target === undefined) {

        // If we did indeed get a result, report its error
        if(result && result.error) {
            throw result.error;
        }

        // Otherwise we've got an unknown command
        else {
            throw 'Unknown command';
        }

    };

    // Return the assembly's target
    return result.target;
    
};
  
jztscript.createCommandParser = function() {
  
    var result = new jzt.parser.Alternation();
    
    // Add all our available commands
    for(parser in jztscript.parsers) {
        if(jztscript.parsers.hasOwnProperty(parser)) {
            var parser = jztscript.parsers[parser];
            result.add(new parser());
        }
    }
    
    // Allow blank lines
    result.add(new jzt.parser.Empty());
    
    return result;
  
};

/*=============================================================
 * PARSERS
 *============================================================*/
jztscript.parserhelper = jztscript.parserhelper || {};
jztscript.parsers = jztscript.parsers || {};

/*
 * Movement Parser Helper
 *
 * command   = '#' [nameToken] DirectionExpression (Empty | Number)
 */
jztscript.parserhelper.MovementParser = function(command, nameToken, noCount) {
    
    var ns = jzt.parser;
    
    var assembler = {
        assemble: function(assembly) {

            var result;
            var token;
            var count;

            result = new command();
            
            // Get our top token
            token = assembly.stack.pop();

            // If it's a number, then that's our count
            count = parseInt(token);
            if(!isNaN(count)) {
                result.count = count;
                token = assembly.stack.pop();
            }

            // Our target is expected to be a DirectionExpression
            result.directionExpression = assembly.target;
            
            // We are the new target
            assembly.target = result;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal(nameToken)));
    result.add(new jztscript.parsers.DirectionExpressionParser());
    if(!noCount) {
        result.add(ns.optional(new ns.Number()));
    }
    result.assembler = assembler;
    return result;
    
};

/*
 * Simple Parser
 */
jztscript.parserhelper.Simple = function(command, nameToken) {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal(nameToken)));
    result.assembler = {
        assemble: function(assembly) {
            assembly.target = new command();
        }
    };
    return result;
};

jztscript.parsers.NotExpressionParser = function(expressionParser) {

    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('not')));
    result.add(expressionParser);

    result.assembler = {
        assemble: function(assembly) {
            var result = new jzt.commands.NotExpression();
            result.expression = assembly.target;
            assembly.target = result;
        }
    }

    return result;

};

/*
 * Expression Parser
 * expression = (Empty | 'not') (VariableComparisonExpression | DirectionalFlagExpression | NotExpression)
 */
 jztscript.parsers.ExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();
    var expression = new ns.Alternation();
    
    //result.add(ns.optional(new ns.Literal('not')));

    expression.add(new jztscript.parsers.NotExpressionParser(result));
    expression.add(new jztscript.parsers.VariableComparisonExpressionParser());
    expression.add(new jztscript.parsers.BlockedExpressionParser());
    expression.add(new jztscript.parsers.AlignedExpressionParser());
    expression.add(new jztscript.parsers.AdjacentExpressionParser());
    expression.add(new jztscript.parsers.ExistsExpressionParser());
    expression.add(new jztscript.parsers.PeepExpressionParser());
    result.add(expression);

    result.assembler = {
        assemble: function(assembly) {
            
            /*var result;

            // Return a 'Not' expression if applicable
            if(assembly.stack.length >= 1) {
                assembly.stack.pop();
                result = new jzt.commands.NotExpression();
                result.expression = assembly.target;
                assembly.target = result;
            }*/

            // Otherwise, we leave the target as-is.

        }
    };

    return result;

 };

/*
 * Adjacent Expression Parser
 * expression = 'adjacent' DirectionExpression
 */
jztscript.parsers.AdjacentExpressionParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('adjacent')));
    result.add(new jztscript.parsers.DirectionExpressionParser());

    result.assembler = {
        assemble: function(assembly) {
            var result = new jzt.commands.DirectionalFlagExpression();

            // User our direction expression from the assembly target
            result.directionExpression = assembly.target;

            result.flagType = 'ADJACENT';

            assembly.target = result;
        }
    };

    return result;
};

/*
 * Blocked Expression Parser
 * expression = 'blocked' DirectionalExpression
 */
jztscript.parsers.BlockedExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();


    result.add(ns.discard(new ns.Literal('blocked')));
    result.add(new jztscript.parsers.DirectionExpressionParser());

    result.assembler = {
        assemble: function(assembly) {

            var result = new jzt.commands.DirectionalFlagExpression();

            // Use our direction expression from the assembly target
            result.directionExpression = assembly.target;

            result.flagType = 'BLOCKED';

            assembly.target = result;

        }
    };

    return result;

};

/*
 * Aligned Expression Parser
 * expression = 'aligned' (Empty | DirectionalExpression)
 */
jztscript.parsers.AlignedExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('aligned')));
    result.add(ns.optional(new jztscript.parsers.DirectionExpressionParser()));
    result.assembler = {
        assemble: function(assembly) {
            var result = new jzt.commands.DirectionalFlagExpression();

            // If there's a direction expression, use it
            result.directionExpression = assembly.target;

            result.flagType = 'ALIGNED';

            assembly.target = result;
        }
    };

    return result;

};

/*
 * Peep Expression Parser
 * expression = 'peep' (Empty | Number)
 */
jztscript.parsers.PeepExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('peep')));
    result.add(ns.optional(new ns.Number()));
    result.assembler = {
        assemble: function(assembly) {
            var result = new jzt.commands.PeepExpression();

            if(assembly.stack.length > 0) {
                result.distance = parseInt(assembly.stack.pop());
            }

            assembly.target = result;
        }
    };

    return result;

};

/*
 * Exists Expression Parser
 * expression = 'exists' [Number] [Word as color] Word as thing
 */
jztscript.parsers.ExistsExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('exists')));
    result.add(ns.optional(new ns.Number()));
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {

            function parseColor(token) {
                if(jzt.colors[token] instanceof jzt.colors.Color) {
                    result.color = jzt.colors[token].lighten();
                }
                else {
                    assembly.error = 'Unrecognized color \'' + token + '\'';
                }
            }

            function parseNumber(token) {
                var count = parseInt(token);
                if(count < 0) {
                    assembly.error = 'A positive integer is required.';
                }
                else {
                    result.count = count;
                }
            }

            var result = new jzt.commands.ExistsExpression();
            var value;

            var thing = assembly.stack.pop().toUpperCase();
            if(jzt.things.ThingFactory.isKnownThing(thing)) {
                result.thing = thing;
            }
            else {
                assembly.error = 'Unrecognized thing \'' + thing + '\'';
            }

            if(assembly.stack.length >= 2) {
                parseColor(assembly.stack.pop().toUpperCase());
                parseNumber(assembly.stack.pop());
            }
            else if(assembly.stack.length >= 1) {
                value = assembly.stack.pop().toUpperCase();
                if(isNaN(value)) {
                    parseColor(value);
                }
                else {
                    parseNumber(value);
                }
            }

            assembly.target = result;

        }
    };

    return result;

};  

/*
 * Variable Comparison Expression Parser
 * expression = Word ('gt' | 'lt' | 'gte' | 'lte' | 'eq') Number
 */
 jztscript.parsers.VariableComparisonExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();
    var comparison = new ns.Alternation();

    comparison.add(new ns.Literal('gt'));
    comparison.add(new ns.Literal('lt'));
    comparison.add(new ns.Literal('gte'));
    comparison.add(new ns.Literal('lte'));
    comparison.add(new ns.Literal('eq'));

    result.add(new ns.Word());
    result.add(comparison);
    result.add(new ns.Number());

    result.assembler = {
        assemble: function(assembly) {
            var result = new jzt.commands.ComparisonExpression();
            result.numericValue = parseInt(assembly.stack.pop());
            result.operator = assembly.stack.pop().toUpperCase();
            result.counter = assembly.stack.pop().toLowerCase();
            assembly.target = result;
        }
    };

    return result;

 };

/*
 * Direction Expression Parser
 * expression = modifier* direction
 * modifier = 'cw' | 'ccw' | 'opp' | 'rndp'
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek' | 'smartseek' |
 *             'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';
 */
 jztscript.parsers.DirectionExpressionParser = function() {

    var ns = jzt.parser;
    var modifiers = jzt.commands.DirectionModifier;
    var directions = jzt.commands.Direction;
    var result;
    var directionModifier;
    var direction;
    var item;

    // Direction Modifier
    directionModifier = new ns.Alternation();
    for(item in modifiers) {
      if(modifiers.hasOwnProperty(item)) {
          directionModifier.add( new ns.Literal(item));
      }
    }

    // Direction
    direction = new ns.Alternation();
    for(item in directions) {
      if(directions.hasOwnProperty(item)) {
          direction.add( new ns.Literal(item));
      }
    }

    result = new ns.Sequence();
    result.add(ns.optional(new ns.Repetition(directionModifier)));
    result.add(direction);
    result.assembler = {
        assemble: function(assembly) {

            var result = new jzt.commands.DirectionExpression();

            // Get our top token
            var token = assembly.stack.pop();

            // This should be our direction
            result.direction = jzt.commands.Direction[token.toUpperCase()];

            // The rest of the tokens are our modifiers
            while(assembly.stack.length > 0) {
                token = assembly.stack.shift();
                result.modifiers.push(jzt.commands.DirectionModifier[token.toUpperCase()]);
            }
            
            assembly.target = result;

        }
    };

    return result;

 };
 

/*
 * Become Parser
 * command = 'become' [Word] Word
 */
 jztscript.parsers.BecomeParser = function() {

    var ns = jzt.parser;

    var assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Become();

            var thing = assembly.stack.pop().toUpperCase();
            if(jzt.things.ThingFactory.isKnownThing(thing)) {
               command.thing = thing; 
            }
            else {
                assembly.error = 'Unrecognized thing \'' + thing + '\'';
            }

            if(assembly.stack.length > 0) {
                var token = assembly.stack.pop().toUpperCase();
                if(jzt.colors[token] instanceof jzt.colors.Color) {
                    command.color = jzt.colors[token].lighten();
                }
                else {
                    assembly.error = 'Unrecognized color \'' + token + '\'';
                }
            }

            assembly.target = command;

        }
    };

    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('become')));
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.assembler = assembler;
    return result;

 };

/*
 * Change Parser
 * command = 'change' [Word] Word [Word] Word
 */
jztscript.parsers.ChangeParser = function() {

    var ns = jzt.parser;

    var assembler = {
        assemble: function(assembly) {

            var command = new jzt.commands.Change();
            var token;
            var color;

            function parseColor(colorToken) {
                if(jzt.colors.hasOwnProperty(colorToken)) {
                    return jzt.colors[colorToken].lighten();
                }
            }

            function isValidThing(thingToken) {
                return jzt.things.ThingFactory.getThingMap().hasOwnProperty(thingToken);
            }

            // Assign our new Thing
            token = assembly.stack.pop().toUpperCase();
            if(!isValidThing(token)) {
                assembly.error = 'Unrecognized Thing \'' + token + '\'';
                return;
            }
            command.newThing = token;

            // Grab our next token
            token = assembly.stack.pop().toUpperCase();

            // Attempt to parse it as a color
            color = parseColor(token);

            // If it was a color...
            if(color) {

                // Assign our new color
                command.newColor = color;

                if(assembly.stack.length <= 0) {
                    assembly.error = 'Invalid change command.';
                    return;
                }

                // The next token will be our target Thing
                token = assembly.stack.pop().toUpperCase();
                if(! isValidThing(token)) {
                    assembly.error = 'Unrecognized Thing \'' + token + '\'';
                    return;
                }
                command.targetThing = token;

            }

            // If it wasn't a color
            else {

                // The next token will be our target Thing
                if(! isValidThing(token)) {
                    assembly.error = 'Unrecognized Thing \'' + token + '\'';
                    return;
                }
                command.targetThing = token;


            }

            // If there's a token left...
            if(assembly.stack.length > 0) {

                if(assembly.stack.length <= 0) {
                    assembly.error = 'Invalid change command.';
                    return;
                }

                // It's our target color
                token = assembly.stack.pop().toUpperCase();
                command.targetColor = parseColor(token);
                if(! command.targetColor) {
                    assembly.error = 'Unrecognized color \'' + token + '\'';
                    return;
                }

            }

            assembly.target = command;


        }
    };

    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('change')));
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.assembler = assembler;

    return result;

};

/*
 * Char Parser
 * command = 'char' Number;
 */
jztscript.parsers.CharParser = function() {
    
    // Establish shorthand to cut character count
    var ns = jzt.parser;
    
    // Define our assembler
    var assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Char();
            var token = assembly.stack.pop();
            var character = parseInt(token);
            if(character < 0 || character > 255) {
                assembly.error = 'value \'' + character + '\' is out of range (0 to 255)';
            }
            command.character = character;
            assembly.target = command;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('char')));
    result.add(new ns.Number());
    result.assembler = assembler;
    return result;
    
}

/**
 * Collect Parser
 * command = 'collect'
 */
jztscript.parsers.CollectParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Collect, 'collect');
};

/*
 * Die Parser
 * command = 'die';
 */
jztscript.parsers.DieParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Die, 'die');
};

/*
 * End Parser
 * command = 'end';
 */
jztscript.parsers.EndParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.End, 'end');
};

/*
 * Give Parser
 *
 * command = 'give' Number Word
 */
jztscript.parsers.GiveParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('give')));
    result.add(new ns.Number());
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Give();
            command.counter = assembly.stack.pop().toLowerCase();
            command.amount = parseInt(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
};

/*
 * Go Parser
 * command   = 'go' modifier* direction (Empty | Number)
 * modifier  = 'cw' | 'ccw' | 'opp' | 'rndp';
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek' | 'smartseek'
 *              | 'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';
 */
jztscript.parsers.GoParser = function() {
    return jztscript.parserhelper.MovementParser(jzt.commands.Go, 'go');
};
  
/*
 * If Parser
 * command = 'if' Expression Word
 */
 jztscript.parsers.IfParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();

    result.add(ns.discard(new ns.Literal('if')));
    result.add(new jztscript.parsers.ExpressionParser());
    result.add(new ns.Word());

    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.If();
            command.label = assembly.stack.pop().toUpperCase();
            command.expression = assembly.target;
            assembly.target = command;
        }
    };
    return result;
 };

/*
 * Label Parser
 * label = ':' id;
 * id    = Word
 * 
 */
jztscript.parsers.LabelParser = function() {
    
    // Establish shorthands to cut character count
    var ns = jzt.parser;
    
    // Define our assembler
    var assembler = {
        assemble: function(assembly) {
            var label = new jzt.commands.Label();
            label.id = assembly.stack.pop().toUpperCase();
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
 * Lock Parser
 * command = 'lock'
 */
jztscript.parsers.LockParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Lock, 'lock');
};
  
/*
 * Move Parser
 *
 * command   = 'move' modifier* direction (Empty | Number);
 * modifier  = 'cw' | 'ccw' | 'opp' | 'rndp';
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek' | 'smartseek'
 *             | 'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';       
 */
jztscript.parsers.MoveParser = function() {
    return jztscript.parserhelper.MovementParser(jzt.commands.Move, 'move');    
};

/*
 * Play Parser
 * command = 'play' String
 */
jztscript.parsers.PlayParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    var assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Play();
            command.song = assembly.stack.pop();
            assembly.target = command;
        }
    };
    result.add(ns.discard(new ns.Literal('play')));
    result.add(new ns.String());
    result.assembler = assembler;
    return result;
};

/*
 * Put Parser
 * command = 'put' [DirectionExpression] [Word] Word
 */
 jztscript.parsers.PutParser = function() {

    var ns = jzt.parser;
    var result = new ns.Sequence();
    var assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Put();

            var thing = assembly.stack.pop().toUpperCase();
            if(thing === 'EMPTY') {
                command.thing = undefined;
            }
            else if(jzt.things.ThingFactory.isKnownThing(thing)) {
                command.thing = thing;
            }
            else {
                assembly.error = 'Unrecognized thing \'' + thing + '\'';
            }

            if(assembly.stack.length > 0) {
                var token = assembly.stack.pop().toUpperCase();
                if(jzt.colors[token] instanceof jzt.colors.Color) {
                    command.color = jzt.colors[token].lighten();
                }
                else {
                    assembly.error = 'Unrecognized color \'' + token + '\'';
                }
            }

            // We expect our target to be a DirectionExpression
            command.directionExpression = assembly.target;
            
            assembly.target = command;
        }
    };

    result.add(ns.discard(new ns.Literal('put')));
    result.add(new jztscript.parsers.DirectionExpressionParser());
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.assembler = assembler;

    return result;

 };

/*
 * Scroll Parser
 *
 * command = 'scroll' String (Empty | Word)
 */
jztscript.parsers.ScrollParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('scroll')));
    result.add(new ns.String());
    result.add(ns.optional(new ns.Word()));
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Scroll();
            if(assembly.stack.length >= 2) {
                command.label = assembly.stack.pop().toUpperCase();
            }
            command.text = ns.processString(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
};

/*
 * ScrollC Parser
 *
 * command = 'scrollc' String
 */
jztscript.parsers.ScrollCParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('scrollc')));
    result.add(new ns.String());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.ScrollC();
            command.text = ns.processString(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
};

/*
 * Send Parser
 *
 * command = 'send' Word Word
 */
 jztscript.parsers.SendParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('send')));
    result.add(ns.optional(new ns.Word()));
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Send();
            command.message = assembly.stack.pop().toUpperCase();
            if(assembly.stack.length > 0) {
                command.recipient = assembly.stack.pop().toUpperCase();
            }
            assembly.target = command;
        }
    };
    return result;
 };

/*
 * Set Parser
 * 
 * command = 'set' (Empty | Number) Word
 */
jztscript.parsers.SetParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('set')));
    result.add(ns.optional(new ns.Number()));
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Set();
            command.counter = assembly.stack.pop().toLowerCase();
            if(assembly.stack.length) {
                command.value = parseInt(assembly.stack.pop());
            }
            assembly.target = command;
        }
    }
    return result;
};

/*
 * Take Parser
 *
 * command = 'take' Number Word (Empty | Word)
 */
 jztscript.parsers.TakeParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('take')));
    result.add(new ns.Number());
    result.add(new ns.Word());
    result.add(ns.optional(new ns.Word()));
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Take();
            if(assembly.stack.length >= 3) {
                command.label = assembly.stack.pop().toUpperCase();
            }
            command.counter = assembly.stack.pop().toLowerCase();
            command.amount = parseInt(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
 };

/*
 * Torch Parser
 *
 * command = 'torch' Number
 */
jztscript.parsers.TorchParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('torch')));
    result.add(new ns.Number());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Torch();
            command.radius = parseInt(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
};

/*
 * Restore Parser
 */
jztscript.parsers.RestoreParser = function() {
    var ns = jzt.parser;
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('restore')));
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Restore();
            command.label = assembly.stack.pop().toUpperCase();
            assembly.target = command;
        }
    };
    return result;
};

/*
 * Say Parser
 */
jztscript.parsers.SayParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('say')));
    result.add(new ns.String());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Say();
            command.text = ns.processString(assembly.stack.pop());
            assembly.target = command;
        }
    };
    return result;
};

/*
 * Shoot Parser
 * command   = 'shoot' modifier* direction
 * modifier  = 'cw' | 'ccw' | 'opp' | 'rndp';
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek'
 *              | 'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';
 */
jztscript.parsers.ShootParser = function() {
    return jztscript.parserhelper.MovementParser(jzt.commands.Shoot, 'shoot', true);
};

/*
 * Stand Parser
 */
jztscript.parsers.StandParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Stand, 'stand');
};

/*
 * Unlock Parser
 */
jztscript.parsers.UnlockParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Unlock, 'unlock');
};

/*
 * Wait Parser
 */
jztscript.parsers.WaitParser = function() {
    
    var ns = jzt.parser;
    
    var assembler = {
        assemble: function(assembly) {
            var target = new jzt.commands.Wait();
            target.cycles = parseInt(assembly.stack.pop());
            assembly.target = target;
        }
    };
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('wait')));
    result.add(new ns.Number());
    result.assembler = assembler;
    return result;
    
};

/*
 * Walk Parser
 */
jztscript.parsers.WalkParser = function() {
    return jztscript.parserhelper.MovementParser(jzt.commands.Walk, 'walk', true);
};

/*
 * Zap Parser
 */
jztscript.parsers.ZapParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('zap')));
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.Zap();
            command.label = assembly.stack.pop().toUpperCase();
            assembly.target = command;
        }
    };
    return result;
};