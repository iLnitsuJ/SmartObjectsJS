import { analyzeCode } from "./analyzeCode.js";
import express from "express";
import codeContext from "../utils/codeContext.js";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.post("/analyze", (req, res) => {
    const { codeSnippet } = req.body;
    if (!codeSnippet) {
        return res.status(400).send({ error: "codeSnippet is required" });
    }

    try {
        codeContext.setBuffer(codeSnippet);
        codeContext.DEBUG = false;
        console.log("Code snippet received for analysis:", codeSnippet);
        const { warnings, errors } = analyzeCode(codeSnippet);
        const formmatedWarnings = codeContext.formatIssues(warnings, codeContext.WARNING, false);
        const formattedErrors = codeContext.formatIssues(errors, codeContext.ERROR, false);
        res.send({ warnings: formmatedWarnings, errors: formattedErrors });
    } catch (error) {
        console.error("Error during code analysis:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Code analysis API listening at http://localhost:${port}`);
});
