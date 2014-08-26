/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint vars: true */

var jzt;
jzt = jzt || {};
jzt.jztscript = (function (my) {

    'use strict';

    var Literal = jzt.parser.Literal;
    var Alternation = jzt.parser.Alternation;
    var Empty = jzt.parser.Empty;
    var Sequence = jzt.parser.Sequence;
    var Repetition = jzt.parser.Repetition;
    var ParserNumber = jzt.parser.Number;
    var Word = jzt.parser.Word;
    var NewLine = jzt.parser.NewLine;
    var Assembly = jzt.parser.Assembly;
    var ParserString = jzt.parser.String;
    var jztLexer = jzt.lexer;
    var commands = my.commands;
    var colors = jzt.colors;

    /**
     * JztScriptParser
     */
    function JztScriptParser(validateOnly) {

        if (!(this instanceof JztScriptParser)) {
            throw jzt.ConstructorError;
        }

        function popAllTokensUntil(assembly, tokenName, tokenValue, discardFence) {

            var result = [];
            var top = assembly.peek();

            function matches(token, tokenName, tokenValue) {
                return token && token.name === tokenName.toUpperCase() && token.value && token.value.toUpperCase() === tokenValue.toUpperCase();
            }

            while (!matches(top, tokenName, tokenValue)) {
                result.unshift(assembly.pop());
                top = assembly.peek();
            }

            if (matches(top, tokenName, tokenValue) && discardFence) {
                assembly.pop();
            }

            return result;

        }

        function choice(parserOne, parserTwo) {
            var result = new Alternation();
            result.add(parserOne);
            result.add(parserTwo);
            return result;
        }

        function optional(parser) {
            return choice(parser, new Empty());
        }

        /**
         * Creates an Assembler object with a provided assemble function
         * definition if validateOnly is not set.
         */
        function createAssembler(assemblerFunction) {
            return validateOnly ? undefined : {
                assemble: assemblerFunction
            };
        }

        /**
         * Direction Modifier Parser
         * Creates and returns a 'direction modifier' parser.
         * @return A 'direction modifier' parser.
         */
        function createDirectionModifierParser() {
            var directionModifier = new Alternation();

            // Add direction modifier options
            directionModifier.add(new Literal('CW'));
            directionModifier.add(new Literal('CCW'));
            directionModifier.add(new Literal('OPP'));
            directionModifier.add(new Literal('RNDP'));

            // Create assembler
            directionModifier.assembler = createAssembler(function (assembly) {
                assembly.push(commands.DirectionModifier[assembly.pop().value.toUpperCase()]);
            });

            return directionModifier;
        }

        /**
         * Direction Terminal Parser
         * Creates and returns a 'direction terminal' parser.
         * @return A 'direction terminal' parser.
         */
        function createDirectionTerminalParser() {
            var directionTerminal = new Alternation();

            // Add direction terminal options
            // TODO: Can we get this from basic.js?
            directionTerminal.add(new Literal('SEEK'));
            directionTerminal.add(new Literal('SMART'));
            directionTerminal.add(new Literal('FLOW'));
            directionTerminal.add(new Literal('RAND'));
            directionTerminal.add(new Literal('RANDF'));
            directionTerminal.add(new Literal('RANDB'));
            directionTerminal.add(new Literal('RNDEW'));
            directionTerminal.add(new Literal('RNDNS'));
            directionTerminal.add(new Literal('RNDNE'));
            directionTerminal.add(new Literal('NORTH'));
            directionTerminal.add(new Literal('EAST'));
            directionTerminal.add(new Literal('SOUTH'));
            directionTerminal.add(new Literal('WEST'));
            directionTerminal.add(new Literal('N'));
            directionTerminal.add(new Literal('E'));
            directionTerminal.add(new Literal('S'));
            directionTerminal.add(new Literal('W'));

            // Create assembler
            directionTerminal.assembler = createAssembler(function (assembly) {
                assembly.push(commands.Direction[assembly.pop().value.toUpperCase()]);
            });

            return directionTerminal;
        }

        /**
         * Direction Parser
         * Creates and returns a 'direction' parser.
         * @return A 'direction' parser.
         */
        function createDirectionParser() {
            var direction = new Sequence();
            var modifiers = new Repetition(createDirectionModifierParser());
            direction.add(modifiers);
            direction.add(createDirectionTerminalParser());

            // Add assembler
            direction.assembler = createAssembler(function (assembly) {

                var directionExpression = new commands.DirectionExpression(assembly.pop());

                while (assembly.peek() && assembly.peek().type === 'modifier') {
                    directionExpression.modifiers.unshift(assembly.pop());
                }

                assembly.push(directionExpression);

            });

            return direction;
        }

        /**
         * Countable Direction Parser
         * Creates and returns a 'countable direction' parser.
         * @return A 'countable direction' parser.
         */
        function createCountableDirectionParser() {
            var direction = new Sequence();
            direction.add(createDirectionParser());
            direction.add(new ParserNumber());
            direction.assembler = createAssembler(function (assembly) {
                var count = assembly.pop().value;
                assembly.peek().count = count;
            });
            return direction;
        }

        /**
         * Color Parser
         * Creates and returns a 'color' parser.
         * @return A 'color' parser.
         */
        function createColorParser() {
            var color = new Alternation();

            // Add alternation values
            color.add(new Literal('Black'));
            color.add(new Literal('Blue'));
            color.add(new Literal('Green'));
            color.add(new Literal('Cyan'));
            color.add(new Literal('Red'));
            color.add(new Literal('Magenta'));
            color.add(new Literal('Brown'));
            color.add(new Literal('White'));
            color.add(new Literal('Grey'));
            color.add(new Literal('BrightBlue'));
            color.add(new Literal('BrightGreen'));
            color.add(new Literal('BrightCyan'));
            color.add(new Literal('BrightRed'));
            color.add(new Literal('BrightMagenta'));
            color.add(new Literal('Yellow'));
            color.add(new Literal('BrightWhite'));

            // Define assembler
            color.assembler = validateOnly ? undefined : {
                assemble: function (assembly) {
                    assembly.push(colors[assembly.pop().value.toUpperCase()]);
                }
            };

            return color;
        }

        /**
         * Thing parser
         * Creates and returns a 'thing' parser.
         * @return A 'thing' parser.
         */
        function createThingParser() {
            var thing = new Alternation();

            // Add alternation values
            // TODO: Can we get these from jzt.things directly?
            thing.add(new Literal('Empty'));
            thing.add(new Literal('ActiveBomb'));
            thing.add(new Literal('Ammo'));
            thing.add(new Literal('Bear'));
            thing.add(new Literal('Blinker'));
            thing.add(new Literal('BlinkWall'));
            thing.add(new Literal('Bomb'));
            thing.add(new Literal('Boulder'));
            thing.add(new Literal('BreakableWall'));
            thing.add(new Literal('Bullet'));
            thing.add(new Literal('Centipede'));
            thing.add(new Literal('Conveyor'));
            thing.add(new Literal('Door'));
            thing.add(new Literal('Duplicator'));
            thing.add(new Literal('Explosion'));
            thing.add(new Literal('FakeWall'));
            thing.add(new Literal('Forest'));
            thing.add(new Literal('Gem'));
            thing.add(new Literal('Heart'));
            thing.add(new Literal('InvisibleWall'));
            thing.add(new Literal('Key'));
            thing.add(new Literal('Lava'));
            thing.add(new Literal('LineWall'));
            thing.add(new Literal('Lion'));
            thing.add(new Literal('Passage'));
            thing.add(new Literal('Player'));
            thing.add(new Literal('Pusher'));
            thing.add(new Literal('Ricochet'));
            thing.add(new Literal('River'));
            thing.add(new Literal('Ruffian'));
            thing.add(new Literal('Signpost'));
            thing.add(new Literal('SliderEw'));
            thing.add(new Literal('SliderNs'));
            thing.add(new Literal('Snake'));
            thing.add(new Literal('SolidWall'));
            thing.add(new Literal('Spider'));
            thing.add(new Literal('SpiderWeb'));
            thing.add(new Literal('SpinningGun'));
            thing.add(new Literal('Teleporter'));
            thing.add(new Literal('Text'));
            thing.add(new Literal('ThrowingStar'));
            thing.add(new Literal('Tiger'));
            thing.add(new Literal('Torch'));
            thing.add(new Literal('Wall'));
            thing.add(new Literal('Water'));
            thing.add(new Literal('ThingFactory'));

            // Define assembler
            thing.assembler = validateOnly ? undefined : {
                assemble: function (assembly) {
                    assembly.push({
                        type: assembly.pop().value.toUpperCase()
                    });
                }
            };

            return thing;
        }

        /**
         * Colorful Thing Parser
         * Creates and returns a 'colorful thing' parser.
         * @return A 'colorful thing' parser.
         */
        function createColorfulThingParser() {
            var colorfulThing = new Sequence();

            // Add sequence items
            colorfulThing.add(createColorParser());
            colorfulThing.add(createThingParser());

            // Define assembler
            colorfulThing.assembler = validateOnly ? undefined : {
                assemble: function (assembly) {
                    var thing = assembly.pop();
                    thing.color = colors.serialize(undefined, assembly.pop());
                    assembly.push(thing);
                }
            };

            return colorfulThing;
        }

        /**
         * Not Expression Parser
         * Creates and returns a Not expression parser.
         * @return A not expression parser.
         */
        function createNotExpressionParser(expressionParser) {
            var notExpression = new Sequence();

            // Add not expression parser elements
            notExpression.addDiscard(new Literal('Not'));
            notExpression.add(expressionParser);

            // Define assembler
            notExpression.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.NotExpression(assembly.pop()));
            });

            return notExpression;
        }

        /**
         * Adjacent Expression Parser
         * Creates and returns an adjacent expression parser
         * @return An adjacent expression parser
         */
        function createAdjacentExpressionParser() {
            var adjacentExpression = new Literal('Adjacent');
            adjacentExpression.discard = true;
            adjacentExpression.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.AdjacentExpression());
            });
            return adjacentExpression;
        }

        /**
         * Blocked Expression Parser
         * Creates and returns a blocked expression parser
         * @return A blocked expression parser
         */
        function createBlockedExpressionParser() {
            var blockedExpression = new Sequence();
            blockedExpression.addDiscard(new Literal('Blocked'));
            blockedExpression.add(createDirectionParser());
            blockedExpression.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.BlockedExpression(assembly.pop()));
            });
            return blockedExpression;
        }

        /**
         * Aligned Expression Parser
         * Creates and returns an aligned expression parser.
         * @return An aligned expression parser.
         */
        function createAlignedExpressionParser() {
            var alignedExpression = new Sequence();
            alignedExpression.addDiscard(new Literal('Aligned'));
            alignedExpression.add(createDirectionParser());
            alignedExpression.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.AlignedExpression(assembly.pop()));
            });
            return alignedExpression;
        }

        /**
         * Peep Expression Parser
         * Creates and returns a peep expression parser.
         * @return A peep expression parser
         */
        function createPeepExpressionParser() {
            var peepExpression = new Sequence();
            peepExpression.addDiscard(new Literal('Peep'));
            peepExpression.add(optional(new ParserNumber()));
            peepExpression.assembler = createAssembler(function (assembly) {
                var count = assembly.peek() && assembly.peek().name === 'NUMBER' ? assembly.pop().value : undefined;
                assembly.push(new commands.PeepExpression(count));
            });
            return peepExpression;
        }

        /**
         * Exists Expression Parser
         * Creates and returns an exists expression parser.
         * @return An exists expression parser.
         */
        function createExistsExpressionParser() {
            var existsExpression = new Sequence();
            existsExpression.addDiscard(new Literal('Exists'));
            existsExpression.add(optional(new ParserNumber()));
            existsExpression.add(choice(createThingParser(), createColorfulThingParser()));
            existsExpression.assembler = createAssembler(function (assembly) {
                var thingTemplate = assembly.pop();
                var count = assembly.peek() && assembly.peek().name === 'NUMBER' ? assembly.pop().value : undefined;
                assembly.push(new commands.ExistsExpression(thingTemplate, count));
            });
            return existsExpression;
        }

        /**
         * Testing Expression Parser
         * Creates and returns a testing expression parser.
         * @return A testing expression parser.
         */
        function createTestingExpressionParser() {
            var testingExpression = new Sequence();
            var operator = new Alternation();
            operator.add(new Literal('<'));
            operator.add(new Literal('<='));
            operator.add(new Literal('>'));
            operator.add(new Literal('>='));
            operator.add(new Literal('='));
            testingExpression.add(new Word());
            testingExpression.add(operator);
            testingExpression.add(new ParserNumber());
            testingExpression.assembler = createAssembler(function (assembly) {
                var value = assembly.pop().value;
                var operand = assembly.pop().value;
                var counter = assembly.pop().value.toUpperCase();
                assembly.push(new commands.TestingExpression(counter, operand, value));
            });
            return testingExpression;
        }

        /**
         * Expression Parser
         * Creates and returns an expression parser.
         * @return An expression parser.
         */
        function createExpressionParser() {
            var expression = new Alternation();
            expression.add(createNotExpressionParser(expression));
            expression.add(createAdjacentExpressionParser());
            expression.add(createBlockedExpressionParser());
            expression.add(createAlignedExpressionParser());
            expression.add(createPeepExpressionParser());
            expression.add(createExistsExpressionParser());
            expression.add(createTestingExpressionParser());
            return expression;
        }

        /**
         * Label Parser
         * Creates and returns a new label parser
         * @return A label parser.
         */
        function createLabelParser() {
            var label = new Sequence();

            // Add sequence items
            label.addDiscard(new Literal(':'));
            label.add(new Word());
            label.addDiscard(new NewLine());

            // Define assembler
            label.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.Label(assembly.pop().value.toUpperCase()));
            });

            return label;
        }

        /**
         * Become Statement Parser
         * Creates and returns a new 'become' statement parser
         * @return A 'become' statement parser.
         */
        function createBecomeStatementParser() {
            var become = new Sequence();

            // Add sequence tokens
            become.addDiscard(new Literal('Become'));
            become.add(choice(createColorfulThingParser(), createThingParser()));

            // Define assembler
            become.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.BecomeCommand(assembly.pop()));
            });

            return become;
        }

        /**
         * Change Statement Parser
         * Creates and returns a new 'change' statement parser
         * @return A 'change' statement parser
         */
        function createChangeStatementParser() {
            var change = new Sequence();

            // Add sequence tokens
            change.addDiscard(new Literal('Change'));
            change.add(choice(createColorfulThingParser(), createThingParser()));
            change.add(choice(createColorfulThingParser(), createThingParser()));

            // Define assembler
            change.assembler = createAssembler(function (assembly) {
                var toTemplate = assembly.pop();
                assembly.push(new commands.ChangeCommand(assembly.pop(), toTemplate));
            });

            return change;
        }

        /**
         * Char Statement Parser
         * Creates and returns a new 'char' statement parser.
         * @return A 'char' statement parser
         */
        function createCharStatementParser() {
            var char = new Sequence();

            // Add sequence tokens
            char.addDiscard(new Literal('Char'));
            char.add(new ParserNumber());

            // Define assembler
            char.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.CharCommand(assembly.pop().value));
            });

            return char;
        }

        /**
         * Die Statement Parser
         * Creates and returns a new 'die' statement parser.
         * @return A 'die' statement parser.
         */
        function createDieStatementParser() {
            var die = new Sequence();

            // Add sequence tokens
            die.addDiscard(new Literal('Die'));
            die.add(optional(new Literal('Magnetically')));

            // Define assembler
            die.assembler = createAssembler(function (assembly) {
                var nextToken = assembly.peek();
                if (nextToken && nextToken.name === 'WORD' && nextToken.value.toUpperCase() === 'MAGNETICALLY') {
                    assembly.pop();
                    assembly.push(new commands.DieCommand(true));
                } else {
                    assembly.push(new commands.DieCommand());
                }
            });

            return die;
        }

        /**
         * End Statement Parser
         * Creates and returns a new 'end' statement parser.
         * @return A 'end' statement parser
         */
        function createEndStatementParser() {
            var endStatement = new Literal('End');

            // Add sequence tokens
            endStatement.discard = true;

            // Define assembler
            endStatement.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.EndCommand());
            });

            return endStatement;
        }

        /**
         * Go Statement Parser
         *
         * Creates and returns a new 'go' statement parser.
         * @param {string} [alias] - An optional alias to use for the parser instead of GO
         * @param {boolean} [forceful] - Whether or not this parser should result in a forceful move command
         * @returns {object} - A 'go' statement parser.
         */
        function createGoStatementParser(alias, forceful) {

            var go = new Sequence();
            var subsequentDirections = new Sequence();
            var direction = choice(createDirectionParser(), createCountableDirectionParser());

            // Forceful defaults to true
            forceful = forceful === undefined ? true : forceful;

            subsequentDirections.addDiscard(new Literal(','));
            subsequentDirections.add(direction);

            // Add sequence tokens
            go.add(new Literal(alias || 'Go'));
            go.add(direction);
            go.add(new Repetition(subsequentDirections));

            // Define assembler
            go.assembler = createAssembler(function (assembly) {

                var index;
                var expression;
                var expressions = popAllTokensUntil(assembly, 'WORD', alias || 'GO', true);

                for (index = 0; index < expressions.length; index += 1) {
                    expression = expressions[index];
                    assembly.push(new commands.MoveCommand(expression, forceful));
                }

            });

            return go;

        }

        /**
         * Give Statement Parser
         * Creates and returns a new 'give' statement parser.
         * @return A 'give' statement parser
         */
        function createGiveStatementParser() {
            var give = new Sequence();

            // Add sequence tokens
            give.addDiscard(new Literal('Give'));
            give.add(new ParserNumber());
            give.add(new Word());

            // Define assembler
            give.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.GiveCommand(assembly.pop().value, assembly.pop().value));
            });

            return give;
        }

        /**
         * If Statement Parser
         * Creates and returns a new 'if' statement parser
         * @return An 'if' statement parser
         */
        function createIfStatementParser() {
            var ifStatement = new Sequence();

            // Add sequence tokens
            ifStatement.addDiscard(new Literal('If'));
            ifStatement.add(createExpressionParser());
            ifStatement.add(new Word());

            // Define assembler
            ifStatement.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.IfCommand(assembly.pop().value.toUpperCase(), assembly.pop()));
            });

            return ifStatement;
        }

        /**
         * Lock Statement Parser
         * Creates and returns a new 'lock' statment parser.
         * @return A 'lock' statement parser.
         */
        function createLockStatementParser() {

            // Create lock parser
            var lock = new Literal('Lock');
            lock.discard = true;

            // Define assembler
            lock.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.LockCommand());
            });

            return lock;
        }

        /**
         * Play Statement Parser
         * Creates and returns a new 'play' statement paser.
         * @return A 'play' statement parser.
         */
        function createPlayStatementParser() {
            var play = new Sequence();

            // Add play items
            play.addDiscard(new Literal('Play'));
            play.add(new ParserString());

            // Define assembler
            play.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.PlayCommand(assembly.pop().value));
            });

            return play;
        }

        /**
         * Put Statement Parser
         * Creates and returns a new 'put' statement parser.
         * @return A 'put' statement paser.
         */
        function createPutStatementParser() {
            var put = new Sequence();

            // Add put items
            put.addDiscard(new Literal('Put'));
            put.add(createDirectionParser());
            put.add(choice(createThingParser(), createColorfulThingParser()));

            // Define assembler
            put.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.PutCommand(assembly.pop(), assembly.pop()));
            });

            return put;
        }

        /**
         * Scroll Statement Parser
         * Creates and returns a 'scroll' statement paser.
         * @return A 'scroll' statment paser.
         */
        function createScrollStatementParser() {
            var scroll = new Sequence();

            // Add scroll sequence items
            scroll.addDiscard(new Literal('Scroll'));
            scroll.add(optional(new Literal('Bold')));
            scroll.add(new ParserString());
            scroll.add(optional(new Word()));

            // Define assembler
            scroll.assembler = createAssembler(function (assembly) {
                var jumpLabel = assembly.peek().name === 'WORD' ? assembly.pop().value.toUpperCase() : undefined;
                var text = assembly.pop().value;
                var boldOption = assembly.peek() && assembly.peek().name === 'WORD' && assembly.peek().value.toUpperCase() === 'BOLD' ? assembly.pop() : false;
                assembly.push(new commands.ScrollCommand(text, !!boldOption, jumpLabel));
            });

            return scroll;
        }

        /**
         * Send Statement Parser
         * Creates and returns a 'send' statement parser
         * @return A 'send' statement paser.
         */
        function createSendStatementParser() {
            var send = new Sequence();

            // Add send sequence items
            send.add(new Literal('Send'));
            send.add(optional(new Word()));
            send.add(new Word());

            // Define assembler
            send.assembler = createAssembler(function (assembly) {
                var parameters = popAllTokensUntil(assembly, 'WORD', 'SEND', true);
                var label = parameters.pop().value.toUpperCase();
                var recipient = parameters.length > 0 ? parameters.pop().value.toUpperCase() : 'SELF';
                assembly.push(new commands.SendCommand(recipient, label));
            });

            return send;
        }

        /**
         * Set Statement Parser
         * Creates and returns a 'set' statement paser
         * @return A 'set' statement parser.
         */
        function createSetStatementParser() {
            var set = new Sequence();

            // Add set sequence items
            set.addDiscard(new Literal('Set'));
            set.add(optional(new ParserNumber()));
            set.add(new Word());

            // Define assembler
            set.assembler = createAssembler(function (assembly) {
                var counter = assembly.pop().value.toUpperCase();
                var value = assembly.peek() && assembly.peek().name === 'NUMBER' ? assembly.pop().value : 1;
                assembly.push(new commands.SetCommand(counter, value));
            });

            return set;
        }

        /**
         * Take Statement Parser
         * Creates and returns a 'take' statement parser.
         * @return A 'take' statement parser.
         */
        function createTakeStatementParser() {
            var take = new Sequence();

            // Add take sequence items
            take.addDiscard(new Literal('Take'));
            take.add(new ParserNumber());
            take.add(new Word());
            take.add(optional(new Word()));

            // Define assembler
            take.assembler = createAssembler(function (assembly) {
                var token1 = assembly.pop().value.toUpperCase();
                var token2 = assembly.peek().name === 'WORD' ? assembly.pop().value.toUpperCase() : undefined;
                var count = +(assembly.pop().value);
                assembly.push(new commands.TakeCommand(token2 || token1, count, token2 ? token1 : undefined));
            });

            return take;
        }

        /**
         * ThrowStar Statement Parser
         * Creates and returns a 'throwstar' statement parser.
         * @return A 'throwstar' statment parser.
         */
        function createThrowStarStatementParser() {
            var throwStar = new Sequence();

            // Add throwstar sequence items
            throwStar.addDiscard(new Literal('ThrowStar'));
            throwStar.add(createDirectionParser());

            // Define assembler
            throwStar.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.ThrowStarCommand(assembly.pop()));
            });

            return throwStar;
        }

        /**
         * Torch Statement Parser
         * Creates and returns a 'torch' statement parser.
         * @return A 'torch' statement parser.
         */
        function createTorchStatementParser() {
            var torch = new Sequence();

            // Add torch sequence items
            torch.addDiscard(new Literal('Torch'));
            torch.add(optional(new ParserNumber()));

            // Define assembler
            torch.assembler = createAssembler(function (assembly) {
                var radius = assembly.peek() && assembly.peek().name === 'NUMBER' ? assembly.pop().value : 0;
                assembly.push(new commands.TorchCommand(radius));
            });

            return torch;
        }

        /**
         * Restore Statement Parser
         * Creates and returns a 'restore' statement parser.
         * @return A 'restore' statement parser.
         */
        function createRestoreStatementParser() {
            var restore = new Sequence();

            // Add restore sequence items
            restore.addDiscard(new Literal('Restore'));
            restore.add(new Word());

            // Define assembler
            restore.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.RestoreCommand(assembly.pop().value.toUpperCase()));
            });

            return restore;
        }

        /**
         * Say Statement Parser
         * Creates and returns a 'say' statement parser.
         * @return A 'say' statement parser.
         */
        function createSayStatementParser() {
            var say = new Sequence();

            // Add say sequence items
            say.addDiscard(new Literal('Say'));
            say.add(new ParserString());

            // Define assembler
            say.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.SayCommand(assembly.pop().value));
            });

            return say;
        }

        /**
         * Shoot Statement Parser
         * Creates and returns a 'shoot' statement parser.
         * @return A 'shoot' statement parser.
         */
        function createShootStatementParser() {
            var shoot = new Sequence();

            // Add shoot sequence items
            shoot.addDiscard(new Literal('Shoot'));
            shoot.add(createDirectionParser());

            // Define assembler
            shoot.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.ShootCommand(assembly.pop()));
            });

            return shoot;
        }

        /**
         * Stand Statement Parser
         * Creates and returns a 'stand' statement parser.
         * @return A 'stand' statement parser.
         */
        function createStandStatementParser() {
            var stand = new Literal('Stand');
            stand.discard = true;
            stand.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.StandCommand());
            });
            return stand;
        }

        /**
         * Unlock Statement Parser
         * Creates and returns an 'unlock' statement parser.
         * @return An 'unlock' statement parser.
         */
        function createUnlockStatementParser() {
            var unlock = new Literal('Unlock');
            unlock.discard = true;
            unlock.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.UnlockCommand());
            });
            return unlock;
        }

        /**
         * Victory Statement Parser
         * Creates and returns a 'victory' statement parser.
         * @return A 'victory' statement parser.
         */
        function createVictoryStatementParser() {
            var victory = new Literal('Victory');
            victory.discard = true;
            victory.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.VictoryCommand());
            });
            return victory;
        }

        /**
         * Wait Statement Parser
         * Creates and returns a 'wait' statement parser.
         * @return A 'wait' statement parser.
         */
        function createWaitStatementParser() {
            var wait = new Sequence();

            // Add wait sequence items
            wait.addDiscard(new Literal('Wait'));
            wait.add(optional(new ParserNumber()));

            // Define assembler
            wait.assembler = createAssembler(function (assembly) {
                var cycles = assembly.peek() && assembly.peek().name === 'NUMBER' ? assembly.pop().value : undefined;
                assembly.push(new commands.WaitCommand(cycles));
            });
            return wait;
        }

        /**
         * Walk Statement Parser
         * Creates and returns a 'walk' statement parser.
         * @return A 'walk' statement parser.
         */
        function createWalkStatementParser() {
            var walk = new Sequence();
            walk.addDiscard(new Literal('Walk'));
            walk.add(createDirectionParser());
            walk.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.WalkCommand(assembly.pop()));
            });
            return walk;
        }

        /**
         * Zap Statement Parser
         * Creates and returns a 'zap' statement parser.
         * @return A 'zap' statement parser.
         */
        function createZapStatementParser() {
            var zap = new Sequence();
            zap.addDiscard(new Literal('Zap'));
            zap.add(new Word());
            zap.assembler = createAssembler(function (assembly) {
                assembly.push(new commands.ZapCommand(assembly.pop().value.toUpperCase()));
            });
            return zap;
        }

        /**
         * Statement Parser
         * Creates and returns a new statement parser.
         * @return A statement parser.
         */
        function createStatementParser() {
            var statement = new Sequence();
            var statementOptions = new Alternation();

            // Add statement items
            statementOptions.add(createBecomeStatementParser());
            statementOptions.add(createChangeStatementParser());
            statementOptions.add(createCharStatementParser());
            statementOptions.add(createDieStatementParser());
            statementOptions.add(createEndStatementParser());
            statementOptions.add(createGoStatementParser());
            statementOptions.add(createGiveStatementParser());
            statementOptions.add(createIfStatementParser());
            statementOptions.add(createLockStatementParser());
            statementOptions.add(createPlayStatementParser());
            statementOptions.add(createPutStatementParser());
            statementOptions.add(createScrollStatementParser());
            statementOptions.add(createSendStatementParser());
            statementOptions.add(createSetStatementParser());
            statementOptions.add(createTakeStatementParser());
            statementOptions.add(createThrowStarStatementParser());
            statementOptions.add(createTorchStatementParser());
            statementOptions.add(createGoStatementParser('Try', false));
            statementOptions.add(createRestoreStatementParser());
            statementOptions.add(createSayStatementParser());
            statementOptions.add(createShootStatementParser());
            statementOptions.add(createStandStatementParser());
            statementOptions.add(createUnlockStatementParser());
            statementOptions.add(createVictoryStatementParser());
            statementOptions.add(createWaitStatementParser());
            statementOptions.add(createWalkStatementParser());
            statementOptions.add(createZapStatementParser());
            statement.add(statementOptions);
            statement.addDiscard(new NewLine());

            return statement;
        }

        /**
         * JztScript Parser
         * Creates and returns a new JztScript parser.
         * @return A JZT script parser.
         */
        function createJztScriptParser() {

            var program;
            var line = new Alternation();
            line.add(createLabelParser());
            line.add(createStatementParser());
            line.addDiscard(new NewLine());
            program = new Repetition(line);
            return program;

        }

        this.parser = createJztScriptParser();

    }

    JztScriptParser.prototype.parse = function (script) {

        var lexer;
        var tokens;
        var assembly;
        var result;

        // If our script doesn't already end in a newline, add it now
        if (script.charAt(script.length - 1) !== '\n') {
            script += '\n';
        }

        lexer = new jztLexer.Lexer(script);
        tokens = lexer.tokenizeAll();
        assembly = new Assembly(tokens);
        result = this.parser.completeMatch(assembly);

        if (result === undefined) {
            throw 'Catestrophic script error. No result.';
        }

        return result.stack;

    };

    my.JztScriptParser = JztScriptParser;
    return my;

}(jzt.jztscript || {}));
