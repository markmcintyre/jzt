/**
 * JZT Parser
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

"use strict";

var jzt = jzt || {};
jzt.parser = jzt.parser || {};


/* 
 * Assembly
 */
jzt.parser.Assembly = function(text) {
    
    this.tokens = text !== undefined ? text.match(/\w+|"(?:\\"|[^"])+"|""|[^\s]|\n/g) : [];
    
    // If the regex doesn't match, it returns null
    if(this.tokens === null) {
        this.tokens = [];
    }
    
    this.index = 0;
    this.stack = [];
    this.target = undefined;
    
};

jzt.parser.Assembly.prototype.clone = function() {
    var result = new jzt.parser.Assembly();
    if(this.error) {
        result.error = this.error;
    }
    result.tokens = this.tokens.slice(0);
    result.index = this.index;
    result.stack = this.stack.slice(0);
    result.target = this.target ? this.target.clone() : undefined;
    return result;
};

jzt.parser.Assembly.prototype.peek = function() {
    return this.tokens[this.index];
};

jzt.parser.Assembly.prototype.isDone = function() {
    return this.index >= this.tokens.length;
};

jzt.parser.Assembly.prototype.next = function() {
    return this.tokens[this.index++];
};

/*
 * Parser
 */
jzt.parser.Parser = function() {
    this.assembler = undefined;
};

jzt.parser.Parser.prototype.match = function() {
    return [];
};

jzt.parser.Parser.prototype.bestMatch = function(assembly) {
    var result = this.matchAndAssemble([assembly]);
    return this.findBestAssembly(result);
};

jzt.parser.Parser.prototype.completeMatch = function(assembly) {
    var result = this.bestMatch(assembly);
    if(result !== undefined && result.isDone()) {
        return result;
    }
    throw 'Unexpected token \'' + result.peek() + '\'';
};

jzt.parser.Parser.prototype.matchAndAssemble = function(assemblies) {
    
    var result = this.match(assemblies);

    // If we've got an assembler, have it assemble
    if(this.assembler) {
        
        for(var index = 0; index < result.length; ++index) {
            this.assembler.assemble(result[index]);
        }
    }
    
    return result;
    
};

jzt.parser.Parser.prototype.findBestAssembly = function(assemblies) {
    
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

jzt.parser.Parser.prototype.cloneAssemblies = function(assemblies) {

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
jzt.parser.Repetition = function(subParser) {
    if(!subParser) {
        throw 'Subparser is required.';
    }
    this.subParser = subParser;
    this.assembler = undefined;
    this.preAssembler = undefined;
};
jzt.parser.Repetition.prototype = new jzt.parser.Parser();
jzt.parser.Repetition.prototype.constructor = jzt.parser.Reptition;

jzt.parser.Repetition.prototype.match = function(assemblies) {
    
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
jzt.parser.Empty = function() {
    this.assembler = undefined;
};
jzt.parser.Empty.prototype = new jzt.parser.Parser();
jzt.parser.Empty.prototype.constructor = jzt.parser.Empty;

jzt.parser.Empty.prototype.match = function(assemblies) {
    return this.cloneAssemblies(assemblies);
};

/*
 * CollectionParser
 */
jzt.parser.CollectionParser = function() {
    this.assembler = undefined;
    this.subParsers = [];
};
jzt.parser.CollectionParser.prototype = new jzt.parser.Parser();
jzt.parser.CollectionParser.constructor = jzt.parser.CollectionParser;

jzt.parser.CollectionParser.prototype.add = function(subParser) {
    this.subParsers.push(subParser);
};
 
/*
 * Sequence
 */
jzt.parser.Sequence = function() {
    this.assembler = undefined;
    this.subParsers = [];
};
jzt.parser.Sequence.prototype = new jzt.parser.CollectionParser();
jzt.parser.Sequence.prototype.constructor = jzt.parser.Sequence;

jzt.parser.Sequence.prototype.match = function(assemblies) {
    
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

jzt.parser.Sequence.prototype.determineTokenError = function(previousResult) {
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
jzt.parser.Alternation = function() {
    this.assembler = undefined;
    this.subParsers = [];
};
jzt.parser.Alternation.prototype = new jzt.parser.CollectionParser();
jzt.parser.Alternation.prototype.constructor = jzt.parser.Alternation;

jzt.parser.Alternation.prototype.match = function(assemblies) {
    
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
jzt.parser.Terminal = function() {
    this.assembler = undefined;
    this.discard = false;
};
jzt.parser.Terminal.prototype = new jzt.parser.Parser();
jzt.parser.Terminal.prototype.constructor = jzt.parser.Terminal;


jzt.parser.Terminal.prototype.qualifies = function() {
    return true;
};

jzt.parser.Terminal.prototype.match = function(assemblies) {
    
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

jzt.parser.Terminal.prototype.matchAssembly = function(assembly) {
    
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
jzt.parser.Number = function() {
    this.assembler = undefined;
    this.discard = false;
};
jzt.parser.Number.prototype = new jzt.parser.Terminal();

jzt.parser.Number.prototype.qualifies = function(token) {
    return ! isNaN(parseInt(token, 10));
};

/*
 * Literal
 */
jzt.parser.Literal = function(literalValue, caseSensitive) {
    this.assembler = undefined;
    this.caseSensitive = caseSensitive;
    this.literalValue = literalValue;
    this.discard = false;
    if(!caseSensitive) {
        this.literalValue = this.literalValue.toUpperCase();
    }
    
};
jzt.parser.Literal.prototype = new jzt.parser.Terminal();
jzt.parser.Literal.prototype.constructor = jzt.parser.Literal;

jzt.parser.Literal.prototype.qualifies = function(token) {
    if(!this.caseSensitive && token) {
        token = token.toUpperCase();
    }
    return this.literalValue === token;
};

/*
 * Word
 */
jzt.parser.Word = function(){
    this.assembler = undefined;
    this.discard = false;
};
jzt.parser.Word.prototype = new jzt.parser.Terminal();
jzt.parser.Word.prototype.constructor = jzt.parser.Word;
jzt.parser.Word.prototype.qualifies = function(token) {
    if(token) {
        return token.match(/^[^\d\s][\w]*$/) !== null;
    }
    return false;
};

/*
 * String
 */
jzt.parser.String = function() {
    this.assembler = undefined;
    this.discard = false;
};
jzt.parser.String.prototype = new jzt.parser.Terminal();
jzt.parser.String.prototype.constructor = jzt.parser.String;
jzt.parser.String.prototype.qualifies = function(token) {
    if(token) {
        return (token.charAt(0) === '"' && token.charAt(token.length-1) === '"');
    }
    return false;
};

/*
 * NewLine
 */
jzt.parser.NewLine = function(){
    this.assembler = undefined;
    this.discard = false;
};
jzt.parser.NewLine.prototype = new jzt.parser.Terminal();
jzt.parser.NewLine.prototype.constructor = jzt.parser.NewLine;
jzt.parser.NewLine.prototype.qualifies = function(token) {
    return token === '\n';
};

/*
 * Optional convenience parsers and methods
 */
jzt.parser.optional = function(parser) {
    var result = new jzt.parser.Alternation();
    result.add(parser);
    result.add(new jzt.parser.Empty());
    return result;
};

jzt.parser.discard = function(terminal) {
    terminal.discard = true;
    return terminal;
};

jzt.parser.processString = function(token) {
    // Remove opening quotes, closing quotes and single slashes
    return token.replace(/^\"|\\(?!\\)|\"$/g, '');
};