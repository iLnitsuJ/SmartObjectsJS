// export const WARNING = "warning";
// export const ERROR = "error";
// export default function formatIssues (log, issue, showColor) {
//     let output = "";
//
//     if (log.length === 0) {
//         return;
//     } else if (log.length === 1) {
//         output = `(${log.length}) ${issue} detectesed: \n`;
//     } else {
//         output = `(${log.length}) ${issue}s detected: \n`;
//     }
//     output = formatIssue(log, output);
//
//     if (!showColor) {
//         return output;
//     }
//     if (issue === WARNING) {
//         return `\x1b[33m ${output} "\x1b[0m";`;
//     }
//     if (issue === ERROR) {
//         return `\x1b[31m ${output} "\x1b[0m";`;
//     }
// }
//
// function formatIssue (log, output) {
//     let i = 1;
//     for (const { code, msg } of log) {
//         output += `\t${i++}.\n`;
//         output += "\tCode: " + code + "\n";
//         output += "\tIssue: " + msg + "\n";
//         output += "\n";
//     }
//     return output;
// }
