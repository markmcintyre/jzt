import { Terminal } from './terminal.js';
class NewLine extends Terminal { qualifies(token) { return token.name === 'NEWLINE'; } }
export { NewLine };
