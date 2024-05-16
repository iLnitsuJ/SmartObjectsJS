import CodeContext from "../utils/codeContext.js";

class Warnings {
    #warnings;
    #buffer;

    constructor () {
        if (Warnings._instance) {
            CodeContext.debugLog("Attempted to create Warning class again. Using existing Warning instance");
            return Warnings.getInstance();
        }
        Warnings._instance = this;

        this.#warnings = [];
        this.#buffer = [];
    }

    static getInstance () {
        if (!Warnings._instance) {
            return new Warnings();
        }
        return Warnings._instance;
    }

    /**
     * Add a warning
     * @param {*} warning: should be object with structure
     * {
     *   level: String
     *   code: String
     *   msg: String
     * }
     */
    addWarning (warning) {
        this.#warnings.push(warning);
    }

    addToBuffer (warningMsg) {
        this.#buffer.push(warningMsg);
    }

    flush (line) {
        this.#buffer.forEach((buf) => {
            this.addWarning({
                level: "warn",
                code: line,
                msg: buf
            });
        });
        this.#buffer = [];
    }

    print () {
        this.#warnings.forEach((warning) => console.log(warning));
    }

    hasWarningsInBuffer () {
        return this.#buffer.length > 0;
    }

    // flush out all errors and reset the array
    listAndReset () {
        const copy = [];
        this.#warnings.forEach((warning) => copy.push(warning));

        this.#warnings = [];
        return copy;
    }

    setMessages (messageArr) {
        this.#warnings = messageArr;
    }
}

Warnings._instance = null;

export default Warnings;
