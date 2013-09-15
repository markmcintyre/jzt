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

    if(result === undefined || result.target === undefined) {
        throw 'Unknown command';
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
    result.add(ns.discard(new ns.Literal('#')));
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
    result.add(ns.discard(new ns.Literal('#')));
    result.add(ns.discard(new ns.Literal(nameToken)));
    result.assembler = {
        assemble: function(assembly) {
            assembly.target = new command();
        }
    };
    return result;
};

/*
 * Expression Parser
 * (Word ('gt' | 'gte' | 'lt' | 'lte' | 'eq') Number) | 
 * ('blocked' DirectionExpression) |
 * ('aligned' DirectionExpression) |
 * ('not' Expression)
 */
 /*jztscript.parsers.ExpressionParser = function() {

    var ns = jzt.parser;
    var result = new ns.Alternation();
    var testCondition = new ns.Alternation();
    var mathExpression = new ns.Sequence();
    var blockedExpression = new ns.Sequence();
    var alignedExpression = new ns.Sequence();
    var notExpression = new ns.Sequence();

    mathExpression.add(new ns.Word());
    testCondition.add(new ns.Literal('gt'));
    testCondition.add(new ns.Literal('gte'));
    testCondition.add(new ns.Literal('lt'));
    testCondition.add(new ns.Literal('lte'));
    testCondition.add(new ns.Literal('eq'));
    mathExpression.add(testCondition);
    mathExpression.assembler = {
        assemble: function(assembly) {

        }
    };
    
    blockedExpression.add(new ns.Literal('blocked'));
    blockedExpression.add(new ns.DirectionExpressionParser());

    alignedExpression.add(new ns.Literal('aligned'));
    alignedExpression.add(new ns.DirectionExpressionParser());

    notExpression.add(new ns.Literal('not'));
    notExpression.add(new ns.ExpressionParser());

    result.add(matchExpression);
    result.add(blockedExpression);
    result.add(alignedExpression);
    result.add(notExpression);

    result.assembler = {
        assemble: function(assembly) {

        }
    };

 };*/

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
 * Die Parser
 * command = '#' 'die';
 */
jztscript.parsers.DieParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.Die, 'die');
};

/*
 * End Parser
 * command = '#' 'end';
 */
jztscript.parsers.EndParser = function() {
    return jztscript.parserhelper.Simple(jzt.commands.End, 'end');
};

/*
 * Give Parser
 *
 * command = '#' 'give' Number Word
 */
jztscript.parsers.GiveParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
 * command   = '#' 'go' modifier* direction (Empty | Number)
 * modifier  = 'cw' | 'ccw' | 'opp' | 'rndp';
 * direction = 'n' | 's' | 'e' | 'w' | 'north' | 'south' | 'east' | 'west' | 'seek' | 'smartseek'
 *              | 'flow' | 'rand' | 'randf' | 'randb' | 'rndns' | 'rndew' | 'rndne';
 */
jztscript.parsers.GoParser = function() {
    return jztscript.parserhelper.MovementParser(jzt.commands.Go, 'go');
};
  
/*
 * If Parser
 * command = '#' 'if' Word ('gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq') Number Word
 */
 jztscript.parsers.IfParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    var test = new ns.Alternation();
    result.add(ns.discard(new ns.Literal('#')));
    result.add(ns.discard(new ns.Literal('if')));
    result.add(new ns.Word());
    test.add(new ns.Literal('gt'));
    test.add(new ns.Literal('gte'));
    test.add(new ns.Literal('lt'));
    test.add(new ns.Literal('lte'));
    test.add(new ns.Literal('eq'));
    test.add(new ns.Literal('neq'));
    result.add(test);
    result.add(new ns.Number());
    result.add(new ns.Word());
    result.assembler = {
        assemble: function(assembly) {
            var command = new jzt.commands.If();
            command.label = assembly.stack.pop().toUpperCase();
            command.amount = parseInt(assembly.stack.pop());
            command.test = assembly.stack.pop().toUpperCase();
            command.counter = assembly.stack.pop().toLowerCase();
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
 * command = '#' 'lock'
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
 * Scroll Parser
 *
 * command = '#' 'scroll' String (Empty | Word)
 */
jztscript.parsers.ScrollParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
 * Send Parser
 *
 * command = '#' 'send' Word Word
 */
 jztscript.parsers.SendParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
 * command = '#' 'set' (Empty | Number) Word
 */
jztscript.parsers.SetParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
 * command = '#' 'take' Number Word (Empty | Word)
 */
 jztscript.parsers.TakeParser = function() {
    var ns = jzt.parser;
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
 * Restore Parser
 */
jztscript.parsers.RestoreParser = function() {
    var ns = jzt.parser;
    
    var result = new ns.Sequence();
    result.add(ns.discard(new ns.Literal('#')));
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
    result.add(ns.discard(new ns.Literal('#')));
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
 * command   = '#' 'shoot' modifier* direction
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
    result.add(ns.discard(new ns.Literal('#')));
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
    result.add(ns.discard(new ns.Literal('#')));
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