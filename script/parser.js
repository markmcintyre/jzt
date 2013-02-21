window.jzt = window.jzt || {};
jzt.parser = jzt.parser || {};

/* 
 * Assembly
 */
jzt.parser.Assembly = function(text) {
    
    this.tokens = text != undefined ? text.match(/\w+|"(?:\\"|[^"])+"|[^\s]|[\n\r]/g) : [];
    this.index = 0;
    this.stack = [];
    
};

jzt.parser.Assembly.prototype.clone = function() {
    var result = new jzt.parser.Assembly();
    result.tokens = this.tokens.slice(0);
    result.index = 0;
    result.stack = this.stack.slice(0);
    
};

jzt.parser.Assembly.prototype.peek = function() {
    return this.tokens[this.tokens.length-1];
};

jzt.parser.Assembly.prototype.isDone = function() {
    return this.index >= this.tokens.length;
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
            bestAssebly = assembly;
        }
    }
    
    return bestAssembly;
    
};

/*
 * Terminal
 */
jzt.parser.Terminal = function() {
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
        result.push(assemblyResult);
    }
    
    return result;
    
};

jzt.parser.Terminal.prototype._matchAssembly = function(assembly) {
    
    if(assembly.isDone) {
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
jzt.parser.NumberTerminal = function() {};
jzt.parser.NumberTerminal.prototype = new jzt.parser.Terminal();

jzt.parser.NumberTerminal.prototype.qualifies = function(token) {
    return ! isNaN(parseInt(token, 10));
};

/*
 * LiteralTerminal
 */
jzt.parser.LiteralTerminal = function(literalValue, caseSensitive) {
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
jzt.parser.WordTerminal = function(){};
jzt.parser.WordTerminal.prototype = new jzt.parser.Terminal();
jzt.parser.WordTerminal.prototype.constructor = jzt.parser.WordTerminal;
jzt.parser.WordTerminal.prototype.qualifies = function(token) {
    if(token) {
        return token.match(/^[^\d\s][\w]*$/) != null;
    }
    return false;
};