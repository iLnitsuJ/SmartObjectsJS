class CodeContext {
    static buffer = "";
    static DEBUG = false;
    static WARNING = "Warning";
    static ERROR = "Error";

    static debugLog = (warningLog, errorLog) => {
        CodeContext.DEBUG && this.print(warningLog, errorLog);
    };

    static setDebug (option) {
        CodeContext.DEBUG = option;
    }

    static print (warningLog, errorLog) {
        if (warningLog.length === 0 && errorLog.length === 0) {
            console.log("\x1b[32m No errors detected. \x1b[0m");
            return;
        }
        this.printWarnings(warningLog);
        this.printErrors(errorLog);
    }

    static printWarnings (warningLog) {
        if (warningLog && warningLog.length > 0) {
            warningLog.sort(CodeContext.sortByLineNumber);
            const output = this.formatIssues(warningLog, this.WARNING, true);
            console.log(output);
        }
    }

    static printErrors (errorLog) {
        if (errorLog && errorLog.length > 0) {
            errorLog.sort(CodeContext.sortByLineNumber);
            const output = this.formatIssues(errorLog, this.ERROR, true);
            console.log(output);
        }
    }

    static formatIssues (log, issue, showColor) {
        let output = "";

        if (log.length === 0) {
            return;
        } else if (log.length === 1) {
            output = `(${log.length}) ${issue} detected: \n`;
        } else {
            output = `(${log.length}) ${issue}s detected: \n`;
        }
        output = this.formatIssue(log, output);

        if (!showColor) {
            return output;
        }
        if (issue === this.WARNING) {
            return `\x1b[33m ${output} "\x1b[0m`;
        }
        if (issue === this.ERROR) {
            return `\x1b[31m ${output} "\x1b[0m`;
        }
    }

    static formatIssue (log, output) {
        let i = 1;
        for (const { code, msg } of log) {
            output += `\t${i++}.\n`;
            output += "\tCode: " + code + "\n";
            output += "\tIssue: " + msg + "\n";
            output += "\n";
        }
        return output;
    }

    static setBuffer (newBuffer) {
        CodeContext.buffer = newBuffer;
    }

    static getBuffer () {
        return CodeContext.buffer;
    }

    static sortByLineNumber (a, b) {
        const lineNumA = parseInt(a.code.match(/\(Line (\d+)\)/)[1]);
        const lineNumB = parseInt(b.code.match(/\(Line (\d+)\)/)[1]);
        return lineNumA - lineNumB;
    }
}

export default CodeContext;
