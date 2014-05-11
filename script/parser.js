/**
 * JZT Parser
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt = jzt || {};
jzt.parser = (function(my){
    
    'use strict';
    
    /* 
     * Assembly
     */
    function Assembly(text) {
        
        if(!(this instanceof Assembly)) {
            throw jzt.ConstructorError;
        }

        this.tokens = text !== undefined ? text.match(/\w+|"(?:\\"|[^"])+"|""|[^\s]|\n/g) : [];

        // If the regex doesn't match, it returns null
        if(this.tokens === null) {
            this.tokens = [];
        }

        this.index = 0;
        this.stack = [];
        this.target = undefined;

    }

    Assembly.prototype.clone = function() {
        var result = new Assembly();
        if(this.error) {
            result.error = this.error;
        }
        result.tokens = this.tokens.slice(0);
        result.index = this.index;
        result.stack = this.stack.slice(0);
        result.target = this.target ? this.target.clone() : undefined;
        return result;
    };

    Assembly.prototype.peek = function() {
        return this.tokens[this.index];
    };

    Assembly.prototype.isDone = function() {
        return this.index >= this.tokens.length;
    };

    Assembly.prototype.next = function() {
        return this.tokens[this.index++];
    };

    /*
     * Parser
     */
    function Parser() {
        if(!(this instanceof Parser)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
    }

    Parser.prototype.match = function() {
        return [];
    };

    Parser.prototype.bestMatch = function(assembly) {
        var result = this.matchAndAssemble([assembly]);
        return this.findBestAssembly(result);
    };

    Parser.prototype.completeMatch = function(assembly) {
        var result = this.bestMatch(assembly);
        if(result !== undefined && result.isDone()) {
            return result;
        }
        throw 'Unexpected token \'' + result.peek() + '\'';
    };

    Parser.prototype.matchAndAssemble = function(assemblies) {

        var result = this.match(assemblies);

        // If we've got an assembler, have it assemble
        if(this.assembler) {

            for(var index = 0; index < result.length; ++index) {
                this.assembler.assemble(result[index]);
            }
        }

        return result;

    };

    Parser.prototype.findBestAssembly = function(assemblies) {

        var bestAssembly;

        for(var index = 0; index < assemblies.length; ++index) {

            var assembly = assemblies[index];

            if(!bestAssembly) {
                bestAssembly = assembly;
            }
            else if(assembly.index > bestAssembly.index) {
                bestAssembly = assembly;
            }
        }

        return bestAssembly;

    };

    Parser.prototype.cloneAssemblies = function(assemblies) {

        var result = [];

        for(var index = 0; index < assemblies.length; ++index) {
            var assembly = assemblies[index];
            result.push(assembly.clone());
        }

        return result;

    };

    /*
     * Repetition
     */
    function Repetition(subParser) {
        
        if(!(this instanceof Repetition)) {
            throw jzt.ConstructorError;
        }
        
        if(!subParser) {
            throw 'Subparser is required.';
        }
        this.subParser = subParser;
        this.assembler = undefined;
        this.preAssembler = undefined;
    }
    Repetition.prototype = new Parser();
    Repetition.prototype.constructor = Repetition;

    Repetition.prototype.match = function(assemblies) {

        // If we have a preassember, assemble now
        if(this.preAssembler !== undefined) {
            for(var index = 0; index < assemblies.length; ++index) {
                var assembly = assemblies[index];
                this.preAssembler.assemble(assembly);
            }
        }

        var result = this.cloneAssemblies(assemblies);
        while(assemblies.length > 0) {
            assemblies = this.subParser.matchAndAssemble(assemblies);
            result = result.concat(assemblies);
        }

        return result;

    };

    /*
     * Empty
     */
    function Empty() {
        if(!(this instanceof Empty)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
    }
    Empty.prototype = new Parser();
    Empty.prototype.constructor = Empty;

    Empty.prototype.match = function(assemblies) {
        return this.cloneAssemblies(assemblies);
    };

    /*
     * CollectionParser
     */
    function CollectionParser() {
        if(!(this instanceof CollectionParser)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.subParsers = [];
    }
    CollectionParser.prototype = new Parser();
    CollectionParser.constructor = CollectionParser;

    CollectionParser.prototype.add = function(subParser) {
        this.subParsers.push(subParser);
    };

    /*
     * Sequence
     */
    function Sequence() {
        if(!(this instanceof Sequence)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.subParsers = [];
    }
    Sequence.prototype = new CollectionParser();
    Sequence.prototype.constructor = Sequence;

    Sequence.prototype.match = function(assemblies) {

        var started = false;
        var previousResult = assemblies;
        var result = assemblies;

        for(var index = 0; index < this.subParsers.length; ++index) {

            var subParser = this.subParsers[index];

            result = subParser.matchAndAssemble(result);
            if(result.length <= 0) {
                if(started) {
                    this.determineTokenError(previousResult);
                }
                return result;
            }

            started = true;
            previousResult = result;

        }

        return result;

    };

    Sequence.prototype.determineTokenError = function(previousResult) {
        var best = this.findBestAssembly(previousResult);
        if(best.peek() === undefined) {
            best.error = 'Token expected';
        }
        else {
            best.error = 'Unexpected token \'' + best.peek() + '\'';
        }
    };

    /*
     * Alternation
     */
    function Alternation() {
        if(!(this instanceof Alternation)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.subParsers = [];
    }
    Alternation.prototype = new CollectionParser();
    Alternation.prototype.constructor = Alternation;

    Alternation.prototype.match = function(assemblies) {

        var result = [];

        for(var index = 0; index < this.subParsers.length; ++index) {
            var subParser = this.subParsers[index];
            var alternationResult = subParser.matchAndAssemble(assemblies);
            result = result.concat(alternationResult);
        }

        return result;

    };

    /*
     * Terminal
     */
    function Terminal() {
        if(!(this instanceof Terminal)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.discard = false;
    }
    Terminal.prototype = new Parser();
    Terminal.prototype.constructor = Terminal;


    Terminal.prototype.qualifies = function() {
        return true;
    };

    Terminal.prototype.match = function(assemblies) {

        var result = [];

        for(var index = 0; index < assemblies.length; ++index) {
            var assembly = assemblies[index];
            var assemblyResult = this.matchAssembly(assembly);
            if(assemblyResult !== undefined) {
                result.push(assemblyResult);
            }
        }

        return result;

    };

    Terminal.prototype.matchAssembly = function(assembly) {

        if(assembly.isDone()) {
            return undefined;
        }

        if(this.qualifies(assembly.peek())) {

            var result = assembly.clone();

            var token = result.next();
            if(!this.discard) {
                result.stack.push(token);
            }
            return result;
        }

        return undefined;

    };

    /*
     *  Number
     */
    function Number() {
        if(!(this instanceof Number)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.discard = false;
    }
    Number.prototype = new Terminal();

    Number.prototype.qualifies = function(token) {
        return ! isNaN(parseInt(token, 10));
    };

    /*
     * Literal
     */
    function Literal(literalValue, caseSensitive) {
        if(!(this instanceof Literal)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.caseSensitive = caseSensitive;
        this.literalValue = literalValue;
        this.discard = false;
        if(!caseSensitive) {
            this.literalValue = this.literalValue.toUpperCase();
        }

    }
    Literal.prototype = new Terminal();
    Literal.prototype.constructor = Literal;

    Literal.prototype.qualifies = function(token) {
        if(!this.caseSensitive && token) {
            token = token.toUpperCase();
        }
        return this.literalValue === token;
    };

    /*
     * Word
     */
    function Word(){
        if(!(this instanceof Word)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.discard = false;
    }
    Word.prototype = new Terminal();
    Word.prototype.constructor = Word;
    Word.prototype.qualifies = function(token) {
        if(token) {
            return token.match(/^[^\d\s][\w]*$/) !== null;
        }
        return false;
    };

    /*
     * String
     */
    function String() {
        if(!(this instanceof String)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.discard = false;
    }
    String.prototype = new Terminal();
    String.prototype.constructor = String;
    String.prototype.qualifies = function(token) {
        if(token) {
            return (token.charAt(0) === '"' && token.charAt(token.length-1) === '"');
        }
        return false;
    };

    /*
     * NewLine
     */
    function NewLine(){
        if(!(this instanceof NewLine)) {
            throw jzt.ConstructorError;
        }
        this.assembler = undefined;
        this.discard = false;
    }
    NewLine.prototype = new Terminal();
    NewLine.prototype.constructor = NewLine;
    NewLine.prototype.qualifies = function(token) {
        return token === '\n';
    };

    /*
     * Optional convenience parsers and methods
     */
    function optional(parser) {
        var result = new Alternation();
        result.add(parser);
        result.add(new Empty());
        return result;
    }

    function discard(terminal) {
        terminal.discard = true;
        return terminal;
    }

    function processString(token) {
        // Remove opening quotes, closing quotes and single slashes
        return token.replace(/^\"|\\(?!\\)|\"$/g, '');
    }
    
    my.optional = optional;
    my.discard = discard;
    my.processString = processString;
    my.Alternation = Alternation;
    my.Assembly = Assembly;
    my.Parser = Parser;
    my.Repetition = Repetition;
    my.CollectionParser = CollectionParser;
    my.Sequence = Sequence;
    my.Empty = Empty;
    my.Terminal = Terminal;
    my.Literal = Literal;
    my.NewLine = NewLine;
    my.Number = Number;
    my.String = String;
    my.Word = Word;
    return my;
    
}(jzt.parser || {}));
