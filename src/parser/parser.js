class Parser {
    constructor() { this.assembler = undefined; }
    match() { return []; }
    bestMatch(assembly) { return this.findBestAssembly(this.matchAndAssemble([assembly])); }
    completeMatch(assembly) { var result = this.bestMatch(assembly), token; if (result !== undefined && result.isDone()) return result; token = result.current(); throw 'Unexpected token \'' + token.value + '\' on line ' + token.line + ', column ' + token.column; }
    matchAndAssemble(assemblies) { var result = this.match(assemblies), index; if (this.assembler) for (index = 0; index < result.length; index += 1) this.assembler.assemble(result[index]); return result; }
    findBestAssembly(assemblies) { var bestAssembly, index, assembly; for (index = 0; index < assemblies.length; index += 1) { assembly = assemblies[index]; if (!bestAssembly) bestAssembly = assembly; else if (assembly.index > bestAssembly.index) bestAssembly = assembly; } return bestAssembly; }
    cloneAssemblies(assemblies) { var result = [], index, assembly; for (index = 0; index < assemblies.length; index += 1) { assembly = assemblies[index]; result.push(assembly.clone()); } return result; }
}
export { Parser };
