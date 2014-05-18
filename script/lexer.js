/**
 * JZT Lexer
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */
 
var jzt = jzt || {};
jzt.lexer = (function(my){
 
    'use strict';
    
    /**
     * Constructs a new Lexer instance
     * @param inputString Input text to be lexed
     */
    function Lexer(inputString) {
        
        if(!(this instanceof Lexer)) {
            throw jzt.ConstructorError;
        }
        
        this.setInput(inputString);
        
    }
    
    Lexer.prototype.setInput = function(inputString) {
        
        this.position = 0;
        this.buffer = inputString;
        this.bufferLength = inputString.length;
        this.line = 1;
        this.column = 0;
        
    };
    
    /**
     * Retrieves the next token in our input stream and returns it. If no tokens are left,
     * undefined is returned.
     *
     * @return a next token or undefined
     */
    Lexer.prototype.nextToken = function() {
        
        var c;
        var token;
        
        // Consume non-tokens first
        this.consumeNonTokens();
        
        // If there is nothing left to return, exit without a return value
        if(this.position >= this.bufferLength) {
            return;
        }
        
        c = this.getCharacter();
        
        // Comment
        if(c === '/' && this.getCharacter(1) === '/') {
            return this.createCommentToken();
        }
        
        // String
        else if(c === '"') {
            return this.createStringToken();
        }
        
        // Operator
        else if(c === '<' || c === '>' || c === '=' || c === '!') {
         
            var next = this.getCharacter(1);
            if(next === '=' && c !== '=') {
                return this.createToken('OPERATOR', c + next);
            }
            else {
                return this.createToken('OPERATOR', c);
            }
            
        }
        
        // New Line
        else if(isNewLine(c)) {
            token = this.createToken('NEWLINE', '\n');
            this.column = 0;
            this.line++;
            return token;
        }
        
        // Word Token
        else if(isAlphaNumeric(c)) {
            return this.createWordToken();
        }
        
        throw 'Unrecognized token starting at position ' + this.position;
    
        
    };
    
    /**
     * Gets a character from our input string with an optional offset.
     * 
     * @param An optional numerical offset
     * @return a single character from our input string
     */
    Lexer.prototype.getCharacter = function(offset) {

        var position = offset === undefined ? this.position : this.position + offset;
        if(position < 0 || position >= this.bufferLength) {
            return undefined;
        }
        else {
            return this.buffer.charAt(position);
        }

    };

    /**
     * Creates a comment token
     */
    Lexer.prototype.createCommentToken = function() {

        var token;

        // The end position is our position plus the length of the comment characters
        var endPosition = this.position + '//'.length;

        // Loop until the first new line
        while(endPosition < this.bufferLength && !isNewLine(this.buffer.charAt(endPosition))) {
            endPosition++;
        }

        // Create our token
        token = this.createToken('COMMENT', this.buffer.substring(this.position + '//'.length, endPosition), endPosition - this.position);

        // Return our token
        return token;

    };
    
    Lexer.prototype.createStringToken = function() {
        
        var token;
        
        // The end position is our position plus the length of our string character
        var endPosition = this.position + 1;
        
        // Loop until we get a non-escaped string terminal
        while(endPosition < this.bufferLength && this.buffer.charAt(endPosition) === '"' && this.buffer.charAt(endPosition-1) !== '\\') {
            endPosition++;
        }
        
        // Create our token
        token = this.createToken('STRING', this.buffer.substring(this.position + 1, endPosition - 1), endPosition - this.position);
        
        return token;
        
    };
                                                  
    Lexer.prototype.createWordToken = function() {
        
        var token;
        
        var endPosition = this.position;
        while(endPosition < this.bufferLength && isAlphaNumeric(this.buffer.charAt(endPosition))) {
            endPosition++;
        }
        
        token = this.createToken('WORD', this.buffer.substring(this.position, endPosition));
        
        return token;
              
    };

    /** 
     * Consumes whitespace from our input string
     */
    Lexer.prototype.consumeNonTokens = function() {

        // Loop through our characters...
        while(this.position < this.bufferLength) {

            if(!isWhiteSpace(this.getCharacter())) {
                return;
            }

            this.position++;
            this.column++;

        }

    };
    
    Lexer.prototype.createToken = function(name, value, realLength) {
        
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
    
    function isNewLine(character) {
        return character === '\r' || character === '\n';
    }
    
    function isWhiteSpace(character) {
        return character === ' ' || character === '\t' || character === '\r';
    }
    
    function isAlphaNumeric(character) {
        return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') ||
           (character >= '0' && character <= '9') || character === '_';
    }
    
    my.Lexer = Lexer;
    return my;
 
}(jzt.lexer || {}));