class Logger {
    LEVEL = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    static getDebugLogger (logLevel) {
        return (toLog) => { logLevel === this.LEVEL.DEBUG && test(toLog); };
    }

    static getDefaultLogger () {
        return (toLog) => { console.dir(toLog, { depth: null }); };
    }
}

export default Logger;
