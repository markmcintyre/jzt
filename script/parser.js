window.jzt = window.jzt || {};
jzt.parser = jzt.parser || {};

/* 
 * Assembly
 */
jzt.parser.Assembly = function(text) {
    
    this.tokens = text != undefined ? text.match(/\w+|"(?:\\"|[^"])+"|[^\s]|\n/g) : [];
    this.index = 0;
    this.stack = [];
    this.target = undefined;
    
};

jzt.parser.Assembly.prototype.clone = function() {
    var result = new jzt.parser.Assembly();
    result.tokens = this.tokens.slice(0);
    result.index = this.index;
    result.stack = this.stack.slice(0);
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

jzt.parser.Parser.prototype.match = function(assemblies) {
    return [];
};

jzt.parser.Parser.prototype.bestMatch = function(assembly) {
    var result = this.matchAndAssemble([assembly]);
    return this.findBestAssembly(result);
};

jzt.parser.Parser.prototype.completeMatch = function(assembly) {
    var result = this.bestMatch(assembly);
    if(result != undefined && result.isDone()) {
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
    
    var bestAssembly = undefined;
    
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

jzt.parser.Parser.prototype._cloneAssemblies = function(assemblies) {
  
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
    if(this.preAssembler != undefined) {
        for(var index = 0; index < assemblies.length; ++index) {
            var assembly = assemblies[index];
            this.preAssembler.assemble(assembly);
        }
    }
    
    var result = this._cloneAssemblies(assemblies);
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
    return this._cloneAssemblies(assemblies);
};

/*
 * CollectionParser
 */
jzt.parser.CollectionParser = function() {
    this.assembler = undefined;
    this.subParsers = [];
}
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
                this._throwSequenceException(previousResult, subParser);
            }
            return result;
        }
        
        started = true;
        previousResult = result;
        
    }
    
    return result;
    
};

jzt.parser.Sequence.prototype._throwSequenceException = function(previousResult, subParser) {
    var best = this.findBestAssembly(previousResult);
    if(best.peek() == undefined) {
        throw 'Token expected';
    }
    else {
        throw 'Unexpected token \'' + best.peek() + '\'';
    }
};

/*
 * Alternation
 */
jzt.parser.Alternation = function() {
    this.assembler = undefined;
    this.subParsers = [];
}
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


jzt.parser.Terminal.prototype.qualifies = function(token) {
    return true;  
};

jzt.parser.Terminal.prototype.match = function(assemblies) {
    
    var result = [];
    
    for(var index = 0; index < assemblies.length; ++index) {
        var assembly = assemblies[index];
        var assemblyResult = this._matchAssembly(assembly);
        if(assemblyResult != undefined) {
            result.push(assemblyResult);
        }
    }
    
    return result;
    
};

jzt.parser.Terminal.prototype._matchAssembly = function(assembly) {
    
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
 *  NumberTerminal
 */ 
jzt.parser.NumberTerminal = function() {
    this.assembler = undefined;
};
jzt.parser.NumberTerminal.prototype = new jzt.parser.Terminal();

jzt.parser.NumberTerminal.prototype.qualifies = function(token) {
    return ! isNaN(parseInt(token, 10));
};

/*
 * LiteralTerminal
 */
jzt.parser.LiteralTerminal = function(literalValue, caseSensitive) {
    this.assembler = undefined;
    this.caseSensitive = caseSensitive;
    this.literalValue = literalValue;
    if(!caseSensitive) {
        this.literalValue = this.literalValue.toUpperCase();
    }
    
};
jzt.parser.LiteralTerminal.prototype = new jzt.parser.Terminal();
jzt.parser.LiteralTerminal.prototype.constructor = jzt.parser.LiteralTerminal;

jzt.parser.LiteralTerminal.prototype.qualifies = function(token) {
    if(!this.caseSensitive && token) {
        token = token.toUpperCase();
    }
    return this.literalValue === token;
};

/*
 * WordTerminal
 */
jzt.parser.WordTerminal = function(){
    this.assembler = undefined;
};
jzt.parser.WordTerminal.prototype = new jzt.parser.Terminal();
jzt.parser.WordTerminal.prototype.constructor = jzt.parser.WordTerminal;
jzt.parser.WordTerminal.prototype.qualifies = function(token) {
    if(token) {
        return token.match(/^[^\d\s][\w]*$/) != null;
    }
    return false;
};

/*
 * NewLineTerminal
 */
jzt.parser.NewLineTerminal = function(){
    this.assembler = undefined;
};
jzt.parser.NewLineTerminal.prototype = new jzt.parser.Terminal();
jzt.parser.NewLineTerminal.prototype.constructor = jzt.parser.NewLineTerminal;
jzt.parser.NewLineTerminal.prototype.qualifies = function(token) {
    return token === '\n';
};

/*
 * Optional convenience parser
 */
jzt.parser.optional = function(parser) {
    var result = new jzt.parser.Alternation();
    result.add(parser);
    result.add(new jzt.parser.Empty());
    return result;
};