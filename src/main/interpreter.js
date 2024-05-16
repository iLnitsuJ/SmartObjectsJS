import escodegen from "escodegen";

class Interpreter {
    constructor (visitor, preprocessVisitor) {
        this.visitor = visitor;
        this.preprocessVisitor = preprocessVisitor;
    }

    interpret (nodes) {
        // UNCOMMENT THE FOLLOWING TO PREPROCESS
        // this.preprocessVisitor.run(nodes);

        return this.visitor.run(nodes);
    }

    interpretProgram (program) {
        const preprocessedNodes = this.preprocessVisitor.run(program.body);
        const code = escodegen.generate(program);
        console.log(code);
    }
}
export default Interpreter;
