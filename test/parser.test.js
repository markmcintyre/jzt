import test from 'node:test';
import assert from 'node:assert/strict';
import {Lexer} from '../src/lexer.js';
import {Assembly, Literal, Number as NumberParser, Sequence, Alternation, Repetition, Empty, Word} from '../src/parser.js';
const assembly = text => new Assembly(new Lexer(text).tokenizeAll());

test('Assembly clones independently and progresses stack', () => {
  const a = assembly('one 2'); a.push('x'); const b = a.clone();
  assert.equal(b.current().value, 'one'); assert.equal(b.peek(), 'x');
  assert.equal(b.next().value, 'one'); b.push('y'); assert.equal(b.pop(), 'y');
  assert.equal(a.index, 0); assert.equal(a.isDone(), false);
});

test('Literal matching honors case sensitivity and terminal values', () => {
  const insensitive = new Literal('hello');
  assert.equal(insensitive.bestMatch(assembly('HELLO')).isDone(), true);
  assert.equal(new Literal('hello', true).matchAndAssemble([assembly('HELLO')]).length, 0);
  assert.equal(new NumberParser().bestMatch(assembly('12')).peek().value, 12);
});

test('Sequence, alternation and repetition compose parser branches', () => {
  const seq = new Sequence(); seq.add(new Word()); seq.add(new NumberParser());
  assert.equal(seq.completeMatch(assembly('word 12')).isDone(), true);
  const alt = new Alternation(); alt.add(new Literal('yes')); alt.add(new Literal('no'));
  assert.equal(alt.completeMatch(assembly('no')).isDone(), true);
  const rep = new Repetition(new NumberParser());
  assert.equal(rep.bestMatch(assembly('1 2')).isDone(), true);
  assert.equal(new Empty().bestMatch(assembly('x')).index, 0);
});

test('Parser reports exact sequence token boundary errors', () => {
  const seq = new Sequence(); seq.add(new Literal('a')); seq.add(new Literal('b'));
  assert.throws(() => seq.completeMatch(assembly('a c')), e => e === "Unexpected token 'c' on line 1, column 3");
});

test('Sequence reports Token expected when a required parser reaches EOF', () => {
  const seq = new Sequence(); seq.add(new Literal('a')); seq.add(new Literal('b'));
  assert.throws(() => seq.completeMatch(assembly('a')), e => e === 'Token expected');
});

test('Alternation preserves the error from its last attempted branch', () => {
  const short = new Sequence(); short.add(new Literal('a')); short.add(new Literal('b'));
  const long = new Sequence(); long.add(new Literal('a')); long.add(new Literal('c')); long.add(new Literal('d'));
  const alt = new Alternation(); alt.add(short); alt.add(long);
  assert.throws(() => alt.completeMatch(assembly('a c')), e => e === 'Token expected');
});

test('Repetition stops at the first nonmatching token and keeps its best assembly', () => {
  const repetition = new Repetition(new NumberParser());
  const result = repetition.bestMatch(assembly('1 2 word'));
  assert.equal(result.index, 2);
  assert.equal(result.isDone(), false);
  assert.equal(result.current().value, 'word');
  assert.equal(result.peek().value, 2);
});
