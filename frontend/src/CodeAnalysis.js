import React, {useState} from 'react';
import Editor from "react-simple-code-editor"
import {highlight, languages} from "prismjs/components/prism-core"
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

const hightlightWithLineNumbers = (input, language) =>
    highlight(input, language)
        .split("\n")
        .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
        .join("\n");

function CodeAnalysis() {
    const [codeSnippet, setCodeSnippet] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isCodeClean, setIsCodeClean] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsCodeClean(false);
        setAnalysisResult(null);

        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({codeSnippet: codeSnippet}),
        });

        if (response.ok) {
            const data = await response.json();
            setAnalysisResult(data);
            setIsCodeClean(data.errors === undefined && data.warnings === undefined);
        } else {
            const errorData = await response.text();
            alert(errorData || 'Something went wrong!');
        }
    };

    return (
        <>
            <h1>Online JavaScript Debugger</h1>
            <div className="main-container">
                <div className="input-container">
                    <label>
                        Enter your code snippet:
                    </label>
                    <form className="form-container" onSubmit={handleSubmit}>
                        {/*<textarea*/}
                        {/*    value={codeSnippet}*/}
                        {/*    className="text-container"*/}
                        {/*    onChange={(e) => setCodeSnippet(e.target.value)}*/}
                        {/*/>*/}
                        {/*<div style={{width: '100%', height: '70vh', overflowY: 'auto',}}>*/}

                            <Editor
                                value={codeSnippet}
                                onValueChange={code => setCodeSnippet(code)}
                                highlight={code => hightlightWithLineNumbers(code, languages.js)}
                                padding={10}
                                textareaId="codeArea"
                                className="editor"
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: "1.1rem",
                                    outline: 0,
                                    height: "70vh",
                                    overflow: 'auto',
                                    backgroundColor: "white",
                                    color: "black",
                                    borderRadius: "4px"
                                }}
                            />
                        {/*</div>*/}
                        <button type="submit">Analyze Code</button>
                    </form>

                </div>
                <div className="output-container">
                    <label>Analysis Results: </label>
                    {isCodeClean ? (
                        <div className="result-box success-message success-box">
                            <h2>Success!</h2>
                            <p>No errors or warnings found. Your code looks clean!</p>
                        </div>
                    ) : (
                        analysisResult && (
                            <div>
                                {analysisResult.warnings?.length > 0 && (
                                    <div className="result-box warning-box">
                                        <pre>{analysisResult.warnings}</pre>
                                    </div>
                                )}
                                {analysisResult.errors?.length > 0 && (
                                    <div className="result-box error-box">
                                        <pre>{analysisResult.errors}</pre>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
}

export default CodeAnalysis;
