import { Terminal } from './terminal.js';
class Literal extends Terminal { constructor(literalValue, caseSensitive) { super(); this.caseSensitive = caseSensitive; this.literalValue = literalValue; this.discard = false; if (!caseSensitive) this.literalValue = this.literalValue.toUpperCase(); } qualifies(token) { var value = token.value; if (typeof value === 'string' && !this.caseSensitive) value = value.toUpperCase(); return this.literalValue === value; } }
export { Literal };
