import { Parser } from './parser.js';
class Empty extends Parser { constructor() { super(); this.assembler = undefined; } match(assemblies) { return this.cloneAssemblies(assemblies); } }
export { Empty };
