import test from 'node:test';
import assert from 'node:assert/strict';
import {Lexer} from '../src/lexer.js';

test('Lexer emits names, values and source positions', () => {
  const tokens = new Lexer('word 123 "hello\\nworld" <= >= // note\nnext', false).tokenizeAll();
  assert.deepEqual(tokens.map(({name, value}) => ({name, value})), [
    {name:'WORD', value:'word'}, {name:'NUMBER', value:123}, {name:'STRING', value:'hello\nworld'},
    {name:'OPERATOR', value:'<='}, {name:'OPERATOR', value:'>='},
    {name:'COMMENT', value:' note'}, {name:'NEWLINE', value:'[New Line]'}, {name:'WORD', value:'next'}
  ]);
  assert.deepEqual(tokens[0], {name:'WORD', value:'word', line:1, column:1, position:0});
  assert.equal(tokens.at(-1).line, 2);
  assert.equal(tokens.at(-1).column, 1);
});

test('Lexer skips comments by default and handles punctuation/operators', () => {
  const tokens = new Lexer('A,B:>=\nC').tokenizeAll();
  assert.deepEqual(tokens.map(t => t.name), ['WORD','PUNCTUATION','WORD','OPERATOR','OPERATOR','NEWLINE','WORD']);
  assert.equal(tokens[1].value, ',');
});

test('Lexer reports unterminated strings and unknown tokens', () => {
  assert.throws(() => new Lexer('"oops\n').tokenizeAll(), e => e === 'Unterminated string literal on line 1, column 1');
  assert.throws(() => new Lexer('@').tokenizeAll(), e => e === 'Unrecognized token on line 1, column 1');
});
