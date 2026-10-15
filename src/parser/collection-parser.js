import { Parser } from './parser.js';
class CollectionParser extends Parser { constructor() { super(); this.assembler = undefined; this.subParsers = []; } add(subParser) { this.subParsers.push(subParser); } addDiscard(subParser) { subParser.discard = true; this.subParsers.push(subParser); } }
export { CollectionParser };
