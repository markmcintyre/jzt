/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
var jzt = jzt || {};
jzt.jztscript = (function(my){
 
    'use strict';
    
    var p = jzt.parser;
    var jztLexer = jzt.lexer;
    var commands = my.commands;
    var colors = jzt.colors;
    
    /**
     * JztScriptParser
     */
    function JztScriptParser(validateOnly) {

        if(!(this instanceof JztScriptParser)) {
            throw jzt.ConstructorError;
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
         * JztScript Parser
         * Creates and returns a new JztScript parser.
         * @return A JZT script parser.
         */
        function createJztScriptParser() {
        
            var program;
            var line = new p.Alternation();
            line.add(createLabelParser());
            line.add(createStatementParser());
            line.addDiscard(new p.NewLine());
            program = new p.Repetition(line);
            return program;

        }
        
        /**
         * Label Parser
         * Creates and returns a new label parser
         * @return A label parser.
         */
        function createLabelParser() {
            var label = new p.Sequence();
            
            // Add sequence items
            label.addDiscard(new p.Literal(':'));
            label.add(new p.Word());
            label.addDiscard(new p.NewLine());
            
            // Define assembler
            label.assembler = createAssembler(function(assembly){
                assembly.push(new commands.Label(assembly.pop().value.toUpperCase()));
            });
            
            return label;
        }

        /**
         * Statement Parser
         * Creates and returns a new statement parser.
         * @return A statement parser.
         */
        function createStatementParser() {
            var statement = new p.Sequence();
            var statementOptions = new p.Alternation();
            
            // Add statement items
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

        /**
         * Become Statement Parser
         * Creates and returns a new 'become' statement parser
         * @return A 'become' statement parser.
         */
        function createBecomeStatementParser() {
            var become = new p.Sequence();
            
            // Add sequence tokens
            become.addDiscard(new p.Literal('Become'));
            become.add(choice(createColorfulThingParser(), createThingParser()));
            
            // Define assembler
            become.assembler = createAssembler(function(assembly) {
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
            var change = new p.Sequence();
            
            // Add sequence tokens
            change.addDiscard(new p.Literal('Change'));
            change.add(choice(createColorfulThingParser(), createThingParser()));
            change.add(choice(createColorfulThingParser(), createThingParser()));
            
            // Define assembler
            change.assembler = createAssembler(function(assembly) {
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
            var char = new p.Sequence();
            
            // Add sequence tokens
            char.addDiscard(new p.Literal('Char'));
            char.add(new p.Number());
            
            // Define assembler
            char.assembler = createAssembler(function(assembly) {
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
            var die = new p.Sequence();
            
            // Add sequence tokens
            die.addDiscard(new p.Literal('Die'));
            die.add(optional(new p.Literal('Magnetically')));
            
            // Define assembler
            die.assembler = createAssembler(function(assembly) {
                var nextToken = assembly.peek();
                if(nextToken && nextToken.value.toUpperCase() === 'MAGNETICALLY') {
                    assembly.pop();
                    assembly.push(new commands.DieCommand(true));
                }
                else {
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
            var endStatement = new p.Literal('End');
            
            // Add sequence tokens
            endStatement.discard = true;
            
            // Define assembler
            endStatement.assembler = createAssembler(function(assembly) {
                assembly.push(new commands.EndCommand());
            });
            
            return endStatement;
        }

        /**
         * Give Statement Parser
         * Creates and returns a new 'give' statement parser.
         * @return A 'give' statement parser
         */
        function createGiveStatementParser() {
            var give = new p.Sequence();
            
            // Add sequence tokens
            give.addDiscard(new p.Literal('Give'));
            give.add(new p.Number());
            give.add(new p.Word());
            
            // Define assembler
            give.assembler = createAssembler(function(assembly) {
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
            var ifStatement = new p.Sequence();
            
            // Add sequence tokens
            ifStatement.addDiscard(new p.Literal('If'));
            ifStatement.add(createExpressionParser());
            ifStatement.add(new p.Word());
            
            // Define assembler
            ifStatement.assembler = createAssembler(function(assembly) {
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
            var lock = new p.Literal('Lock');
            lock.discard = true;
                
            // Define assembler
            lock.assembler = createAssembler(function(assembly) {
                assembly.push(new commands.LockCommand());
            });
                
            return lock;
        }

        /**
         * Move Statement Parser
         * Creates and returns a new 'move' statement paser.
         * @return A 'move' statement parser.
         */
        function createMoveStatementParser() {
            var move = new p.Sequence();
            var moveOptions = new p.Alternation();
            var otherwise = new p.Sequence();

            // Add otherwise items
            otherwise.addDiscard(new p.Literal('Otherwise'));
            otherwise.add(new p.Word());

            // Add move option items
            moveOptions.addDiscard(new p.Literal('Forcefully'));
            moveOptions.add(otherwise);
            moveOptions.assembler = createAssembler(function(assembly){
                assembly.push(assembly.peek().name === 'WORD' ? {jumpTo: assembly.pop().value.toUpperCase()} : {forceful: true});
            });

            // Add move command sequence
            move.addDiscard(new p.Literal('Move'));
            move.add(choice(createDirectionParser(), createCountableDirectionParser()));
            move.add(optional(moveOptions));
            
            // Define assembler
            move.assembler = createAssembler(function(assembly){
                
                var options;
                
                if(! (assembly.peek() instanceof commands.DirectionExpression)) {
                    options = assembly.pop();
                }
                
                assembly.push(new commands.MoveCommand(assembly.pop(), options));

            });

            return move;
        }

        /**
         * Play Statement Parser
         * Creates and returns a new 'play' statement paser.
         * @return A 'play' statement parser.
         */
        function createPlayStatementParser() {
            var play = new p.Sequence();
            
            // Add play items
            play.addDiscard(new p.Literal('Play'));
            play.add(new p.String());
            
            // Define assembler
            play.assembler = createAssembler(function(assembly){
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
            var put = new p.Sequence();
            
            // Add put items
            put.addDiscard(new p.Literal('Put'));
            put.add(createDirectionParser());
            put.add(choice(createThingParser(), createColorfulThingParser()));
            
            // Define assembler
            put.assembler = createAssembler(function(assembly){
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
            var scroll = new p.Sequence();
            
            // Add scroll sequence items
            scroll.addDiscard(new p.Literal('Scroll'));
            scroll.add(optional(new p.Literal('Bold')));
            scroll.add(new p.String());
            scroll.add(optional(new p.Word()));
            
            // Define assembler
            scroll.assembler = createAssembler(function(assembly){
                var jumpLabel = assembly.peek().name === 'WORD' ? assembly.pop().value.toUpperCase() : undefined;
                var text = assembly.pop().value;
                var boldOption = assembly.peek() && assembly.peek().value.toUpperCase() === 'BOLD' ? assembly.pop() : false;
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
            var send = new p.Sequence();
            
            // Add send sequence items
            send.addDiscard(new p.Literal('Send'));
            send.add(new p.Word());
            send.add(new p.Word());
            
            // Define assembler
            send.assembler = createAssembler(function(assembly){
                var label = assembly.pop().value.toUpperCase();
                assembly.push(new commands.SendCommand(assembly.pop().value.toUpperCase(), label));
            });
            
            return send;
        }

        /**
         * Set Statement Parser
         * Creates and returns a 'set' statement paser
         * @return A 'set' statement parser.
         */
        function createSetStatementParser() {
            var set = new p.Sequence();
            
            // Add set sequence items
            set.addDiscard(new p.Literal('Set'));
            set.add(optional(new p.Number()));
            set.add(new p.Word());
            
            // Define assembler
            set.assembler = createAssembler(function(assembly){
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
            var take = new p.Sequence();
            
            // Add take sequence items
            take.addDiscard(new p.Literal('Take'));
            take.add(new p.Number());
            take.add(new p.Word());
            take.add(optional(new p.Word()));
            
            // Define assembler
            take.assembler = createAssembler(function(assembly){
                var token1 = assembly.pop().value.toUpperCase();
                var token2 = assembly.peek().name === 'WORD' ? assembly.pop().value.toUpperCase() : undefined;
                var count = +(assembly.pop().value);
                assembly.push(new commands.TakeCommand(token2 ? token2 : token1, count, token2 ? token1 : undefined));
            });

            return take;
        }

        /**
         * ThrowStar Statement Parser
         * Creates and returns a 'throwstar' statement parser.
         * @return A 'throwstar' statment parser.
         */
        function createThrowStarStatementParser() {
            var throwStar = new p.Sequence();
            
            // Add throwstar sequence items
            throwStar.addDiscard(new p.Literal('ThrowStar'));
            throwStar.add(createDirectionParser());
            
            // Define assembler
            throwStar.assembler = createAssembler(function(assembly){
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
            var torch = new p.Sequence();
            
            // Add torch sequence items
            torch.addDiscard(new p.Literal('Torch'));
            torch.add(optional(new p.Number()));
            
            // Define assembler
            torch.assembler = createAssembler(function(assembly){
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
            var restore = new p.Sequence();
            
            // Add restore sequence items
            restore.addDiscard(new p.Literal('Restore'));
            restore.add(new p.Word());
            
            // Define assembler
            restore.assembler = createAssembler(function(assembly){
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
            var say = new p.Sequence();
            
            // Add say sequence items
            say.addDiscard(new p.Literal('Say'));
            say.add(new p.String());
            
            // Define assembler
            say.assembler = createAssembler(function(assembly){
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
            var shoot = new p.Sequence();
            
            // Add shoot sequence items
            shoot.addDiscard(new p.Literal('Shoot'));
            shoot.add(createDirectionParser());
            
            // Define assembler
            shoot.assembler = createAssembler(function(assembly){
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
            var stand = new p.Literal('Stand');
            stand.discard = true;
            stand.assembler = createAssembler(function(assembly){
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
            var unlock = new p.Literal('Unlock');
            unlock.discard = true;
            unlock.assembler = createAssembler(function(assembly){
                assembly.push(new commands.UnlockCommand());
            });
            return unlock;
        }

        /**
         * Wait Statement Parser
         * Creates and returns a 'wait' statement parser.
         * @return A 'wait' statement parser.
         */
        function createWaitStatementParser() {
            var wait = new p.Sequence();
            
            // Add wait sequence items
            wait.addDiscard(new p.Literal('Wait'));
            wait.add(optional(new p.Number()));
            
            // Define assembler
            wait.assembler = createAssembler(function(assembly) {
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
            var walk = new p.Sequence();
            walk.addDiscard(new p.Literal('Walk'));
            walk.add(createDirectionParser());
            walk.assembler = createAssembler(function(assembly){
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
            var zap = new p.Sequence();
            zap.addDiscard(new p.Literal('Zap'));
            zap.add(new p.Word());
            zap.assembler = createAssembler(function(assembly){
                assembly.push(new commands.ZapCommand(assembly.pop().value.toUpperCase()));
            });
            return zap;
        }

        /**
         * Countable Direction Parser
         * Creates and returns a 'countable direction' parser.
         * @return A 'countable direction' parser.
         */
        function createCountableDirectionParser() {
            var direction = new p.Sequence();
            direction.add(createDirectionParser());
            direction.add(new p.Number());
            direction.assembler = createAssembler(function(assembly){
                var count = assembly.pop().value;
                assembly.peek().count = count;
            });
            return direction;
        }

        /**
         * Direction Parser
         * Creates and returns a 'direction' parser.
         * @return A 'direction' parser.
         */
        function createDirectionParser() {
            var direction = new p.Sequence();
            var modifiers = new p.Repetition(createDirectionModifierParser());
            direction.add(modifiers);
            direction.add(createDirectionTerminalParser());
            
            // Add assembler
            direction.assembler = createAssembler(function(assembly){
                
                var directionExpression = new commands.DirectionExpression(assembly.pop());
                
                while(assembly.peek() && assembly.peek().type === 'modifier') {
                    directionExpression.modifiers.unshift(assembly.pop());
                }
                
                assembly.push(directionExpression);
                
            });
            
            return direction;
        }

        /**
         * Direction Modifier Parser
         * Creates and returns a 'direction modifier' parser.
         * @return A 'direction modifier' parser.
         */
        function createDirectionModifierParser() {
            var directionModifier = new p.Alternation();
            
            // Add direction modifier options
            directionModifier.add(new p.Literal('CW'));
            directionModifier.add(new p.Literal('CCW'));
            directionModifier.add(new p.Literal('OPP'));
            directionModifier.add(new p.Literal('RNDP'));
            
            // Create assembler
            directionModifier.assembler = createAssembler(function(assembly){
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
            var directionTerminal = new p.Alternation();
            
            // Add direction terminal options
            // TODO: Can we get this from basic.js?
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
            
            // Create assembler
            directionTerminal.assembler = createAssembler(function(assembly) {
                assembly.push(commands.Direction[assembly.pop().value.toUpperCase()]);
            });
            
            return directionTerminal;
        }

        /**
         * Color Parser
         * Creates and returns a 'color' parser.
         * @return A 'color' parser.
         */
        function createColorParser() {
            var color = new p.Alternation();
            
            // Add alternation values
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
            
            // Define assembler
            color.assembler = validateOnly ? undefined : {
                assemble: function(assembly) {
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
            var thing = new p.Alternation();
            
            // Add alternation values
            // TODO: Can we get these from jzt.things directly?
            thing.add(new p.Literal('Empty'));
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
            
            // Define assembler
            thing.assembler = validateOnly ? undefined : {
                assemble: function(assembly) {
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
            var colorfulThing = new p.Sequence();
            
            // Add sequence items
            colorfulThing.add(createColorParser());
            colorfulThing.add(createThingParser());
            
            // Define assembler
            colorfulThing.assembler = validateOnly ? undefined : {
                assemble: function(assembly) {
                    var thing = assembly.pop();
                    thing.color = colors.serialize(undefined, assembly.pop());
                    assembly.push(thing);
                }
            };
            
            return colorfulThing;
        }

        /**
         * Expression Parser
         * Creates and returns an expression parser.
         * @return An expression parser.
         */
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

        /**
         * Not Expression Parser
         * Creates and returns a Not expression parser.
         * @return A not expression parser.
         */
        function createNotExpressionParser(expressionParser) {
            var notExpression = new p.Sequence();
            
            // Add not expression parser elements
            notExpression.addDiscard(new p.Literal('Not'));
            notExpression.add(expressionParser);
            
            // Define assembler
            notExpression.assembler = createAssembler(function(assembly){
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
            var adjacentExpression = new p.Literal('Adjacent');
            adjacentExpression.discard = true;
            adjacentExpression.assembler = createAssembler(function(assembly) {
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
            var blockedExpression = new p.Sequence();
            blockedExpression.addDiscard(new p.Literal('Blocked'));
            blockedExpression.add(createDirectionParser());
            blockedExpression.assembler = createAssembler(function(assembly){
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
            var alignedExpression = new p.Sequence();
            alignedExpression.addDiscard(new p.Literal('Aligned'));
            alignedExpression.add(createDirectionParser());
            alignedExpression.assembler = createAssembler(function(assembly){
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
            var peepExpression = new p.Sequence();
            peepExpression.addDiscard(new p.Literal('Peep'));
            peepExpression.add(optional(new p.Number()));
            peepExpression.assembler = createAssembler(function(assembly){
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
            var existsExpression = new p.Sequence();
            existsExpression.addDiscard(new p.Literal('Exists'));
            existsExpression.add(optional(new p.Number()));
            existsExpression.add(choice(createThingParser(), createColorfulThingParser()));
            existsExpression.assembler = createAssembler(function(assembly){
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
            testingExpression.assembler = createAssembler(function(assembly){
                var value = assembly.pop().value;
                var operand = assembly.pop().value;
                var counter = assembly.pop().value.toUpperCase();
                assembly.push(new commands.TestingExpression(counter, operand, value));
            });
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
        
        this.parser = createJztScriptParser();
        
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
        
        lexer = new jztLexer.Lexer(script);
        tokens = lexer.tokenizeAll();
        assembly = new p.Assembly(tokens);
        result = this.parser.completeMatch(assembly);
        
        if(result === undefined) {
            throw 'Catestrophic script error. No result.';
        }
        
        return result.stack;
        
    };
    
    my.JztScriptParser = JztScriptParser;
    return my;
 
}(jzt.jztscript || {}));