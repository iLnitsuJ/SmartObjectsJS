import { parse } from "acorn";
import Interpreter from "./interpreter.js";
import AnalysisVisitor from "../visitors/analysisVisitor.js";
import Warnings from "../handlers/warnings.js";
import Errors from "../handlers/errors.js";
import CodeContext from "../utils/codeContext.js";
import Logger from "../utils/logger.js";
import Comments from "../handlers/comments.js";
import PreprocessVisitor from "../visitors/preprocessVisitor.js";

const LOG = Logger.getDefaultLogger();

export function analyzeCode (codeSnippet) {
    const comments = [];
    const ast = parse(codeSnippet, { ecmaVersion: "latest", onComment: comments, locations: true });
    // LOG(comments);
    // console.log(JSON.stringify(ast))

    const commentHandler = new Comments();
    comments.forEach((comment) => commentHandler.processComment(comment));

    const astList = extractFunctions(ast);

    astList.forEach((program) => {
        const interpreter = new Interpreter(new AnalysisVisitor(commentHandler), new PreprocessVisitor());
        // interpreter.interpretProgram(program);
        interpreter.interpret(program.body);
    });

    const warningList = Warnings.getInstance().listAndReset();
    const errorList = Errors.getInstance().listAndReset();

    // CodeContext.debugLog(warningList, errorList);

    return { warnings: warningList, errors: errorList };
}

/**
 * Helper function to extract all inline functions into its own individual AST.
 *
 * Code from inside functions need to evaluated separately.
 * If function code adjusts global objects, see documentation for how to handle these cases.
 * @param {import("acorn").Program} ast
 */
function extractFunctions (ast) {
    const result = [];
    result.push(ast);

    let i = ast.body.length;
    while (i--) {
        const nodeType = ast.body[i].type;
        if (nodeType === "FunctionDeclaration") {
            const functionDeclaration = ast.body.splice(i, 1);

            const astCopy = structuredClone(ast);
            astCopy.body = functionDeclaration;
            result.push(astCopy);
        }
    }

    return result;
}
