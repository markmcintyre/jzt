import { Terminal } from './terminal.js';
class Word extends Terminal { qualifies(token) { if (token.name === 'WORD') return isNaN(parseInt(token.value, 10)); return false; } }
export { Word };
