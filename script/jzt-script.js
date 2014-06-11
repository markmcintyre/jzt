/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
var jzt = jzt || {};
jzt.jztscript = (function(my){
 
    'use strict';
    
    var p = jzt.parser;
    var commands = my.commands;
    var colors = jzt.colors;
    
    function JztScript() {
        
        if(!(this instanceof JztScript)) {
            throw jzt.ConstructorError;
        }
        
        this.labels = [];
        this.commands = [];
    }
    
    JztScript.prototype.clone = function() {
        var result = new JztScript();
        result.labels = this.labels.slice(0);
        result.commands = this.commands.slice(0);
        return result;
    };
    
    JztScript.prototype.addLabel = function(label) {
        this.labels.push(label);
    };
    
    JztScript.prototype.addCommand = function(command) {
        this.commands.push(command);
    };
    
    JztScript.prototype.getCommand = function(index) {
        return this.commands[index];
    };
    
    function JztScriptParser(validateOnly) {

        if(!(this instanceof JztScriptParser)) {
            throw jzt.ConstructorError;
        }
        
        function createJztScriptParser() {
        
            var program;
            var line = new p.Alternation();
            line.add(createLabelParser());
            line.add(createStatementParser());
            line.add(new p.NewLine());
            program = new p.Repetition(line);
            return program;

        }
        
        function createLabelParser() {
            var label = new p.Sequence();
            label.add(new p.Literal(':'));
            label.add(new p.Word());
            label.add(new p.NewLine());
            label.assembler = createLabelAssembler();
            return label;
        }
        
        function createLabelAssembler() {
            return validateOnly ? undefined : {
                assemble: function(assembly) {
                    var label = new commands.Label(assembly.stack.pop());
                    assembly.stack.push(label);
                }
            };
        }

        function createStatementParser() {
            var statement = new p.Sequence();
            var statementOptions = new p.Alternation();
            statementOptions.add(createBecomeStatementParser());
            statementOptions.add(createChangeStatementParser());
            statementOptions.add(createCharStatementParser());
            statementOptions.add(createDieStatementParser());
            statementOptions.add(createEndStatementParser());
            statementOptions.add(createGiveStatementParser());
            statementOptions.add(createIfStatementParser());
            statementOptions.add(createLockStatementParser());
            statementOptions.add(createMoveStatementParser());
            statementOptions.add(createPlayStatementParser());
            statementOptions.add(createPutStatementParser());
            statementOptions.add(createScrollStatementParser());
            statementOptions.add(createSendStatementParser());
            statementOptions.add(createSetStatementParser());
            statementOptions.add(createTakeStatementParser());
            statementOptions.add(createThrowStarStatementParser());
            statementOptions.add(createTorchStatementParser());
            statementOptions.add(createRestoreStatementParser());
            statementOptions.add(createSayStatementParser());
            statementOptions.add(createShootStatementParser());
            statementOptions.add(createStandStatementParser());
            statementOptions.add(createUnlockStatementParser());
            statementOptions.add(createWaitStatementParser());
            statementOptions.add(createWalkStatementParser());
            statementOptions.add(createZapStatementParser());
            statement.add(statementOptions);
            statement.addDiscard(new p.NewLine());
            return statement;
        }

        function createBecomeStatementParser() {
            var become = new p.Sequence();
            become.addDiscard(new p.Literal('Become'));
            become.add(choice(createColorfulThingParser(), createThingParser()));
            become.assembler = createBecomeAssembler();
            return become;
        }

        function createBecomeAssembler() {
            return validateOnly ? undefined : {
                assemble: function(assembly) {
                    var command = new commands.BecomeCommand();
                    command.thingTemplate = assembly.stack.pop();
                    assembly.stack.push(command);
                }
            };
        }
        
        function createChangeStatementParser() {
            var change = new p.Sequence();
            change.addDiscard(new p.Literal('Change'));
            change.add(choice(createColorfulThingParser(), createThingParser()));
            change.add(choice(createColorfulThingParser(), createThingParser()));
            return change;
        }

        function createCharStatementParser() {
            var char = new p.Sequence();
            char.addDiscard(new p.Literal('Char'));
            char.add(new p.Number());
            return char;
        }

        function createDieStatementParser() {
            var die = new p.Sequence();
            die.addDiscard(new p.Literal('Die'));
            die.add(optional(new p.Literal('magnetically')));
            return die;
        }

        function createEndStatementParser() {
            var endStatement = new p.Literal('End');
            endStatement.discard = true;
            return endStatement;
        }

        function createGiveStatementParser() {
            var give = new p.Sequence();
            give.addDiscard(new p.Literal('Give'));
            give.add(new p.Number());
            give.add(new p.Word());
            return give;
        }

        function createIfStatementParser() {
            var ifStatement = new p.Sequence();
            ifStatement.addDiscard(new p.Literal('If'));
            ifStatement.add(createExpressionParser());
            ifStatement.add(new p.Word());
            return ifStatement;
        }

        function createLockStatementParser() {
            var lock = new p.Literal('Lock');
            lock.discard = true;
            return lock;
        }

        function createMoveStatementParser() {
            var move = new p.Sequence();
            var moveOptions = new p.Alternation();
            var otherwise = new p.Sequence();

            otherwise.add(new p.Literal('Otherwise'));
            otherwise.add(new p.Word());

            moveOptions.add(new p.Literal('Forcefully'));
            moveOptions.add(otherwise);

            move.addDiscard(new p.Literal('Move'));
            move.add(choice(createDirectionParser(), createCountableDirectionParser()));
            move.add(optional(moveOptions));

            return move;
        }

        function createPlayStatementParser() {
            var play = new p.Sequence();
            play.addDiscard(new p.Literal('Play'));
            play.add(new p.String());
            return play;
        }

        function createPutStatementParser() {
            var put = new p.Sequence();
            put.addDiscard(new p.Literal('Put'));
            put.add(createDirectionParser());
            put.add(choice(createThingParser(), createColorfulThingParser()));
            return put;
        }

        function createScrollStatementParser() {
            var scroll = new p.Sequence();
            scroll.addDiscard(new p.Literal('Scroll'));
            scroll.add(optional(new p.Literal('Bold')));
            scroll.add(new p.String());
            scroll.add(optional(new p.Word()));
            return scroll;
        }

        function createSendStatementParser() {
            var send = new p.Sequence();
            send.addDiscard(new p.Literal('Send'));
            send.add(new p.Word());
            send.add(new p.Word());
            return send;
        }

        function createSetStatementParser() {
            var set = new p.Sequence();
            set.addDiscard(new p.Literal('Set'));
            set.add(optional(new p.Number()));
            set.add(new p.Word());
            return set;
        }

        function createTakeStatementParser() {
            var take = new p.Sequence();
            take.addDiscard(new p.Literal('Take'));
            take.add(new p.Number());
            take.add(new p.Word());
            take.add(optional(new p.Word()));
            return take;
        }

        function createThrowStarStatementParser() {
            var throwStar = new p.Sequence();
            throwStar.addDiscard(new p.Literal('ThrowStar'));
            throwStar.add(createDirectionParser());
            return throwStar;
        }

        function createTorchStatementParser() {
            var torch = new p.Sequence();
            torch.addDiscard(new p.Literal('Torch'));
            torch.add(optional(new p.Number()));
            return torch;
        }

        function createRestoreStatementParser() {
            var restore = new p.Sequence();
            restore.addDiscard(new p.Literal('Restore'));
            restore.add(new p.Word());
            return restore;
        }

        function createSayStatementParser() {
            var say = new p.Sequence();
            say.addDiscard(new p.Literal('Say'));
            say.add(new p.String());
            return say;
        }

        function createShootStatementParser() {
            var shoot = new p.Sequence();
            shoot.addDiscard(new p.Literal('Shoot'));
            shoot.add(createDirectionParser());
            return shoot;
        }

        function createStandStatementParser() {
            var stand = new p.Literal('Stand');
            stand.discard = true;
            return stand;
        }

        function createUnlockStatementParser() {
            var unlock = new p.Literal('Unlock');
            unlock.discard = true;
            return unlock;
        }

        function createWaitStatementParser() {
            var wait = new p.Sequence();
            wait.addDiscard(new p.Literal('Wait'));
            wait.add(optional(new p.Number()));
            return wait;
        }

        function createWalkStatementParser() {
            var walk = new p.Sequence();
            walk.addDiscard(new p.Literal('Walk'));
            walk.add(createDirectionParser());
            return walk;
        }

        function createZapStatementParser() {
            var zap = new p.Sequence();
            zap.addDiscard(new p.Literal('Zap'));
            zap.add(new p.Word());
            return zap;
        }

        function createCountableDirectionParser() {
            var direction = new p.Sequence();
            direction.add(createDirectionParser());
            direction.add(new p.Number());
            return direction;
        }

        function createDirectionParser() {
            var direction = new p.Sequence();
            var modifiers = new p.Repetition(createDirectionModifierParser());
            direction.add(modifiers);
            direction.add(createDirectionTerminalParser());
            return direction;
        }

        function createDirectionModifierParser() {
            var directionModifier = new p.Alternation();
            directionModifier.add(new p.Literal('CW'));
            directionModifier.add(new p.Literal('CCW'));
            directionModifier.add(new p.Literal('OPP'));
            directionModifier.add(new p.Literal('RNDP'));
            return directionModifier;
        }

        function createDirectionTerminalParser() {
            var directionTerminal = new p.Alternation();
            directionTerminal.add(new p.Literal('SEEK'));
            directionTerminal.add(new p.Literal('SMART'));
            directionTerminal.add(new p.Literal('FLOW'));
            directionTerminal.add(new p.Literal('RAND'));
            directionTerminal.add(new p.Literal('RANDF'));
            directionTerminal.add(new p.Literal('RANDB'));
            directionTerminal.add(new p.Literal('RNDEW'));
            directionTerminal.add(new p.Literal('RNDNS'));
            directionTerminal.add(new p.Literal('RNDNE'));
            directionTerminal.add(new p.Literal('NORTH'));
            directionTerminal.add(new p.Literal('EAST'));
            directionTerminal.add(new p.Literal('SOUTH'));
            directionTerminal.add(new p.Literal('WEST'));
            directionTerminal.add(new p.Literal('N'));
            directionTerminal.add(new p.Literal('E'));
            directionTerminal.add(new p.Literal('S'));
            directionTerminal.add(new p.Literal('W'));
            return directionTerminal;
        }

        function createColorParser() {
            var color = new p.Alternation();
            color.add(new p.Literal('Black'));
            color.add(new p.Literal('Blue'));
            color.add(new p.Literal('Green'));
            color.add(new p.Literal('Cyan'));
            color.add(new p.Literal('Red'));
            color.add(new p.Literal('Magenta'));
            color.add(new p.Literal('Brown'));
            color.add(new p.Literal('White'));
            color.add(new p.Literal('Grey'));
            color.add(new p.Literal('BrightBlue'));
            color.add(new p.Literal('BrightGreen'));
            color.add(new p.Literal('BrightCyan'));
            color.add(new p.Literal('BrightRed'));
            color.add(new p.Literal('BrightMagenta'));
            color.add(new p.Literal('Yellow'));
            color.add(new p.Literal('BrightWhite'));
            color.assembler = createColorAssembler();
            return color;
        }
        
        function createColorAssembler() {
            return validateOnly ? undefined : {
                assemble: function(assembly) {
                    assembly.stack.push(colors[assembly.stack.pop().value.toUpperCase()]);
                }
            };
        }

        function createThingParser() {
            var thing = new p.Alternation();
            thing.add(new p.Literal('ActiveBomb'));
            thing.add(new p.Literal('Ammo'));
            thing.add(new p.Literal('Bear'));
            thing.add(new p.Literal('Blinker'));
            thing.add(new p.Literal('BlinkWall'));
            thing.add(new p.Literal('Bomb'));
            thing.add(new p.Literal('Boulder'));
            thing.add(new p.Literal('BreakableWall'));
            thing.add(new p.Literal('Bullet'));
            thing.add(new p.Literal('Centipede'));
            thing.add(new p.Literal('Conveyor'));
            thing.add(new p.Literal('Door'));
            thing.add(new p.Literal('Duplicator'));
            thing.add(new p.Literal('Explosion'));
            thing.add(new p.Literal('FakeWall'));
            thing.add(new p.Literal('Forest'));
            thing.add(new p.Literal('Gem'));
            thing.add(new p.Literal('Heart'));
            thing.add(new p.Literal('InvisibleWall'));
            thing.add(new p.Literal('Key'));
            thing.add(new p.Literal('Lava'));
            thing.add(new p.Literal('LineWall'));
            thing.add(new p.Literal('Lion'));
            thing.add(new p.Literal('Passage'));
            thing.add(new p.Literal('Player'));
            thing.add(new p.Literal('Pusher'));
            thing.add(new p.Literal('Ricochet'));
            thing.add(new p.Literal('River'));
            thing.add(new p.Literal('Ruffian'));
            thing.add(new p.Literal('Signpost'));
            thing.add(new p.Literal('SliderEw'));
            thing.add(new p.Literal('SliderNs'));
            thing.add(new p.Literal('Snake'));
            thing.add(new p.Literal('SolidWall'));
            thing.add(new p.Literal('Spider'));
            thing.add(new p.Literal('SpiderWeb'));
            thing.add(new p.Literal('SpinningGun'));
            thing.add(new p.Literal('Teleporter'));
            thing.add(new p.Literal('Text'));
            thing.add(new p.Literal('ThrowingStar'));
            thing.add(new p.Literal('Tiger'));
            thing.add(new p.Literal('Torch'));
            thing.add(new p.Literal('Wall'));
            thing.add(new p.Literal('Water'));
            thing.add(new p.Literal('ThingFactory'));
            thing.assembler = createThingAssembler();
            return thing;
        }
        
        function createThingAssembler() {
            return validateOnly ? undefined : {
                assemble: function(assembly) {
                    assembly.stack.push({
                        id: assembly.stack.pop().value
                    });
                }
            };
        }

        function createColorfulThingParser() {
            var colorfulThing = new p.Sequence();
            colorfulThing.add(createColorParser());
            colorfulThing.add(createThingParser());
            colorfulThing.assembler = createColorfulThingAssembler();
            return colorfulThing;
        }
        
        function createColorfulThingAssembler() {
            return validateOnly ? undefined : {
                assemble: function(assembly) {
                    var thing = assembly.stack.pop();
                    thing.color = assembly.stack.pop();
                    assembly.stack.push(thing);
                }
            };
        }

        function createExpressionParser() {
            var expression = new p.Alternation();
            expression.add(createNotExpressionParser(expression));
            expression.add(createAdjacentExpressionParser());
            expression.add(createBlockedExpressionParser());
            expression.add(createAlignedExpressionParser());
            expression.add(createPeepExpressionParser());
            expression.add(createExistsExpressionParser());
            expression.add(createTestingExpressionParser());
            return expression;
        }

        function createNotExpressionParser(expressionParser) {
            var notExpression = new p.Sequence();
            notExpression.addDiscard(new p.Literal('Not'));
            notExpression.add(expressionParser);
            return notExpression;
        }

        function createAdjacentExpressionParser() {
            var adjacentExpression = new p.Literal('Adjacent');
            adjacentExpression.discard = true;
            return adjacentExpression;
        }

        function createBlockedExpressionParser() {
            var blockedExpression = new p.Sequence();
            blockedExpression.addDiscard(new p.Literal('Blocked'));
            blockedExpression.add(createDirectionParser());
            return blockedExpression;
        }

        function createAlignedExpressionParser() {
            var alignedExpression = new p.Sequence();
            alignedExpression.addDiscard(new p.Literal('Aligned'));
            alignedExpression.add(createDirectionParser());
            return alignedExpression;
        }

        function createPeepExpressionParser() {
            var peepExpression = new p.Sequence();
            peepExpression.addDiscard(new p.Literal('Peep'));
            peepExpression.add(optional(new p.Number()));
            return peepExpression;
        }

        function createExistsExpressionParser() {
            var existsExpression = new p.Sequence();
            existsExpression.addDiscard(new p.Literal('Exists'));
            existsExpression.add(optional(new p.Number()));
            existsExpression.add(choice(createThingParser(), createColorfulThingParser()));
            return existsExpression;
        }

        function createTestingExpressionParser() {
            var testingExpression = new p.Sequence();
            var operator = new p.Alternation();
            operator.add(new p.Literal('<'));
            operator.add(new p.Literal('<='));
            operator.add(new p.Literal('>'));
            operator.add(new p.Literal('>='));
            operator.add(new p.Literal('='));
            testingExpression.add(new p.Word());
            testingExpression.add(operator);
            testingExpression.add(new p.Number());
            return testingExpression;
        }

        function optional(parser) {
            return choice(parser, new p.Empty());
        }

        function choice(parserOne, parserTwo) {
            var result = new p.Alternation();
            result.add(parserOne);
            result.add(parserTwo);
            return result;
        }
        
        this.assemble = !validateOnly;
        this.jztscript = createJztScriptParser();
        
    }
    
    JztScriptParser.prototype.parse = function(script) {
        
        var lexer;
        var tokens;
        var assembly;
        var result;
        
        // If our script doesn't already end in a newline, add it now
        if(script.charAt(script.length-1) !== '\n') {
            script += '\n';
        }
        
        lexer = new jzt.lexer.Lexer(script);
        tokens = lexer.tokenizeAll();
        assembly = new p.Assembly(tokens);
        assembly.target = new JztScript();
        result = this.jztscript.completeMatch(assembly);
        
        if(result === undefined) {
            throw 'Catestrophic script error.';
        }
        
        result.target.addCommand( result.stack.pop() );
        
        return result.target;
        
    };
    
    my.JztScriptParser = JztScriptParser;
    my.JztScript = JztScript;
    return my;
 
}(jzt.jztscript || {}));