import { Terminal } from './terminal.js';
class Number extends Terminal { qualifies(token) { return token.name === 'NUMBER' && !isNaN(token.value); } }
export { Number };
