class PreprocessVisitor {
    constructor () {
        this.objRelationships = new Set();
    }

    run (nodes) {
        this.traverseNodes(nodes, this.markUsage.bind(this));
        return this.filterUnusedVariables(nodes);
    }

    traverseNodes (nodes, action) {
        for (const node of nodes) {
            action(node);
            ["expression", "body", "callee", "object", "left", "right", "property", "arguments", "test", "consequent",
                "properties", "declarations", "init", "alternate"].forEach((property) => {
                if (node[property]) {
                    if (Array.isArray(node[property])) {
                        this.traverseNodes(node[property], action);
                    } else {
                        this.traverseNodes([node[property]], action);
                    }
                }
            });
        }
    }

    markUsage (node) {
        // Add declaration of object as reference;
        if (node.type === "VariableDeclarator" && node.init) {
            if (node.init.type === "ObjectExpression" ||
                (node.init.type === "NewExpression" && node.init.callee)) {
                this.objRelationships.add(node.id.name);
            }
        }
        // Track direct relation with obj
        if (node.type === "MemberExpression" && this.objRelationships.has(node.object.name)) {
            this.objRelationships.add(node.property.name);
        }
        // Track indirect relation with obj
        if (node.type === "VariableDeclarator" && node.init) {
            if ((node.init.type === "Identifier" && this.objRelationships.has(node.init.name)) ||
                (node.init.type === "MemberExpression" && this.objRelationships.has(node.init.object.name))) {
                this.objRelationships.add(node.id.name);
            }
        }

        // Track sequence of indirect relation with obj
        if (node.type === "VariableDeclarator" && node.init && node.init.type === "MemberExpression") {
            let currentObject = node.init.object;
            let isRelated = false;
            while (currentObject.type === "MemberExpression") {
                if (this.objRelationships.has(currentObject.object.name)) {
                    isRelated = true;
                    break;
                }
                currentObject = currentObject.object;
            }
            if (isRelated || this.objRelationships.has(currentObject.name)) {
                this.objRelationships.add(node.id.name);
            }
        }

        // Track relation with obj for and within control structures
        if ((node.type === "IfStatement" || node.type === "WhileStatement")) {
            const traverseStructure = (node) => {
                // Traversal within the control structures
                if (node.consequent) {
                    this.traverseNodes([node.consequent], this.markUsage.bind(this));
                }
                if (node.alternate) {
                    this.traverseNodes([node.alternate], this.markUsage.bind(this));
                }
                if (node.body) {
                    this.traverseNodes([node.body], this.markUsage.bind(this));
                }
            };
            // Recursively track the variables in control structure;
            traverseStructure(node);
        }
    }

    // Helper for check relationship in body of control structures.
    filterControlBody (body) {
        return body.filter((statement) => {
            // Handle AssignmentExpression
            if (statement.type === "ExpressionStatement" && statement.expression.type === "AssignmentExpression") {
                // Check left and right side of the Assignment
                if ((statement.expression.left.type === "MemberExpression" && this.isMemberExpressionRelated(statement.expression.left)) ||
                    (statement.expression.right.type === "MemberExpression" && this.isMemberExpressionRelated(statement.expression.right))) {
                    return true;
                }
                if ((statement.expression.left.type === "Identifier" && this.objRelationships.has(statement.expression.left.name)) ||
                    (statement.expression.right.type === "Identifier" && this.objRelationships.has(statement.expression.right.name))) {
                    return true;
                }
            }
            // Handle VariableDeclaration
            if (statement.type === "VariableDeclaration") {
                return statement.declarations.some((declaration) => this.objRelationships.has(declaration.id.name));
            }
            // Handle nested if/while
            if (statement.type === "IfStatement" || statement.type === "WhileStatement") {
                if (statement.consequent && statement.consequent.body) {
                    statement.consequent.body = this.filterControlBody(statement.consequent.body);
                }
                if (statement.alternate && statement.alternate.body) {
                    statement.alternate.body = this.filterControlBody(statement.alternate.body);
                }
                if (statement.type === "WhileStatement" && statement.body && statement.body.body) {
                    statement.body.body = this.filterControlBody(statement.body.body);
                }

                return (statement.consequent.body && statement.consequent.body.length > 0) ||
                    (statement.alternate && statement.alternate.body && statement.alternate.body.length > 0);
            }
            return false;
        });
    }

    // Helper for recursively track relationships
    isMemberExpressionRelated (memberExpression) {
        let current = memberExpression;
        while (current && current.type === "MemberExpression") {
            if (this.objRelationships.has(current.object.name)) {
                return true;
            }
            current = current.object;
        }
        return false;
    }

    filterUnusedVariables (nodes) {
        let isConditionRelated;
        // Helper for recursively track relationships
        const filterNodes = (nodeArray) => {
            return nodeArray.filter((node) => {
                if (node.type === "VariableDeclaration") {
                    // Keep only declarations that are related to obj
                    node.declarations = node.declarations.filter((declaration) => this.objRelationships.has(declaration.id.name));
                    return node.declarations.length > 0;
                }

                if (node.type === "IfStatement" || node.type === "WhileStatement") {
                    if (node.test.type === "BinaryExpression" || node.test.type === "LogicalExpression") {
                        isConditionRelated = this.isMemberExpressionRelated(node.test.left) || this.isMemberExpressionRelated(node.test.right);
                    }
                    // Filter `consequent` and `alternate` blocks recursively
                    if (node.consequent && node.consequent.body) {
                        node.consequent.body = this.filterControlBody(node.consequent.body);
                    }
                    if (node.alternate && node.alternate.body) {
                        node.alternate.body = this.filterControlBody(node.alternate.body);
                    }
                    if (node.type === "WhileStatement" && node.body && node.body.body) {
                        node.body.body = this.filterControlBody(node.body.body);
                    }
                }
                // Keep the node if condition has relation with obj
                // or if the consequent/alternate for IfStatement,
                // body for WhileStatement has relation with obj
                if (node.type === "IfStatement") {
                    const hasConsequent = node.consequent && node.consequent.body && node.consequent.body.length > 0;
                    const hasAlternate = node.alternate && node.alternate.body && node.alternate.body.length > 0;
                    return isConditionRelated || hasConsequent || hasAlternate;
                } else if (node.type === "WhileStatement") {
                    const hasBody = node.body && (Array.isArray(node.body.body) ? node.body.body.length > 0 : true);
                    return isConditionRelated || hasBody;
                }
                // Keep other nodes by default
                return true;
            });
        };

        return filterNodes(nodes);
    }
}

export default PreprocessVisitor;
