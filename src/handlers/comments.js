import Logger from "../utils/logger.js";

const LOG = Logger.getDefaultLogger();

class CommentHandlerRuntimeError extends Error {
    constructor (message = "", ...args) {
        super(message, ...args);
    }
}

/**
 * Commend handler class to process annotated comments
 */
class Comments {
    #structMap;

    constructor () {
        this.#structMap = {};
    }

    /**
     * Processes a comment. Will only add to the internal structure map if object name is wrapped
     * in an `@struct()` tag and the object is in proper json format.
     *
     * @param {import("acorn").Comment} comment
     */
    processComment (comment) {
        const annotatedComments = [];
        if (comment.type === "Line" && comment.value.includes("@struct")) {
            annotatedComments.push(comment);
        } else if (comment.type === "Block") {
            const split = comment.value.split(/[\n*]+/);
            split.forEach((text) => {
                if (text.includes("@struct")) {
                    const temp = structuredClone(comment);
                    temp.value = text;
                    annotatedComments.push(temp);
                }
            });
        }

        annotatedComments.forEach((comment) => {
            // Split the comment by the equals sign.
            const textSplit = comment.value.split("=");

            // The name of the object is appended with the end position
            const objName = `${textSplit[0].trim().match(/\(([^)]+)\)/)[1]}:${comment.end}`;

            // Format the specified structure of the object
            let objStruct;
            try {
                objStruct = JSON.parse(textSplit[1].trim());
            } catch {
                throw new CommentHandlerRuntimeError(`Failed to parse object. Ensure it is in proper JSON format: ${textSplit[1].trim()}`);
            }

            // Add it into the structMap
            this.#structMap[objName] = objStruct;
        });
    }

    /**
     * Checks the struct map to see if there was a comment that ended in the specified position
     *
     * @param {Number} position
     *
     * @returns {Object[] | undefined} An object that contains the name and object that was defined by the comment ending at the specified position. Returns undefined otherwise.
     */
    checkByCharPosition (position) {
        const result = [];
        for (const [key, value] of Object.entries(this.#structMap)) {
            const keyName = key.split(":")[0];
            const keyPosition = key.split(":")[1];

            if (position.toString() === keyPosition) {
                result.push({ name: keyName, contents: value });
            }
        }

        if (result.length > 0) {
            return result;
        }
        return undefined;
    }
}

export default Comments;
