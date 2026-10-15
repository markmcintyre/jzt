import { Parser } from './parser.js';
class Repetition extends Parser {
    constructor(subParser) { super(); if (!subParser) throw 'Subparser is required.'; this.subParser = subParser; this.assembler = undefined; this.preAssembler = undefined; }
    match(assemblies) { var index, assembly, result; if (this.preAssembler !== undefined) for (index = 0; index < assemblies.length; index += 1) { assembly = assemblies[index]; this.preAssembler.assemble(assembly); } result = this.cloneAssemblies(assemblies); while (assemblies.length > 0) { assemblies = this.subParser.matchAndAssemble(assemblies); result = result.concat(assemblies); } return result; }
}
export { Repetition };
