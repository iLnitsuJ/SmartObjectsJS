import fs from "fs-extra";
import { analyzeCode } from "./analyzeCode.js";
import CodeContext from "../utils/codeContext.js";
import Logger from "../utils/logger.js";

// Pull in the command line arguments
const filePath = process.argv[2];
const buffer = fs.readFileSync(filePath, { encoding: "utf8" });
CodeContext.setBuffer(buffer);

// Setup logging
const DEBUG = process.argv[3] === "DEBUG";
const logger = Logger.getDebugLogger(process.argv[3]);

CodeContext.DEBUG = DEBUG;
const result = analyzeCode(buffer);
CodeContext.print(result.warnings, result.errors); // uncomment if want to print from running in command line
// using:  node src/main/index.js test/examples/2-nested-loop.js
export { logger };
