import { CollectionParser } from './collection-parser.js';
class Sequence extends CollectionParser {
    constructor() { super(); this.assembler = undefined; this.subParsers = []; }
    match(assemblies) { var started = false, previousResult = assemblies, result = assemblies, index, subParser; for (index = 0; index < this.subParsers.length; index += 1) { subParser = this.subParsers[index]; result = subParser.matchAndAssemble(result); if (result.length <= 0) { if (started) this.determineTokenError(previousResult); return result; } started = true; previousResult = result; } return result; }
    determineTokenError(previousResult) { var best = this.findBestAssembly(previousResult), token; if (best.current() === undefined) throw 'Token expected'; token = best.current(); throw 'Unexpected token \'' + token.value + '\' on line ' + token.line + ', column ' + token.column; }
}
export { Sequence };
