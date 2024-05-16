import CodeContext from "../utils/codeContext.js";
import Errors from "../handlers/errors.js";
import Logger from "../utils/logger.js";
import Memory from "../handlers/memory.js";
import Warnings from "../handlers/warnings.js";

// const memory = Memory.getInstance();
const warnings = Warnings.getInstance();
const errors = Errors.getInstance();
const LOG = Logger.getDefaultLogger();
let MODE = "DEFAULT";

class VisitorRuntimeError extends Error {
    constructor (message = "", ...args) {
        super(message, ...args);
    }
}

class UnsupportedFeatureError extends Error {
    constructor (message = "", ...args) {
        super(message, ...args);
    }
}

/**
 * Visitor class to walk the AST and perform object analysis
 */
class AnalysisVisitor {
    /**
     * Array to of memory instances in the current scope
     * @type {Memory[]}
     */
    memoryListCurrentScope;

    /**
     * Array of array of memory instances for each outer scope
     * @type {Memory[][]}
     */
    memoryListOuterScope;

    /**
     * Array of array of array of memory instances for different control flow paths.
     * Might want to check the README to see how this one works...
     * @type {Memory[][][]}
     */
    memoryListOtherControlFlow;

    constructor (commentHandler) {
        this.commentHandler = commentHandler;

        // Main memory initialization
        this.memoryListCurrentScope = [new Memory()];
        this.memoryListOuterScope = [];
        this.memoryListOtherControlFlow = [];
    }

    /**
     * Entry point for code analysis.
     *
     *
     * @param {import("acorn").Node[]} nodes The parsed AST nodes
     * @returns
     */
    run (nodes) {
        this.visitNodes(nodes);
        // this.memoryListCurrentScope.forEach((memory) => { memory.print(); });
    }

    /**
     * Start visiting the nodes of the AST
     *
     * @param {import("acorn").Node[]} nodes The parsed AST nodes
     */
    visitNodes (nodes) {
        for (const node of nodes) {
            this.visitNode(node);
        }
    }

    /**
     * Generic function to visit nodes
     *
     * @param {import("acorn").Node} node The node to visit
     * @returns
     */
    visitNode (node) {
        // LOG(node);
        switch (node.type) {
        case "FunctionDeclaration":
            return this.visitFunctionDeclaration(node);
        case "VariableDeclaration":
            return this.visitVariableDeclaration(node);
        case "VariableDeclarator":
            return this.visitVariableDeclarator(node);
        case "ObjectExpression":
            return this.visitObjectExpression(node);
        case "MemberExpression":
            return this.visitMemberExpression(node);
        case "Property":
            return this.visitProperty(node);
        case "Identifier":
            return this.visitIdentifier(node);
        case "Literal":
            return this.visitLiteral(node);
        case "IfStatement":
            // Adjust the current scope for entering an if statement
            if (MODE !== "MESSAGE_ONLY") {
                this.adjustCurrentScope("ENTER_IF");
            }

            // Enter if statement
            return this.visitIfStatement(node);
        case "BlockStatement":
            // TODO: Block statements right now only handle else case of if statements. Remove this when safe?
            return this.visitBlockStatement(node);
        case "ExpressionStatement" :
            return this.visitExpressionStatement(node);
        case "ForStatement" :
            return this.visitLoopStatement(node);
        case "ForOfStatement" :
            return this.visitLoopStatement(node);
        case "WhileStatement" :
            return this.visitLoopStatement(node);
        }
    }

    /**
     * Visitor for the FunctionDeclaration node
     *
     * @param {import("acorn").FunctionDeclaration} node
     */
    visitFunctionDeclaration (node) {
        // Load any annotated structs into memory
        // `node.start - 1` is the end position of the comment string before the start of this line
        if (MODE !== "MESSAGE_ONLY") {
            const check = this.commentHandler.checkByCharPosition(node.start - 1);
            if (check) {
                // check.forEach((obj) => this.memories.addObject(obj.name, obj.contents));
                check.forEach((obj) => {
                    this.memoryListCurrentScope.forEach((memory) => {
                        memory.addObject(obj.name, obj.contents);
                    });
                });
            }
        }

        const blockStatement = node.body;
        return this.visitNodes(blockStatement.body);
    }

    /**
     * Visitor for the VariableDeclaration node
     *
     * @param {import("acorn").VariableDeclarator} node The VariableDeclaration node
     * @returns
     */
    visitVariableDeclaration (node) {
        // Check comments to see if we have annotated objects. If we do, load them into memory.
        // `node.start - 1` is the end position of the comment string before the start of this line
        if (MODE !== "MESSAGE_ONLY") {
            const check = this.commentHandler.checkByCharPosition(node.start - 1);
            if (check) {
                check.forEach((obj) => {
                    this.memoryListCurrentScope.forEach((memory) => {
                        memory.addObject(obj.name, obj.contents);
                    });
                });
            }
        }

        this.visitNodes(node.declarations);

        const currentLine = CodeContext.buffer.slice(node.start, node.end);
        warnings.flush(`(Line ${node.loc.start.line}): ${currentLine}`);
        errors.flush(`(Line ${node.loc.start.line}): ${currentLine}`);

        return;
    }

    /**
     * Visitor for the VariableDeclarator node, make adjustment on the current working memory based on currentMemoryIndex.
     *
     * @param {import("acorn").VariableDeclarator} node The VariableDeclarator node
     * @returns
     */
    visitVariableDeclarator (node) {
        const name = this.visitNode(node.id);
        const initNode = node.init;
        switch (initNode.type) {
        case "ObjectExpression": {
            const obj = this.visitNode(initNode);
            // this.memories[this.currentMemoryIndex].addObject(name, obj);
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => memory.addObject(name, obj));
            }

            return;
        }
        case "MemberExpression": {
            const memberExpPath = this.visitNode(initNode);

            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => memory.assignReference(name, memberExpPath));
            }
            return;
        }

        case "Identifier": {
            const memberExpPath = [this.visitIdentifierAndCheck(initNode)];
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => memory.assignReference(name, memberExpPath));
            }
            return;
        }

        case "CallExpression": {
            // Don't actually need to do anything for a call expression. If there is
            // a variable assignment of an object, the object annotation will handle it.
            return;
        }
        }
    }

    /**
     * Visitor for the ObjectExpression node
     *
     * @param {import("acorn").ObjectExpression} node The ObjectExpression node
     * @returns {Object}
     */
    visitObjectExpression (node) {
        let result = {};
        for (const n of node.properties) {
            result = { ...result, ...this.visitNode(n) };
        }
        return result;
    }

    /**
     * Visitor for the MemberExpression node. Need to know the parent type because there
     * is a difference between setting a property in an object (assignment) and accessing an object's property (existence)
     *
     * @param {import("acorn").MemberExpression} node The MemberExpression node
     * @param {String} checkType String describing the type of check to perform: either `assignment` or `existence`
     * @returns {String[]}
     */
    visitMemberExpression (node, checkType) {
        const _this = this; // redeclare this to get around scoping issues with inner functions

        /**
         * Inner function to recursively build the path from a member expression.
         *
         *
         * @param {import("acorn").MemberExpression} node MemberExpression node
         * @param {String[]} acc Accumulator to store array describing the path
         * @returns {String[]} The path as an array
         */
        function visitChainedMemberExpression (node, acc) {
            if (node.object.type === "Identifier") {
                const name = _this.visitNode(node.object);
                const property = _this.visitNode(node.property);

                acc.unshift(property);
                acc.unshift(name);
                return acc;
            } else {
                const property = _this.visitNode(node.property);
                acc.unshift(property);

                return visitChainedMemberExpression(node.object, acc);
            }
        }

        if (node.object && node.property) {
            const fullPath = visitChainedMemberExpression(node, []);
            const name = fullPath[0];
            const property = fullPath.slice(1);

            let invalidObjectCount = 0;
            let undefinedDereferenceCount = 0;
            let undefinedValueCount = 0;
            if (MODE !== "MEMORY_ONLY") {
                // Loop through the memory states of the current scope to check for warnings/errors
                for (const memory of this.memoryListCurrentScope) {
                    if (!memory.objectExists(name) && !memory.literalExists(name)) {
                        invalidObjectCount++;
                    } else if (!memory.propertyExistsOnObject(name, property)) {
                        if (memory.undefnedDereferenceOnProperty(name, property)) {
                        // Check if second last property is undefined
                            undefinedDereferenceCount++;
                        } else {
                        // Otherwise value is undefined but no further dereference
                            undefinedValueCount++;
                        }
                    }
                }

                if (checkType === "assignment") {
                    if (invalidObjectCount > 0 || undefinedDereferenceCount > 0) {
                        if (invalidObjectCount === this.memoryListCurrentScope.length ||
                            undefinedDereferenceCount === this.memoryListCurrentScope.length) {
                            errors.addToBuffer(`Cannot set value at: ${fullPath.join(".")}`);
                        } else {
                            warnings.addToBuffer(`Potential problem with setting value at: ${fullPath.join(".")}`);
                        }
                    }
                } else { // Assume checkType is existence by default
                    // Add corresponding messages to buffer.
                    if (invalidObjectCount === this.memoryListCurrentScope.length) {
                        errors.addToBuffer(`Attempted to access property of undefined object ${name}`);
                    }

                    if (undefinedDereferenceCount === this.memoryListCurrentScope.length) {
                        errors.addToBuffer(`Attempted to read property of undefined (reading ${property.at(-1)})`);
                    } else if (undefinedDereferenceCount > 0) {
                        warnings.addToBuffer(`Potentially dereference of undefined (reading ${property.at(-1)})`);
                    }

                    if (undefinedValueCount > 0) {
                        if (undefinedValueCount === this.memoryListCurrentScope.length) {
                            warnings.addToBuffer(`${name}.${property.join(".")} is undefined`);
                        } else {
                            warnings.addToBuffer(`${name}.${property.join(".")} value may be undefined`);
                        }
                    }
                }
            }
            return fullPath;
        }
        throw new VisitorRuntimeError(`Could not parse member expression: ${CodeContext.buffer.slice(node.start, node.end)}`);
    }

    /**
     * Visitor for the Property node
     *
     * @param {import("acorn").Property} node The Property node
     * @returns {Object}
     */
    visitProperty (node) {
        return {
            [this.visitNode(node.key)]: this.visitNode(node.value)
        };
    }

    /**
     * Visitor for the Identifier node
     *
     * @param {import("acorn").Identifier} node The Identifier node
     * @returns {String}
     */
    visitIdentifier (node) {
        return node.name;
    }

    /**
     * Visitor for the Identifier node that also checks for warnings or errors.
     *
     * Used in variable declarations when declaring an variable from another identifier.
     *
     * @param {import("acorn").Identifier} node The Identifier node
     * @returns {String}
     */
    visitIdentifierAndCheck (node) {
        const name = node.name;

        let undefinedValueCount = 0;
        this.memoryListCurrentScope.forEach((memory) => {
            if (!memory.literalExists(name) && !memory.objectExists(name)) {
                undefinedValueCount++;
            }
        });

        if (undefinedValueCount > 0) {
            if (undefinedValueCount === this.memoryListCurrentScope.length) {
                errors.addToBuffer(`${name} value is undefined`);
            } else {
                warnings.addToBuffer(`${name} value may be undefined`);
            }
        }

        return name;
    }

    /**
     * Visitor for the Literal node
     *
     * @param {import("acorn").Literal} node The Literal node
     * @returns {String}
     */
    visitLiteral (node) {
        return node.value;
    }

    /**
     * Visitor for the IfStatement node.
     *
     * Scope adjustments should be done prior to entering the node.
     *
     * @param {import("acorn").IfStatement} node The IfStatement node
     */
    visitIfStatement (node) {
        // [IGNORE FOR NOW] Check condition(test node) for undefined object access
        // const conditionNode = node.test;
        // this.visitTest(conditionNode);

        // Check branch body (the code inside the if block)
        const consequentBodyNodes = node.consequent.body;
        for (const innerNode of consequentBodyNodes) {
            switch (innerNode.type) {
            case "VariableDeclaration": {
                this.visitVariableDeclaration(innerNode);
                break;
            }

            case "ExpressionStatement": {
                this.visitExpressionStatement(innerNode);
                break;
            }

            // Nested if statement
            case "IfStatement": {
                if (MODE !== "MESSAGE_ONLY") {
                    // Adjust the current scope for entering an if statement
                    this.adjustCurrentScope("ENTER_IF");
                }

                // Enter if statement
                this.visitIfStatement(innerNode);
                break;
            }
            default:
                break;
            }
        }

        // Alternative branch: else if(IfStatement) or else(BlockStatement)
        if (node.alternate) {
            if (MODE !== "MESSAGE_ONLY") {
                // Adjust the scope for alternative branches
                this.adjustCurrentScope("ENTER_IF_ALTERNATE");
            }
            if (node.alternate.type === "IfStatement") {
                // If there is another if statement, visit it directly
                this.visitIfStatement(node.alternate);
            } else if (node.alternate.type === "BlockStatement") {
                // If there is an else block, it will show up as a block statement
                this.visitBlockStatement(node.alternate);

                if (MODE !== "MESSAGE_ONLY") {
                    // Adjust the scope for leaving an if statement with an else
                    this.adjustCurrentScope("LEAVE_IF_ELSE");
                }
            }
        } else {
            // No alternative branch, exit normally
            // this.currentMemoryIndex = this.previousMemoryIndexStack.pop();

            // Adjust the scope for leaving an if statement without an else
            if (MODE !== "MESSAGE_ONLY") {
                this.adjustCurrentScope("LEAVE_IF_WITHOUT_ELSE");
            }
        }
        // if (node.alternate != null) {
        //     this.visitNode(node.alternate);
        // }
        // Exiting branch

        return;
    }

    /**
     * Visitor for the BlockStatement node. This visit function should really only be used to handle else case in if statements.
     *
     * Scope adjustments should be done prior to visting this node.
     *
     * @param {import("acorn").BlockStatement} node The BlockStatement node
     */
    visitBlockStatement (node) {
        for (node of node.body) {
            switch (node.type) {
            case "VariableDeclaration": {
                this.visitVariableDeclaration(node);
                break;
            }

            case "ExpressionStatement": {
                this.visitExpressionStatement(node);
                break;
            }

            case "IfStatement": {
                if (MODE !== "MESSAGE_ONLY") {
                    // Adjust the current scope for entering an if statement
                    this.adjustCurrentScope("ENTER_IF");
                }

                // Enter if statement
                this.visitIfStatement(node);
                break;
            }
            }
        }
        return;
    }

    // Only handling statements inside loop body
    visitLoopStatement (node) {
        this.adjustCurrentScope("ENTER_LOOP");

        const bodyNodes = node.body.body; // This is the body of the block statement

        MODE = "MEMORY_ONLY";
        // Visit for-loop for the first iteration and updates memory states only
        for (const node of bodyNodes) {
            this.visitNode(node);
        }

        MODE = "MESSAGE_ONLY";
        // Visit for-loop for the second iteration and updates messages only
        for (const node of bodyNodes) {
            this.visitNode(node);
        }

        MODE = "DEFAULT";

        this.adjustCurrentScope("EXIT_LOOP");
    }

    /**
     * Visitor for the ExpressionStatement node. Handles AssignmentExpression or CallExpression Node.
     *
     * @param {import("acorn").ExpressionStatement} node The ExpressionStatement node
     */
    visitExpressionStatement (node) {
        const expressionNode = node.expression;
        switch (expressionNode.type) {
        case "AssignmentExpression":
            this.visitAssignmentExpression(expressionNode);
            break;

        case "CallExpression":
            this.visitCallExpression(expressionNode);
            break;

        default:
            // [DEBUG]
            console.log("Unexpected case in ExpressionStatement: " + expressionNode.type);
            break;
        }

        const currentLine = CodeContext.buffer.slice(node.start, node.end);
        warnings.flush(`(Line ${node.loc.start.line}): ${currentLine}`);
        errors.flush(`(Line ${node.loc.start.line}): ${currentLine}`);
    }

    /**
     * Visitor for the CallExpression node. Handles MemberExpression node in its arguments.
     *
     * @param {import("acorn").CallExpression} node The CallExpression node
     */
    visitCallExpression (node) {
        // Callee node is ignored for now. Too many edge cases...

        // const calleeNode = node.callee;
        // if (calleeNode.type === "MemberExpression") {
        //     // check if callee has UOA violation.
        //     this.visitMemberExpression(calleeNode);
        // }

        const argumentNodes = node.arguments;

        for (const arg of argumentNodes) {
            if (arg.type === "MemberExpression") {
                // check if callee has UOA violation.
                this.visitMemberExpression(arg);
            }
        }
    }

    /**
     * Visitor for the AssignmentExpression node. Handles combinations of left/right nodes pairs.
     * Currently handles: MemberExpression w/ MemberExpression, MemberExpression w/ ObjectExpression, MemberExpression w/ Literal,
     * MemberExpression w/ Identifier, Identifier w/ ObjectExpression, Identifier w/ MemberExpression.
     *
     * @param {import("acorn").AssignmentExpression} node The AssignmentExpression node
     */
    visitAssignmentExpression (node) {
        const left = node.left;
        const right = node.right;

        if (left.type === "MemberExpression" && right.type === "MemberExpression") {
            // Case: Assign object member with an object member
            const leftName = this.extractFullName(left);
            const rightName = this.extractFullName(right);

            // Memory update
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) =>
                    memory.updateObjectUsingPaths(rightName.split("."), leftName.split(".")));
            }

            // Access checking
            this.visitMemberExpression(left, "assignment");
            this.visitMemberExpression(right, "existence");
        } else if (left.type === "MemberExpression" && right.type === "ObjectExpression") {
        // Case: Assigning object's member with an object expression

            const obj = this.visitObjectExpression(right);
            const fullPath = this.extractFullName(left);

            // Memory update
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => memory.updateObject(obj, fullPath.split(".")));
            }

            // Access checking
            this.visitMemberExpression(left, "assignment");
        } else if (left.type === "MemberExpression" && right.type === "Literal") {
        // Case: Assign object member with an literal

            const leftContent = this.extractFullName(left);
            const rightContent = this.visitLiteral(right);

            // Memory update
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => memory.updateObject(rightContent, leftContent.split(".")));
            }
            // Access checking
            this.visitMemberExpression(left, "assignment");
        } else if (left.type === "MemberExpression" && right.type === "Identifier") {
            // Case: Assign object member with another declared variable(identifier)
            const leftName = this.extractFullName(left);
            const rightName = this.visitIdentifier(right);

            // Memory update
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) =>
                    memory.updateObjectUsingPaths([rightName], leftName.split(".")));
            }

            // Access checking
            this.visitMemberExpression(left, "assignment");
            this.visitIdentifierAndCheck(right);
        } else if (left.type === "Identifier" && right.type === "ObjectExpression") {
            // Case: Reassigning an declared object to a variable.

            // Delete entry if variable is already declared
            const name = this.visitIdentifier(left);

            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope.forEach((memory) => {
                    if (memory.objectExists(name)) {
                        memory.deleteObject(name);
                    }
                });
            }

            const obj = this.visitObjectExpression(right);

            if (MODE !== "MESSAGE_ONLY") {
            // Memory update
                this.memoryListCurrentScope.forEach((memory) => {
                    memory.addObject(name, obj);
                });
            }
        } else if (left.type === "Identifier" && right.type === "MemberExpression") {
            // Case: Assigning an declared variable with object's member.

            const identifier = this.visitIdentifier(left);
            const fullPath = this.visitMemberExpression(right);

            // Memory update
            if (MODE !== "MESSAGE_ONLY") {
                this.memoryListCurrentScope((memory) => {
                    memory.assignReference(identifier, fullPath);
                });
            }
            // for (const memory of this.memoryListCurrentScope) {
            //     try {
            //         memory.assignReference(identifier, fullPath);
            //     } catch (err) {
            //         // Ignore the errors
            //     }
            // }

            // this.memoryListCurrentScope.forEach((memory) => {
            //     memory.print();
            // });
        } else if (left.type === "Identifier" && right.type === "Literal") {
            // Case: Assigning an variable with a literal.
            // NOT SUPPORTED: This type of line will be trimmed during preprocessing.
        } else if (left.type === "Identifier" && right.type === "Identifier") {
            // Case: Assigning a variable to another variable
            // Pre-req: Both variables must exist. If code is preprocessed properly, should not be a problem...
            const identifierLeft = this.visitIdentifier(left);
            const identifierRight = this.visitIdentifier(right);

            if (MODE !== "MESSAGE_ONLY") {
                // Memory update
                this.memoryListCurrentScope((memory) => {
                    memory.assignReference(identifierLeft, [identifierRight]);
                });
            }
        } else {
            throw new Error("Error in AssignmentExpression. Unsupported node type. Left: " + left.type + " , Right: " + right.type);
        }
    }

    // Helper function to extract full name for member expression node
    extractFullName (node) {
        // Base case: When the node is an Identifier, simply return its name
        if (node.type === "Identifier") {
            return node.name;
        }

        // Recursive case: If the node is a MemberExpression, keep traversing
        if (node.type === "MemberExpression") {
            const objectPart = this.extractFullName(node.object); // Recursive call for the object part
            const propertyPart = node.computed ? `[${this.extractFullName(node.property)}]` : node.property.name; // Handling computed properties
            return `${objectPart}.${propertyPart}`; // Combine the object and property names
        }

        throw new Error("Error extracting full path, unsupported node type: " + node.type);
    }

    /**
     * Adjusts the current scope when entering/leaving divergent control flow structures.
     * See README for more details on how exactly this works.
     *
     * @param {String} mode One of ["ENTER_IF", "ENTER_LOOP", "ENTER_IF_ALTERNATE", "LEAVE_IF_WITHOUT_ELSE", "LEAVE_IF_ELSE", "EXIT_LOOP"]
     */
    adjustCurrentScope (mode) {
        if (mode === "ENTER_IF" || mode === "ENTER_LOOP") {
            // Deep copy the current scope and push the new list into the outer scope list
            const deepCopy = [];
            this.memoryListCurrentScope.forEach((memory) => {
                deepCopy.push(memory.deepCopy());
            });
            this.memoryListOuterScope.push(deepCopy);

            // Insert an empty list into the other control flow list
            this.memoryListOtherControlFlow.push([]);
        } else if (mode === "ENTER_IF_ALTERNATE") {
            // Deep copy the current scope into the last list of the other control flow list
            const deepCopyCS = [];
            this.memoryListCurrentScope.forEach((memory) => {
                deepCopyCS.push(memory.deepCopy());
            });
            this.memoryListOtherControlFlow.at(-1).push(deepCopyCS);

            // Deep copy the outer scope (last list in the outer scope list) and set that as the current scope
            const deepCopyOS = [];
            this.memoryListOuterScope.at(-1).forEach((memory) => {
                deepCopyOS.push(memory.deepCopy());
            });
            this.memoryListCurrentScope = deepCopyOS;
        } else if (mode === "LEAVE_IF_WITHOUT_ELSE" || mode === "EXIT_LOOP") {
            // Deep copy the current scope into the last list of the other control flow list
            const deepCopyCS = [];
            this.memoryListCurrentScope.forEach((memory) => {
                deepCopyCS.push(memory.deepCopy());
            });
            this.memoryListOtherControlFlow.at(-1).push(deepCopyCS);

            // Union all the memory states in the last index of the other control flow list
            // and set them as the current state
            const OCFList = this.memoryListOtherControlFlow.pop().flat();
            this.memoryListCurrentScope = OCFList;

            // Union the last outer scope with the current scope
            this.memoryListCurrentScope = this.memoryListCurrentScope.concat(this.memoryListOuterScope.pop());
        } else if (mode === "LEAVE_IF_ELSE") {
            // Deep copy the current scope into the last list of the other control flow list
            const deepCopyCS = [];
            this.memoryListCurrentScope.forEach((memory) => {
                deepCopyCS.push(memory.deepCopy());
            });
            this.memoryListOtherControlFlow.at(-1).push(deepCopyCS);

            // Union all the memory states in the last index of the other control flow list
            // and set them as the current state
            const OCFList = this.memoryListOtherControlFlow.pop().flat();
            this.memoryListCurrentScope = OCFList;

            // Pop the last outer scope
            this.memoryListOuterScope.pop();
        } else {
            throw new VisitorRuntimeError(`Unsupported scope adjustment mode: ${mode}`);
        }
    }
}

export default AnalysisVisitor;
