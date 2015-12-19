/**
 * JZT Lexer
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ConstructorError = require('basic').ConstructorError;

function isNewLine(character) {
    return character === '\r' || character === '\n';
}

function isWhiteSpace(character) {
    return character === ' ' || character === '\t' || character === '\r';
}

function isAlpha(character) {
    return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') || character === '_';
}

function isNumeric(character) {
    return (character >= '0' && character <= '9');
}

function isAlphaNumeric(character) {
    return isAlpha(character) || isNumeric(character);
}

/**
 * Constructs a new Lexer instance
 * @param inputString Input text to be lexed
 * @param skipComments Whether or not to skip comments from the token stream (default is true)
 */
function Lexer(inputString, skipComments) {

    if (!(this instanceof Lexer)) {
        throw ConstructorError;
    }

    this.skipComments = skipComments !== undefined ? skipComments : true;
    this.setInput(inputString);

}

Lexer.prototype.setInput = function (inputString) {

    this.position = 0;
    this.buffer = inputString;
    this.bufferLength = this.buffer.length;
    this.line = 1;
    this.column = 1;

};

Lexer.prototype.tokenizeAll = function () {

    var result = [],
        token = this.nextToken();
    while (token) {
        result.push(token);
        token = this.nextToken();
    }

    return result;

};

/**
 * Retrieves the next token in our input stream and returns it. If no tokens are left,
 * undefined is returned.
 *
 * @return a next token or undefined
 */
Lexer.prototype.nextToken = function () {

    var c,
        token,
        next;

    // Consume non-tokens first
    this.consumeNonTokens();

    // If there is nothing left to return, exit without a return value
    if (this.position >= this.bufferLength) {
        return;
    }

    c = this.getCharacter();

    // Comment
    if (c === '/' && this.getCharacter(1) === '/') {
        token = this.createCommentToken();
        return this.skipComments ? this.nextToken() : token;
    }

    // String
    if (c === '"') {
        return this.createStringToken();
    }

    // Operator
    if (c === '<' || c === '>' || c === '=' || c === ':') {

        next = this.getCharacter(1);
        if (next === '=' && c !== '=') {
            return this.createToken('OPERATOR', c + next);
        }

        return this.createToken('OPERATOR', c);

    }

    // Punctuation
    if (c === ',') {
        return this.createToken('PUNCTUATION', c);
    }

    // New Line
    if (isNewLine(c)) {
        token = this.createToken('NEWLINE', '[New Line]', 1);
        this.column = 1;
        this.line += 1;
        return token;
    }

    // Number Token
    if (isNumeric(c)) {
        return this.createNumberToken();
    }

    // Word Token
    if (isAlpha(c)) {
        return this.createWordToken();
    }

    throw 'Unrecognized token on line ' + this.line + ', column ' + this.column;


};

/**
 * Gets a character from our input string with an optional offset.
 *
 * @param An optional numerical offset
 * @return a single character from our input string
 */
Lexer.prototype.getCharacter = function (offset) {

    var position = offset === undefined ? this.position : this.position + offset;
    if (position < 0 || position >= this.bufferLength) {
        return undefined;
    }
    return this.buffer.charAt(position);
};

/**
 * Creates a comment token
 */
Lexer.prototype.createCommentToken = function () {

    var token,
        endPosition;

    // The end position is our position plus the length of the comment characters
    endPosition = this.position + '//'.length;

    // Loop until the first new line
    while (endPosition < this.bufferLength && !isNewLine(this.buffer.charAt(endPosition))) {
        endPosition += 1;
    }

    // Create our token
    token = this.createToken('COMMENT', this.buffer.substring(this.position + '//'.length, endPosition), endPosition - this.position);

    // Return our token
    return token;

};

Lexer.prototype.createStringToken = function () {

    var token,
        c,
        result = '',
        endPosition;

    // The end position is our position plus the length of our string character
    endPosition = this.position + 1;

    // Loop until we get a non-escaped string terminal
    while (endPosition < this.bufferLength) {

        // Grab the next character
        c = this.buffer.charAt(endPosition);

        // Determine our next character sequence
        if (c === '\\' && this.buffer.charAt(endPosition + 1) === '"') {

            // We've encounterd an escaped quote
            result += '"';
            endPosition += 2;

        } else if (c === '\\' && this.buffer.charAt(endPosition + 1) === 'n') {

            // We've encountered an escaped newline
            result += '\n';
            endPosition += 2;

        } else {

            // If we encounter an end quote our string is over
            if (c === '"') {
                endPosition += 1;
                break;
            }

            // Newlines are invalid
            if (isNewLine(c)) {
                throw 'Unterminated string literal on line ' + this.line + ', column ' + this.column;
            }

            result += c;
            endPosition += 1;

        }

    }

    // Create our token
    token = this.createToken('STRING', result, endPosition - this.position);

    return token;

};

Lexer.prototype.createNumberToken = function () {

    var endPosition = this.position;
    while (endPosition < this.bufferLength && isNumeric(this.buffer.charAt(endPosition))) {
        endPosition += 1;
    }

    return this.createToken('NUMBER', +(this.buffer.substring(this.position, endPosition)), endPosition - this.position);

};

Lexer.prototype.createWordToken = function () {

    var endPosition = this.position;
    while (endPosition < this.bufferLength && isAlphaNumeric(this.buffer.charAt(endPosition))) {
        endPosition += 1;
    }

    return this.createToken('WORD', this.buffer.substring(this.position, endPosition));

};

/**
 * Consumes whitespace from our input string
 */
Lexer.prototype.consumeNonTokens = function () {

    // Loop through our characters...
    while (this.position < this.bufferLength) {

        if (!isWhiteSpace(this.getCharacter())) {
            return;
        }

        this.position += 1;
        this.column += 1;

    }

};

Lexer.prototype.createToken = function (name, value, realLength) {

    realLength = realLength === undefined ? value.length : realLength;

    var token = {
        name: name,
        value: value,
        line: this.line,
        column: this.column,
        position: this.position
    };

    this.position += realLength;
    this.column += realLength;

    return token;

};

exports.Lexer = Lexer;
