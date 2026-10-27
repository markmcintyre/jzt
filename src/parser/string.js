import { Terminal } from './terminal.js';
class String extends Terminal { qualifies(token) { return token.name === 'STRING'; } }
export { String };
