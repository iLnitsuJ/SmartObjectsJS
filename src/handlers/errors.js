import CodeContext from "../utils/codeContext.js";

class Errors {
    #errors;
    #buffer;

    constructor () {
        if (Errors._instance) {
            CodeContext.debugLog("Attempted to create Warning class again. Using existing Warning instance");
            return Errors.getInstance();
        }
        Errors._instance = this;

        this.#errors = [];
        this.#buffer = [];
    }

    static getInstance () {
        if (!Errors._instance) {
            return new Errors();
        }
        return Errors._instance;
    }

    /**
     * Add an error
     * @param {*} error: should be object with structure
     * {
     *   code: String
     *   msg: String
     * }
     */
    addError (error) {
        this.#errors.push(error);
    }

    addToBuffer (errorMsg) {
        this.#buffer.push(errorMsg);
    }

    flush (line) {
        this.#buffer.forEach((buf) => {
            this.addError({
                level: "error",
                code: line,
                msg: buf
            });
        });
        this.#buffer = [];
    }

    print () {
        this.#errors.forEach((error) => console.log(error));
    }

    hasErrorsInBuffer () {
        return this.#buffer.length > 0;
    }

    // flush out all errors and reset the array
    listAndReset () {
        const copy = [];
        this.#errors.forEach((warning) => copy.push(warning));

        this.#errors = [];
        return copy;
    }

    setMessages (messageArr) {
        this.#errors = messageArr;
    }
}

Errors._instance = null;

export default Errors;
