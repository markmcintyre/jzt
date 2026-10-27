class Assembly {
    constructor(tokens) { this.tokens = tokens; this.index = 0; this.stack = []; this.target = undefined; }
    clone() { var result = new Assembly(); result.tokens = this.tokens.slice(0); result.index = this.index; result.stack = this.stack.slice(0); result.target = this.target ? this.target.clone() : undefined; return result; }
    current() { return this.tokens[this.index]; }
    peek() { return this.stack[this.stack.length - 1]; }
    pop() { return this.stack.pop(); }
    push(item) { this.stack.push(item); }
    isDone() { return this.index >= this.tokens.length; }
    next() { var result = this.tokens[this.index]; this.index += 1; return result; }
}
export { Assembly };
