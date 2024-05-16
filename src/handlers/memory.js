import CodeContext from "../utils/codeContext.js";
import Logger from "../utils/logger.js";

const LOG = Logger.getDefaultLogger();

class UnknownVariableError extends Error {
    constructor (message = "", ...args) {
        super(message, ...args);
    }
}

class MemoryRuntimeError extends Error {
    constructor (message = "", ...args) {
        super(message, ...args);
    }
}

/**
 *
 *
 * All objects are flattened before storage and aliases added to the memory layer.
 * This is so that variables can reference objects within other objects.
 *
 * Ex. Consider the following object
 *
 * `testObj = { name: 'James Bond', id: '007', mission: { name: 'spectre', status: 'failed' } }`
 *
 * The symbol table (nameToIdxMap) will look like:
 *
 * `{ testObj: 0, '<testObj.mission>': 1 }`
 *
 * The memory layer (idxToValueMap) will look like:
 *
 * `{
 *    '0': { name: 'James Bond', id: '007', mission: '<testObj.mission>' },
 *    '1': { name: 'spectre', status: 'failed' }
 *  }`
 *
 */
class Memory {
    #nameToIdxMap;
    #idxToValueMap;
    #literalMap;
    #nextAvailableMemoryIdx;

    constructor () {
        this.#nameToIdxMap = {};
        this.#idxToValueMap = {};
        this.#literalMap = {};
        this.#nextAvailableMemoryIdx = 0;
    }

    /**
     * Clears the memory.
     */
    clear () {
        this.#nameToIdxMap = {};
        this.#idxToValueMap = {};
        this.#nextAvailableMemoryIdx = 0;
    }

    /**
     * Prints the contents of the memory
     */
    print () {
        LOG(this.#nameToIdxMap);
        LOG(this.#idxToValueMap);
        LOG(this.#literalMap);
    }

    /**
     * Add an object into memory. Object is automatically flattened if it contains nested objects.
     *
     * @param {String} objName The name of the object.
     * @param {Object} objContents The contents of the object to add.
     */
    addObject (objName, objContents) {
        if (this.#nameToIdxMap[objName]) {
            throw new Error(`${objName} already exists!`);
        }

        this.#createEntry(objName);
        this.#setEntry(objName, objContents);
        // LOG(objContents);
        // LOG(this.#nameToIdxMap);
        // LOG(this.#idxToValueMap);
    }

    /**
     * Updates an object or object property to the specified updateThing.
     * `updateThing` may be a string, number, or another object
     *
     * If updateThing is undefined or property does not exist, nothing will happen.
     *
     * @param {String|Number|Object} updateThing The new value of the updated property
     * @param {String[]} pathToPropertyArray Array describing the path to the property to update
     */
    updateObject (updateThing, pathToPropertyArray) {
        // If the pathToProperty already points to an object, delete the existing object.
        const internalName = `<${pathToPropertyArray.join(".")}>`;
        if (this.#nameToIdxMap[internalName]) {
            this.#deleteEntry(internalName);
        }

        const entryRef = this.#getEntryReference(pathToPropertyArray.slice(0, -1));

        if (entryRef === undefined || updateThing === undefined) {
            // We are trying to update something that doesn't exist
            return;
        }

        if (typeof updateThing === "object") {
            // If updateThing is an object, must first create that object.
            this.#createEntry(internalName);
            this.#setEntry(internalName, updateThing);

            // Update the path to point to the newly create object
            entryRef[pathToPropertyArray[pathToPropertyArray.length - 1]] = internalName;
        } else if (typeof updateThing === "string" || typeof updateThing === "number") {
            // UpdateThing is a literal
            try {
                entryRef[pathToPropertyArray[pathToPropertyArray.length - 1]] = updateThing;
            } catch {
                // Error occurs when trying to create property on literal.
                // Ex. const obj = {a: 1234}
                //     obj.a.zzz = "bad"
                // Ignore the error and do nothing
            }
        }

        // LOG(this.#nameToIdxMap);
        // LOG(this.#idxToValueMap);
    }

    /**
     * Update object at path based on a path to another object
     *
     * @param {String[]} pathToUpdateThingArray String array describing path to the update thing
     * @param {String[]} pathToPropertyArray String array describing the path to the property to update
     */
    updateObjectUsingPaths (pathToUpdateThingArray, pathToPropertyArray) {
        if (pathToUpdateThingArray.length === 1) {
            const name = pathToUpdateThingArray[0];
            if (this.objectExists(name)) {
                // Hacky, but setting identifier idx to the pathToPropertyArray
                const internalName = `<${pathToPropertyArray.join(".")}>`;
                const referenceEntryTarget = this.#getEntryReference(pathToPropertyArray.slice(0, -1));
                // referenceEntryTarget[pathToPropertyArray.slice(-1)[0]] = this.#nameToIdxMap[name];
                referenceEntryTarget[pathToPropertyArray.slice(-1)[0]] = internalName;
                this.#nameToIdxMap[internalName] = this.#nameToIdxMap[name];

                return;
            } else if (this.literalExists(name)) {
                return this.updateObject(this.#literalMap[name], pathToPropertyArray);
            }
        } else {
            const referenceEntry = this.#getEntryReference(pathToUpdateThingArray.slice(0, -1));
            if (!referenceEntry) {
            // reference entry does not exist (path points to something that doesn't exist)
                return;
            }
            const nextValue = referenceEntry[pathToUpdateThingArray.slice(-1)[0]];
            if (!nextValue) {
                // nextValue does not exist (path points to something that doesn't exist)
                return;
            }
            return this.updateObject(nextValue, pathToPropertyArray);
        }
    }

    /**
     * Assign a variable that references part of another object or literal in an object.
     *
     * @param {String} newVariableName The name of the reference
     * @param {String[]} referencePathArray Array describing the path to the property to reference
     *
     * @throws {UnknownVariableError} Thrown if reference path points to something that does not exist
     */
    assignReference (newVariableName, referencePathArray) {
        const referenceVariableName = referencePathArray[0];
        if (this.literalExists(referenceVariableName)) {
            // We don't actually care about literal values, so just copy whatever the value is in the referenced variable
            this.#literalMap[newVariableName] = this.#literalMap[referenceVariableName];
            return;
        }
        let referenceIdx;
        if (referencePathArray.length === 1) {
            if (this.#nameToIdxMap[referenceVariableName] === undefined && !this.literalExists(referenceVariableName)) {
                return;
                // throw new UnknownVariableError(`Variable ${referenceVariableName} does not exist.`);
            }
            referenceIdx = this.#nameToIdxMap[referenceVariableName];
        } else {
            const referenceEntry = this.#getEntryReference(referencePathArray.slice(0, -1));

            if (!referenceEntry) {
                return;
                // throw new UnknownVariableError(`Path ${referencePathArray.join(".")} does not exist.`);
            }

            const value = referenceEntry[referencePathArray.slice(-1)[0]];

            if (typeof value === "string" && value.includes("<")) {
                // References another array, can add to to symbol table.
                referenceIdx = this.#nameToIdxMap[value];
            } else {
                // References a literal, add to the literal table (mapping) if value is not undefined
                if (value) {
                    this.#literalMap[newVariableName] = value;
                }

                // Delete the object symbol entry, if it exists
                if (this.objectExists(newVariableName)) {
                    this.deleteSymbol(newVariableName);
                }
                return;
            }
        }
        this.#nameToIdxMap[newVariableName] = referenceIdx;

        // Delete the literal mapping, if it exists
        if (this.#literalMap[newVariableName]) {
            delete this.#literalMap[newVariableName];
        }

        // LOG(this.#nameToIdxMap);
        // LOG(this.#idxToValueMap);
    }

    /**
     * Deletes the object from memory complete.
     *
     * Note that JS does not allow object deletions. We can only delete the references to objects.
     * This function should be used for variable reassignment.
     * @param {String} objName
     */
    deleteObject (objName) {
        this.#deleteEntry(objName);
    }

    /**
     * Deletes the symbol name from the symbol table. Does not delete the associated memory contents.
     *
     * Potential to have the memory "floating" (similar to memory leak), but it doesn't matter too much.
     * This is safer than removing the entire entry, is if there are other symbols that reference the same
     * deleted memory, those symbols will not end up referencing nothing (like a null pointer)
     *
     * @param {String} objName Name of object to delete
     */
    deleteSymbol (objName) {
        delete this.#nameToIdxMap[objName];
    }

    /**
     * Deletes a property from an object.
     *
     * If the property is an object and contains other objects, the nested objects will also be deleted.
     *
     * @param {String[]} propertyPathArray Array describing the path to the property to delete
     */
    deleteObjectProperty (propertyPathArray) {
        if (propertyPathArray.length === 1) {
            throw new MemoryRuntimeError("Only 1 value found in the property path. Use deleteObject to delete objects");
        }

        const pathToPropertyArray = propertyPathArray.slice(0, -1);
        const propertyName = propertyPathArray.slice(-1)[0];

        // Check if we are deleting an object or a literal
        const referenceEntry = this.#getEntryReference(pathToPropertyArray);
        const deleteValue = referenceEntry[propertyName];
        if (typeof deleteValue !== "undefined") {
            if (!deleteValue.includes("<")) {
                delete referenceEntry[propertyName];
            } else {
                // We want to delete an object. However, this object may reference other objects. Delete the other objects first.
                const referenceEntryOfObject = this.#getEntryReference(propertyPathArray);
                const otherObjReferences = [];

                for (const [key, value] of Object.entries(referenceEntryOfObject)) {
                    if (value.includes("<")) {
                        otherObjReferences.push(propertyPathArray.concat([key]));
                    }
                }

                // Recursively delete the nested object definitions first
                otherObjReferences.forEach((other) => this.deleteObjectProperty(other));

                // Now delete the current flat object definition
                delete referenceEntry[propertyName];
                this.#deleteEntry(deleteValue);

                // Now go through the rest of the idxToValueMap map and delete all references to this object
                for (const [key, value] of Object.entries(this.#idxToValueMap)) {
                    for (const v in value) {
                        if (value[v] === deleteValue) {
                            delete value[v];
                        }
                    }
                }
            }
        } else {
            delete referenceEntry[propertyName];
        }

        // LOG(this.#nameToIdxMap);
        // LOG(this.#idxToValueMap);
    }

    /**
     * Checks if an object with given name exists in memory.
     *
     * @param {String} objName Name of the object to check
     * @returns {Boolean} `true` if the object exists, `false` if it doesn't
     */
    objectExists (objName) {
        return this.#nameToIdxMap[objName] !== undefined;
    }

    /**
     * Checks if a variable that references a literal exists.
     *
     * Useful for when a variable is assigned a literal field of an object, since we still want to track that.
     *
     * @example
     * const obj = {f1: "asdf"}
     * const literal = obj.f1 // Still need to track this because it references part of an object
     *
     * @param {String} literalName The name of the literal to check
     * @returns {Boolean} `true` if the literal exists, `false` if it doesn't
     */
    literalExists (literalName) {
        return this.#literalMap[literalName] !== undefined;
    }

    /**
     * Checks if the property exists on an object.
     *
     * @param {String} objName Name of the object
     * @param {String[]} ppropertyNameList Array describing the path to the property to check
     * @returns {Boolean} `true` if the property exists, `true` if `objName` is actually a literal, `false` otherwise
     */
    propertyExistsOnObject (objName, ppropertyNameList) {
        if (this.literalExists(objName)) {
            return true;
        }
        const propertyNameList = structuredClone(ppropertyNameList);

        function propertyExistsHelper (obj, lst) {
            if (lst.length === 0) {
                return true;
            } else {
                const propToCheck = lst.shift();
                if (Object.hasOwn(obj, propToCheck)) {
                    return propertyExistsHelper(obj[propToCheck], lst);
                } else {
                    return false;
                }
            }
        }

        if (this.objectExists(objName)) {
            const obj = this.#getEntry(objName);
            return propertyExistsHelper(obj, propertyNameList);
        }
        return false;
    }

    /**
     * Checks if the property exists on an object. Additionally, if found a property that object doesnt own.
     * check if full property list has leftover, if true that means it violates undefined dereference.
     *
     * @param {String} objName Name of the object
     * @param {String[]} ppropertyNameList Array describing the path to the property to check
     * @returns {Boolean} `true` if second last property is undefined but has one more dereference property.
     */
    undefnedDereferenceOnProperty (objName, ppropertyNameList) {
        const propertyNameList = structuredClone(ppropertyNameList);

        function propertyExistsHelper (obj, lst) {
            if (lst.length === 0) {
                return false;
            } else {
                const propToCheck = lst.shift();
                if (Object.hasOwn(obj, propToCheck)) {
                    // console.log("obj: " + objName + " has prop: " + propToCheck);
                    return propertyExistsHelper(obj[propToCheck], lst);
                } else {
                    // If second last property does not exist, and still has property in the list to be check
                    // Then this is undefined dereference
                    if (lst.length > 0) {
                        // console.log("obj: " + objName + "'s prop: " + propToCheck + " is undef deref");
                        return true;
                    } else {
                        // console.log("obj: " + objName + "'s prop: " + propToCheck + " is NOT undef deref");
                        return false;
                    }
                }
            }
        }

        if (this.objectExists(objName)) {
            const obj = this.#getEntry(objName);
            return propertyExistsHelper(obj, propertyNameList);
        }
        return false;
    }

    /**
     * Private function to create an entry in the symbol table and memory table with the given name.
     *
     * @param {String} name Name of object
     */
    #createEntry (name) {
        // Map the name to the index
        this.#nameToIdxMap[name] = this.#nextAvailableMemoryIdx;

        // Map the index to an empty object
        this.#idxToValueMap[this.#nextAvailableMemoryIdx] = {};

        // Increment available memory index
        this.#nextAvailableMemoryIdx++;
    }

    /**
     * Private function to delete an entry in the symbol table and memory table with the given name.
     *
     * NOTE: does not guarantee that all references to the deleted object will be deleted as well.
     *
     * @param {String} name Name of object
     */
    #deleteEntry (name) {
        // Grab memory index to delete
        const memoryIdx = this.#nameToIdxMap[name];

        // First delete the values, then delete the name
        delete this.#idxToValueMap[memoryIdx];
        delete this.#nameToIdxMap[name];
    }

    /**
     * Gets a copy of the named object.
     *
     * All aliases within the object are resolved. In other words, the object that is returned will have depth and no internal aliases.
     *
     * NOTE: Since this is a copy, everything that is done on the result will not cause changes in memory. Meaning that if you change a property, do not expect the property in the memory table to change as well.
     * @param {String} name Name of object to get
     * @returns Copy of the named object (with depth)
     */
    #getEntry (name) {
        if (this.#nameToIdxMap[name] === undefined) {
            throw new UnknownVariableError(`Variable ${name} does not exist.`);
        }

        const result = {};
        const flatObj = this.#idxToValueMap[this.#nameToIdxMap[name]];
        for (const [key, value] of Object.entries(flatObj)) {
            if (!Number.isInteger(value) && (value.includes("<") || value.includes(">"))) {
                result[key] = this.#getEntry(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Gets a referenced object to the flatten object at the named path or the value at the path.
     *
     * NOTE: Any change to the returned object will be reflected in memory.
     * @param {String[]} ppath Array describing the path to the reference
     * @returns Reference to a flattened object or literal the at the path. Undefined if path is invalid.
     */
    #getEntryReference (ppath) {
        const path = structuredClone(ppath); // Deep copy the path since ppath is passed in by reference.

        const objName = path.shift();
        let result = this.#idxToValueMap[this.#nameToIdxMap[objName]];
        while (path.length > 0) {
            const nextProp = path.shift();
            const nextValue = result[nextProp];

            // nextValue is some falsy value (i.e. undefined)
            if (!nextValue) {
                return undefined;
            }

            if (typeof nextValue === "string" && nextValue.includes("<")) {
                result = this.#idxToValueMap[this.#nameToIdxMap[nextValue]];
            } else {
                result = nextValue;
            }
        }
        return result;
    }

    /**
     * Set the entry in the symbol table to the name and adds the object to memory.
     *
     * If the object is nested, will automatically flatten it.
     *
     * @param {String} name Name of the object
     * @param {Object} newObj The object to add to memory
     */
    #setEntry (name, newObj) {
        const flattenedObj = {};
        for (const [key, value] of Object.entries(newObj)) {
            if (typeof value === "object") {
                // Remove the "<" and ">" if they exist in the name.
                let prefixName = name;
                if (name.includes("<") || name.includes(">")) {
                    prefixName = name.replaceAll("<", "");
                    prefixName = prefixName.replaceAll(">", "");
                }
                const internalName = `<${prefixName}.${key}>`;

                // Create and set the new entries
                this.#createEntry(internalName);
                this.#setEntry(internalName, value);
                flattenedObj[key] = internalName;
            } else {
                flattenedObj[key] = value;
            }
        }

        this.#idxToValueMap[this.#nameToIdxMap[name]] = flattenedObj;
    }

    /**
     * Deep copy the current Memory instance.
     *
     * @returns {Memory} A new Memory instance that is a deep copy of the current instance.
     */
    deepCopy () {
        const newMemory = new Memory();

        newMemory.#nameToIdxMap = structuredClone(this.#nameToIdxMap);
        newMemory.#idxToValueMap = structuredClone(this.#idxToValueMap);
        newMemory.#literalMap = structuredClone(this.#literalMap);
        newMemory.#nextAvailableMemoryIdx = this.#nextAvailableMemoryIdx;

        return newMemory;
    }
}

// Memory._instance = null;

export default Memory;
