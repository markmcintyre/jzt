/**
 * JZTScript
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
var jzt = jzt || {};
jzt.jztscript = (function(my){
 
    'use strict';
    
    var p = jzt.parser;
    
    function JztScript(validateOnly) {
     
        if(!(this instanceof JztScript)) {
            throw jzt.ConstructorError;
        }
        
        this.jztscript = createJztScriptParser(validateOnly);
        
    }
    
    JztScript.prototype.parseScript = function(script) {
        
        var lexer = new jzt.lexer.Lexer(script);
        var tokens = lexer.tokenizeAll();
        var assembly = new p.Assembly(tokens);
        var result;
        
        result = this.jztscript.completeMatch(assembly);
        
        if(result === undefined) {// || result.target === undefined) {
            throw 'Catestrophic script error.';
        }
        
        return result.target;
        
    };
    
    function createJztScriptParser(validateOnly) {
        
        var program;
        var line = new p.Alternation();
        line.add(createLabelParser(validateOnly));
        line.add(createStatementParser(validateOnly));
        program = new p.Repetition(line);
        return program;
        
    }
    
    function createLabelParser(validateOnly) {
        var label = new p.Sequence();
        label.add(new p.Literal(':'));
        label.add(new p.Word());
        label.add(new p.NewLine());
        return label;
    }
    
    function createStatementParser(validateOnly) {
        var statement = new p.Sequence();
        var statementOptions = new p.Alternation();
        statementOptions.add(createBecomeStatementParser(validateOnly));
        statementOptions.add(createChangeStatementParser(validateOnly));
        statementOptions.add(createCharStatementParser(validateOnly));
        statementOptions.add(createDieStatementParser(validateOnly));
        statementOptions.add(createEndStatementParser(validateOnly));
        statementOptions.add(createGiveStatementParser(validateOnly));
        statementOptions.add(createIfStatementParser(validateOnly));
        statementOptions.add(createLockStatementParser(validateOnly));
        statementOptions.add(createMoveStatementParser(validateOnly));
        statementOptions.add(createPlayStatementParser(validateOnly));
        statementOptions.add(createPutStatementParser(validateOnly));
        statementOptions.add(createScrollStatementParser(validateOnly));
        statementOptions.add(createSendStatementParser(validateOnly));
        statementOptions.add(createSetStatementParser(validateOnly));
        statementOptions.add(createTakeStatementParser(validateOnly));
        statementOptions.add(createThrowStarStatementParser(validateOnly));
        statementOptions.add(createTorchStatementParser(validateOnly));
        statementOptions.add(createRestoreStatementParser(validateOnly));
        statementOptions.add(createSayStatementParser(validateOnly));
        statementOptions.add(createShootStatementParser(validateOnly));
        statementOptions.add(createStandStatementParser(validateOnly));
        statementOptions.add(createUnlockStatementParser(validateOnly));
        statementOptions.add(createWaitStatementParser(validateOnly));
        statementOptions.add(createWalkStatementParser(validateOnly));
        statementOptions.add(createZapStatementParser(validateOnly));
        statement.add(statementOptions);
        statement.add(new p.NewLine());
        return statement;
    }
    
    function createBecomeStatementParser(validateOnly) {
        var become = new p.Sequence();
        become.addDiscard(new p.Literal('Become'));
        become.add(choice(createColorfulThingParser(), createThingParser()));
        return become;
    }
    
    function createChangeStatementParser(validateOnly) {
        var change = new p.Sequence();
        change.addDiscard(new p.Literal('Change'));
        change.add(choice(createColorfulThingParser(), createThingParser()));
        change.add(choice(createColorfulThingParser(), createThingParser()));
        return change;
    }
    
    function createCharStatementParser(validateOnly) {
        var char = new p.Sequence();
        char.addDiscard(new p.Literal('Char'));
        char.add(new p.Number());
        return char;
    }
    
    function createDieStatementParser(validateOnly) {
        var die = new p.Sequence();
        die.addDiscard(new p.Literal('Die'));
        die.add(optional(new p.Literal('magnetically')));
        return die;
    }
    
    function createEndStatementParser(validateOnly) {
        var endStatement = new p.Literal('End');
        endStatement.discard = true;
        return endStatement;
    }
    
    function createGiveStatementParser(validateOnly) {
        var give = new p.Sequence();
        give.addDiscard(new p.Literal('Give'));
        give.add(new p.Number());
        give.add(new p.Word());
        return give;
    }
    
    function createIfStatementParser(validateOnly) {
        var ifStatement = new p.Sequence();
        ifStatement.addDiscard(new p.Literal('If'));
        ifStatement.add(createExpressionParser());
        ifStatement.add(new p.Word());
        return ifStatement;
    }
    
    function createLockStatementParser(validateOnly) {
        var lock = new p.Literal('Lock');
        lock.discard = true;
        return lock;
    }
    
    function createMoveStatementParser(validateOnly) {
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
    
    function createPlayStatementParser(validateOnly) {
        var play = new p.Sequence();
        play.addDiscard(new p.Literal('Play'));
        play.add(new p.String());
        return play;
    }
    
    function createPutStatementParser(validateOnly) {
        var put = new p.Sequence();
        put.addDiscard(new p.Literal('Put'));
        put.add(createDirectionParser());
        put.add(choice(createThingParser(), createColorfulThingParser()));
        return put;
    }
    
    function createScrollStatementParser(validateOnly) {
        var scroll = new p.Sequence();
        scroll.addDiscard(new p.Literal('Scroll'));
        scroll.add(optional(new p.Literal('Bold')));
        scroll.add(new p.String());
        scroll.add(optional(new p.Word()));
        return scroll;
    }
    
    function createSendStatementParser(validateOnly) {
        var send = new p.Sequence();
        send.addDiscard(new p.Literal('Send'));
        send.add(new p.Word());
        send.add(new p.Word());
        return send;
    }
    
    function createSetStatementParser(validateOnly) {
        var set = new p.Sequence();
        set.addDiscard(new p.Literal('Set'));
        set.add(optional(new p.Number()));
        set.add(new p.Word());
        return set;
    }
    
    function createTakeStatementParser(validateOnly) {
        var take = new p.Sequence();
        take.addDiscard(new p.Literal('Take'));
        take.add(new p.Number());
        take.add(new p.Word());
        take.add(optional(new p.Word()));
        return take;
    }
    
    function createThrowStarStatementParser(validateOnly) {
        var throwStar = new p.Sequence();
        throwStar.addDiscard(new p.Literal('ThrowStar'));
        throwStar.add(createDirectionParser());
        return throwStar;
    }
    
    function createTorchStatementParser(validateOnly) {
        var torch = new p.Sequence();
        torch.addDiscard(new p.Literal('Torch'));
        torch.add(optional(new p.Number()));
        return torch;
    }
    
    function createRestoreStatementParser(validateOnly) {
        var restore = new p.Sequence();
        restore.addDiscard(new p.Literal('Restore'));
        restore.add(new p.Word());
        return restore;
    }
    
    function createSayStatementParser(validateOnly) {
        var say = new p.Sequence();
        say.addDiscard(new p.Literal('Say'));
        say.add(new p.String());
        return say;
    }
    
    function createShootStatementParser(validateOnly) {
        var shoot = new p.Sequence();
        shoot.addDiscard(new p.Literal('Shoot'));
        shoot.add(createDirectionParser());
        return shoot;
    }
    
    function createStandStatementParser(validateOnly) {
        var stand = new p.Literal('Stand');
        stand.discard = true;
        return stand;
    }
    
    function createUnlockStatementParser(validateOnly) {
        var unlock = new p.Literal('Unlock');
        unlock.discard = true;
        return unlock;
    }
    
    function createWaitStatementParser(validateOnly) {
        var wait = new p.Sequence();
        wait.addDiscard(new p.Literal('Wait'));
        wait.add(optional(new p.Number()));
        return wait;
    }
    
    function createWalkStatementParser(validateOnly) {
        var walk = new p.Sequence();
        walk.addDiscard(new p.Literal('Walk'));
        walk.add(createDirectionParser());
        return walk;
    }
    
    function createZapStatementParser(validateOnly) {
        var zap = new p.Sequence();
        zap.addDiscard(new p.Literal('Zap'));
        zap.add(new p.Word());
        return zap;
    }
    
    function createCountableDirectionParser(validateOnly) {
        var direction = new p.Sequence();
        direction.add(createDirectionParser());
        direction.add(new p.Number());
        return direction;
    }
    
    function createDirectionParser(validateOnly) {
        var direction = new p.Sequence();
        var modifiers = new p.Repetition(createDirectionModifierParser(validateOnly));
        direction.add(modifiers);
        direction.add(createDirectionTerminalParser());
        return direction;
    }
    
    function createDirectionModifierParser(validateOnly) {
        var directionModifier = new p.Alternation();
        directionModifier.add(new p.Literal('CW'));
        directionModifier.add(new p.Literal('CCW'));
        directionModifier.add(new p.Literal('OPP'));
        directionModifier.add(new p.Literal('RNDP'));
        return directionModifier;
    }
    
    function createDirectionTerminalParser(validateOnly) {
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
    
    function createColorParser(validateOnly) {
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
        return color;
    }
    
    function createThingParser(validateOnly) {
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
        return thing;
    }
    
    function createColorfulThingParser(validateOnly) {
        var colorfulThing = new p.Sequence();
        colorfulThing.add(createColorParser());
        colorfulThing.add(createThingParser());
        return colorfulThing;
    }
    
    function createExpressionParser(validateOnly) {
        var expression = new p.Alternation();
        expression.add(createNotExpressionParser(expression, validateOnly));
        expression.add(createAdjacentExpressionParser(validateOnly));
        expression.add(createBlockedExpressionParser(validateOnly));
        expression.add(createAlignedExpressionParser(validateOnly));
        expression.add(createPeepExpressionParser(validateOnly));
        expression.add(createExistsExpressionParser(validateOnly));
        expression.add(createTestingExpressionParser(validateOnly));
        return expression;
    }
    
    function createNotExpressionParser(expressionParser, validateOnly) {
        var notExpression = new p.Sequence();
        notExpression.addDiscard(new p.Literal('Not'));
        notExpression.add(expressionParser);
        return notExpression;
    }
    
    function createAdjacentExpressionParser(validateOnly) {
        var adjacentExpression = new p.Literal('Adjacent');
        adjacentExpression.discard = true;
        return adjacentExpression;
    }
    
    function createBlockedExpressionParser(validateOnly) {
        var blockedExpression = new p.Sequence();
        blockedExpression.addDiscard(new p.Literal('Blocked'));
        blockedExpression.add(createDirectionParser());
        return blockedExpression;
    }
    
    function createAlignedExpressionParser(validateOnly) {
        var alignedExpression = new p.Sequence();
        alignedExpression.addDiscard(new p.Literal('Aligned'));
        alignedExpression.add(createDirectionParser());
        return alignedExpression;
    }
    
    function createPeepExpressionParser(validateOnly) {
        var peepExpression = new p.Sequence();
        peepExpression.addDiscard(new p.Literal('Peep'));
        peepExpression.add(optional(new p.Number()));
        return peepExpression;
    }
    
    function createExistsExpressionParser(validateOnly) {
        var existsExpression = new p.Sequence();
        existsExpression.addDiscard('Exists');
        existsExpression.add(optional(new p.Number()));
        existsExpression.add(choice(createThingParser(), createColorfulThingParser()));
        return existsExpression;
    }
    
    function createTestingExpressionParser(validateOnly) {
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
    
    my.JztScript = JztScript;
    return my;
 
}(jzt.jztscript || {}));