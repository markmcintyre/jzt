/**
 * JZT Lexer
 * Copyright © 2014 Mark McIntyre
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';


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
class Lexer {
    constructor(inputString, skipComments) {
        this.skipComments = skipComments !== undefined ? skipComments : true;
        this.setInput(inputString);
    }

    setInput(inputString) {
        this.position = 0;
        this.buffer = inputString;
        this.bufferLength = this.buffer.length;
        this.line = 1;
        this.column = 1;
    }

    tokenizeAll() {
        var result = [],
            token = this.nextToken();
        while (token) {
            result.push(token);
            token = this.nextToken();
        }

        return result;
    }

    /**
     * Retrieves the next token in our input stream and returns it. If no tokens are left,
     * undefined is returned.
     *
     * @return a next token or undefined
     */
    nextToken() {
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
    }

    getCharacter(offset) {
        var position = offset === undefined ? this.position : this.position + offset;
        if (position < 0 || position >= this.bufferLength) {
            return undefined;
        }
        return this.buffer.charAt(position);
    }

    createCommentToken() {
        var token,
            endPosition;
        endPosition = this.position + '//'.length;
        while (endPosition < this.bufferLength && !isNewLine(this.buffer.charAt(endPosition))) {
            endPosition += 1;
        }
        token = this.createToken('COMMENT', this.buffer.substring(this.position + '//'.length, endPosition), endPosition - this.position);
        return token;
    }

    createStringToken() {
        var token,
            c,
            result = '',
            endPosition;
        endPosition = this.position + 1;
        while (endPosition < this.bufferLength) {
            c = this.buffer.charAt(endPosition);
            if (c === '\\' && this.buffer.charAt(endPosition + 1) === '"') {
                result += '"';
                endPosition += 2;
            } else if (c === '\\' && this.buffer.charAt(endPosition + 1) === 'n') {
                result += '\n';
                endPosition += 2;
            } else {
                if (c === '"') {
                    endPosition += 1;
                    break;
                }
                if (isNewLine(c)) {
                    throw 'Unterminated string literal on line ' + this.line + ', column ' + this.column;
                }
                result += c;
                endPosition += 1;
            }
        }
        token = this.createToken('STRING', result, endPosition - this.position);
        return token;
    }

    createNumberToken() {
        var endPosition = this.position;
        while (endPosition < this.bufferLength && isNumeric(this.buffer.charAt(endPosition))) {
            endPosition += 1;
        }
        return this.createToken('NUMBER', +(this.buffer.substring(this.position, endPosition)), endPosition - this.position);
    }

    createWordToken() {
        var endPosition = this.position;
        while (endPosition < this.bufferLength && isAlphaNumeric(this.buffer.charAt(endPosition))) {
            endPosition += 1;
        }
        return this.createToken('WORD', this.buffer.substring(this.position, endPosition));
    }

    /**
     * Consumes whitespace from our input string
     */
    consumeNonTokens() {
        while (this.position < this.bufferLength) {
            if (!isWhiteSpace(this.getCharacter())) {
                return;
            }
            this.position += 1;
            this.column += 1;
        }
    }

    createToken(name, value, realLength) {
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
    }
}


export { Lexer };
