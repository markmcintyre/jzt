/**
 * JZT Parser
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node: true */

'use strict';

var ConstructorError = require('./basic').ConstructorError;

/*
 * Assembly
 */
function Assembly(tokens) {

    if (!(this instanceof Assembly)) {
        throw ConstructorError;
    }

    this.tokens = tokens;
    this.index = 0;
    this.stack = [];
    this.target = undefined;

}

Assembly.prototype.clone = function () {
    var result = new Assembly();
    result.tokens = this.tokens.slice(0);
    result.index = this.index;
    result.stack = this.stack.slice(0);
    result.target = this.target ? this.target.clone() : undefined;
    return result;
};

Assembly.prototype.current = function () {
    return this.tokens[this.index];
};

Assembly.prototype.peek = function () {
    return this.stack[this.stack.length - 1];
};

Assembly.prototype.pop = function () {
    return this.stack.pop();
};

Assembly.prototype.push = function (item) {
    this.stack.push(item);
};

Assembly.prototype.isDone = function () {
    return this.index >= this.tokens.length;
};

Assembly.prototype.next = function () {
    var result = this.tokens[this.index];
    this.index += 1;
    return result;
};

/*
 * Parser
 */
function Parser() {
    if (!(this instanceof Parser)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
}

Parser.prototype.match = function () {
    return [];
};

Parser.prototype.bestMatch = function (assembly) {
    var result = this.matchAndAssemble([assembly]);
    return this.findBestAssembly(result);
};

Parser.prototype.completeMatch = function (assembly) {
    var result = this.bestMatch(assembly),
        token;
    if (result !== undefined && result.isDone()) {
        return result;
    }

    token = result.current();
    throw 'Unexpected token \'' + token.value + '\' on line ' + token.line + ', column ' + token.column;
};

Parser.prototype.matchAndAssemble = function (assemblies) {

    var result = this.match(assemblies),
        index;

    // If we've got an assembler, have it assemble
    if (this.assembler) {

        for (index = 0; index < result.length; index += 1) {
            this.assembler.assemble(result[index]);
        }
    }

    return result;

};

Parser.prototype.findBestAssembly = function (assemblies) {

    var bestAssembly,
        index,
        assembly;

    for (index = 0; index < assemblies.length; index += 1) {

        assembly = assemblies[index];

        if (!bestAssembly) {
            bestAssembly = assembly;
        } else if (assembly.index > bestAssembly.index) {
            bestAssembly = assembly;
        }
    }

    return bestAssembly;

};

Parser.prototype.cloneAssemblies = function (assemblies) {

    var result = [], index, assembly;

    for (index = 0; index < assemblies.length; index += 1) {
        assembly = assemblies[index];
        result.push(assembly.clone());
    }

    return result;

};

/*
 * Repetition
 */
function Repetition(subParser) {

    if (!(this instanceof Repetition)) {
        throw ConstructorError;
    }

    if (!subParser) {
        throw 'Subparser is required.';
    }
    this.subParser = subParser;
    this.assembler = undefined;
    this.preAssembler = undefined;
}
Repetition.prototype = new Parser();
Repetition.prototype.constructor = Repetition;

Repetition.prototype.match = function (assemblies) {

    var index, assembly, result;

    // If we have a preassember, assemble now
    if (this.preAssembler !== undefined) {
        for (index = 0; index < assemblies.length; index += 1) {
            assembly = assemblies[index];
            this.preAssembler.assemble(assembly);
        }
    }

    result = this.cloneAssemblies(assemblies);
    while (assemblies.length > 0) {
        assemblies = this.subParser.matchAndAssemble(assemblies);
        result = result.concat(assemblies);
    }

    return result;

};

/*
 * Empty
 */
function Empty() {
    if (!(this instanceof Empty)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
}
Empty.prototype = new Parser();
Empty.prototype.constructor = Empty;

Empty.prototype.match = function (assemblies) {
    return this.cloneAssemblies(assemblies);
};

/*
 * CollectionParser
 */
function CollectionParser() {
    if (!(this instanceof CollectionParser)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.subParsers = [];
}
CollectionParser.prototype = new Parser();
CollectionParser.constructor = CollectionParser;

CollectionParser.prototype.add = function (subParser) {
    this.subParsers.push(subParser);
};

CollectionParser.prototype.addDiscard = function (subParser) {
    subParser.discard = true;
    this.subParsers.push(subParser);
};

/*
 * Sequence
 */
function Sequence() {
    if (!(this instanceof Sequence)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.subParsers = [];
}
Sequence.prototype = new CollectionParser();
Sequence.prototype.constructor = Sequence;

Sequence.prototype.match = function (assemblies) {

    var started = false,
        previousResult = assemblies,
        result = assemblies,
        index,
        subParser;

    for (index = 0; index < this.subParsers.length; index += 1) {

        subParser = this.subParsers[index];

        result = subParser.matchAndAssemble(result);
        if (result.length <= 0) {
            if (started) {
                this.determineTokenError(previousResult);
            }
            return result;
        }

        started = true;
        previousResult = result;

    }

    return result;

};

Sequence.prototype.determineTokenError = function (previousResult) {

    var best = this.findBestAssembly(previousResult),
        token;

    if (best.current() === undefined) {
        throw 'Token expected';
    }

    token = best.current();
    throw 'Unexpected token \'' + token.value + '\' on line ' + token.line + ', column ' + token.column;

};

/*
 * Alternation
 */
function Alternation() {
    if (!(this instanceof Alternation)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.subParsers = [];
}
Alternation.prototype = new CollectionParser();
Alternation.prototype.constructor = Alternation;

Alternation.prototype.match = function (assemblies) {

    var result = [],
        error,
        subParser,
        alternationResult,
        index;

    for (index = 0; index < this.subParsers.length; index += 1) {
        subParser = this.subParsers[index];
        try {
            alternationResult = subParser.matchAndAssemble(assemblies);
            result = result.concat(alternationResult);
        } catch (tokenError) {
            error = tokenError;
        }
    }

    if (result.length <= 0 && error !== undefined) {
        throw error;
    }

    return result;

};

/*
 * Terminal
 */
function Terminal() {
    if (!(this instanceof Terminal)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.discard = false;
}
Terminal.prototype = new Parser();
Terminal.prototype.constructor = Terminal;


Terminal.prototype.qualifies = function () {
    return true;
};

Terminal.prototype.match = function (assemblies) {

    var result = [], index, assembly, assemblyResult;

    for (index = 0; index < assemblies.length; index += 1) {
        assembly = assemblies[index];
        assemblyResult = this.matchAssembly(assembly);
        if (assemblyResult !== undefined) {
            result.push(assemblyResult);
        }
    }

    return result;

};

Terminal.prototype.matchAssembly = function (assembly) {

    var result,
        token;

    if (assembly.isDone()) {
        return undefined;
    }

    if (this.qualifies(assembly.current())) {

        result = assembly.clone();

        token = result.next();
        if (!this.discard) {
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
    if (!(this instanceof Number)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.discard = false;
}
Number.prototype = new Terminal();

Number.prototype.qualifies = function (token) {
    return token.name === 'NUMBER' && !isNaN(token.value);
};

/*
 * Literal
 */
function Literal(literalValue, caseSensitive) {
    if (!(this instanceof Literal)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.caseSensitive = caseSensitive;
    this.literalValue = literalValue;
    this.discard = false;
    if (!caseSensitive) {
        this.literalValue = this.literalValue.toUpperCase();
    }

}
Literal.prototype = new Terminal();
Literal.prototype.constructor = Literal;

Literal.prototype.qualifies = function (token) {

    var value = token.value;

    if (typeof value === 'string' && !this.caseSensitive) {
        value = value.toUpperCase();
    }

    return this.literalValue === value;

};

/*
 * Word
 */
function Word() {
    if (!(this instanceof Word)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.discard = false;
}
Word.prototype = new Terminal();
Word.prototype.constructor = Word;
Word.prototype.qualifies = function (token) {

    if (token.name === 'WORD') {
        return isNaN(parseInt(token.value, 10));
    }

    return false;

};

/*
 * String
 */
function String() {
    if (!(this instanceof String)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.discard = false;
}
String.prototype = new Terminal();
String.prototype.constructor = String;
String.prototype.qualifies = function (token) {
    return token.name === 'STRING';
};

/*
 * NewLine
 */
function NewLine() {
    if (!(this instanceof NewLine)) {
        throw ConstructorError;
    }
    this.assembler = undefined;
    this.discard = false;
}
NewLine.prototype = new Terminal();
NewLine.prototype.constructor = NewLine;
NewLine.prototype.qualifies = function (token) {
    return token.name === 'NEWLINE';
};

exports.Alternation = Alternation;
exports.Assembly = Assembly;
exports.Parser = Parser;
exports.Repetition = Repetition;
exports.CollectionParser = CollectionParser;
exports.Sequence = Sequence;
exports.Empty = Empty;
exports.Terminal = Terminal;
exports.Literal = Literal;
exports.NewLine = NewLine;
exports.Number = Number;
exports.String = String;
exports.Word = Word;
