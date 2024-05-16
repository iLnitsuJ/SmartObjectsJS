import fs from "fs-extra";
import CodeContext from "../src/utils/codeContext.js";
import { analyzeCode } from "../src/main/analyzeCode.js";

describe("Test Examples", () => {
    const BASE_PATH = "./test/examples/";

    function getResults (fileName) {
        const code = fs.readFileSync(BASE_PATH + fileName, { encoding: "utf8" });
        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        return analyzeCode(code);
    }

    test("Example 1", () => {
        const fileName = "1-basic.js";
        const { warnings, errors } = getResults(fileName);
        const [error1, error2] = errors;
        const [warning] = warnings;

        expect(error1.code).toBe("(Line 7): const v = u.length;");
        expect(error1.msg).toBe("Attempted to access property of undefined object u");

        expect(error2.code).toBe("(Line 9): const x = obj.f1.f2.f3.f;");
        expect(error2.msg).toBe("Attempted to read property of undefined (reading f)");

        expect(warning.code).toBe("(Line 6): const u = obj.f3;");
        expect(warning.msg).toBe("obj.f3 is undefined");

        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(2);
    });

    test("Example 2", () => {
        const fileName = "2-basic-loop.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1, warning2] = warnings;

        expect(warning1.code).toBe("(Line 7): const v = obj.f1.nested;");
        expect(warning1.msg).toBe("obj.f1.nested value may be undefined");
        expect(warning2.code).toBe("(Line 10): const t = obj.f1.zzz;");
        expect(warning2.msg).toBe("obj.f1.zzz is undefined");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(0);
    });

    test("Example 3", () => {
        const fileName = "3-nested-if.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1, warning2] = warnings;
        const [error1, error2] = errors;

        expect(warning1.code).toBe("(Line 7): const ll = asdf.cc;");
        expect(warning1.msg).toBe("asdf.cc is undefined");
        expect(warning2.code).toBe("(Line 16): const xx = asdf.f3;");
        expect(warning2.msg).toBe("asdf.f3 value may be undefined");
        expect(error1.code).toBe("(Line 10): const tt = asdf.f3.gg;");
        expect(error1.msg).toBe("Attempted to read property of undefined (reading gg)");
        expect(error2.code).toBe("(Line 12): const gg = asdf.f3.dd;");
        expect(error2.msg).toBe("Attempted to read property of undefined (reading dd)");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(2);
    });

    test("Example 4", () => {
        const fileName = "4-basic-if.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1, warning2] = warnings;

        expect(warning1.code).toBe("(Line 5): const s = obj.asdf;");
        expect(warning1.msg).toBe("obj.asdf is undefined");
        expect(warning2.code).toBe("(Line 10): const d = obj.f3.course;");
        expect(warning2.msg).toBe("Potentially dereference of undefined (reading course)");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(0);
    });

    test("Example 5", () => {
        const fileName = "5-basic-loop-with-if.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1, warning2] = warnings;
        const [error1] = errors;

        expect(warning1.code).toBe("(Line 3): const ll = asdf.f3;");
        expect(warning1.msg).toBe("asdf.f3 value may be undefined");
        expect(warning2.code).toBe("(Line 10): const m = asdf.f3.mission;");
        expect(warning2.msg).toBe("Potentially dereference of undefined (reading mission)");
        expect(error1.code).toBe("(Line 4): const lll = ll.length;");
        expect(error1.msg).toBe("Attempted to access property of undefined object ll");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(1);
    });

    test("Example 6", () => {
        const fileName = "6-object-mutation.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1] = warnings;
        const [error1] = errors;

        expect(warning1.code).toBe("(Line 13): const t5 = obj.f3.p1.chance;");
        expect(warning1.msg).toBe("obj.f3.p1.chance is undefined");
        expect(error1.code).toBe("(Line 14): const t6 = obj.f3.p1.chance.yy;");
        expect(error1.msg).toBe("Attempted to read property of undefined (reading yy)");
        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(1);
    });

    test("Example 7", () => {
        const fileName = "7-obj-annotation.js";
        const { warnings, errors } = getResults(fileName);

        const [warning1, warning2] = warnings;
        const [error1, error2] = errors;

        expect(warning1.code).toBe("(Line 12): const c = otherObj.aasdf;");
        expect(warning1.msg).toBe("otherObj.aasdf is undefined");
        expect(warning2.code).toBe("(Line 18): const z = myObj.prereq.pp;");
        expect(warning2.msg).toBe("myObj.prereq.pp is undefined");
        expect(error1.code).toBe("(Line 13): const d = otherObj.unun.aasdf;");
        expect(error1.msg).toBe("Attempted to read property of undefined (reading aasdf)");
        expect(error2.code).toBe("(Line 19): const w = myObj.prereq.pp.tt;");
        expect(error2.msg).toBe("Attempted to read property of undefined (reading tt)");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(2);
    });

    test("Example 8", () => {
        const fileName = "8-obj-annotation.js";
        const { warnings, errors } = getResults(fileName);
        const [error1, error2, error3] = errors;
        const [warning1, warning2, warning3, warning4, warning5] = warnings;

        expect(warning1.code).toBe("(Line 28): const bb = otherObj.message;");
        expect(warning1.msg).toBe("otherObj.message is undefined");
        expect(warning2.code).toBe("(Line 29): const c = otherObj.aasdf;");
        expect(warning2.msg).toBe("otherObj.aasdf is undefined");
        expect(warning3.code).toBe("(Line 37): const z = myObj.prereq.pp;");
        expect(warning3.msg).toBe("myObj.prereq.pp is undefined");
        expect(warning4.code).toBe("(Line 8): const e = inputObject.message;");
        expect(warning4.msg).toBe("inputObject.message is undefined");
        expect(warning5.code).toBe("(Line 9): const b = inputObject.what;");
        expect(warning5.msg).toBe("inputObject.what is undefined");

        expect(error1.code).toBe("(Line 30): const d = otherObj.unun.aasdf;");
        expect(error1.msg).toBe("Attempted to read property of undefined (reading aasdf)");
        expect(error2.code).toBe("(Line 38): const w = myObj.prereq.pp.tt;");
        expect(error2.msg).toBe("Attempted to read property of undefined (reading tt)");
        expect(error3.code).toBe("(Line 10): const v = inputObject.f.sss;");
        expect(error3.msg).toBe("Attempted to read property of undefined (reading sss)");

        expect(warnings.length).toBe(5);
        expect(errors.length).toBe(3);
    });

    test("Example 9", () => {
        const fileName = "0-starter-examples1.js";
        const { warnings, errors } = getResults(fileName);
        const [error] = errors;
        const { code, msg } = error;

        expect(code).toBe("(Line 8): console.log(obj.b.qwer);");
        expect(msg).toBe("Attempted to read property of undefined (reading qwer)");

        expect(warnings.length).toBe(0);
        expect(errors.length).toBe(1);
    });

    test("Example 10", () => {
        const fileName = "0-starter-examples2.js";
        const { warnings, errors } = getResults(fileName);
        const [warning] = warnings;
        const { code, msg } = warning;

        expect(code).toBe("(Line 15): const p2_name = obj.projects.project3;");
        expect(msg).toBe("obj.projects.project3 is undefined");
        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(0);
    });
    test("Example 11", () => {
        const fileName = "0-starter-examples3.js";
        const { warnings, errors } = getResults(fileName);
        expect(warnings.length).toBe(0);
        expect(errors.length).toBe(0);
    });

    test("Example 12", () => {
        const fileName = "0-starter-examples4.js";
        const { warnings, errors } = getResults(fileName);
        expect(warnings.length).toBe(0);
        expect(errors.length).toBe(0);
    });

    test("Example 13", () => {
        const fileName = "0-starter-examples5.js";
        const { warnings, errors } = getResults(fileName);
        const [error1, error2] = errors;

        expect(error1.code).toBe("(Line 4): const s = obj.f1;");
        expect(error1.msg).toBe("Attempted to access property of undefined object obj");

        expect(error2.code).toBe("(Line 6): const u = obj.f3;");
        expect(error2.msg).toBe("Attempted to access property of undefined object obj");
        expect(warnings.length).toBe(0);
        expect(errors.length).toBe(2);
    });

    test("Example 14", () => {
        const fileName = "0-starter-examples6.js";
        const { warnings, errors } = getResults(fileName);
        const [warning] = warnings;
        const { code, msg } = warning;

        expect(code).toBe("(Line 6): console.log(obj.f3.f4);");
        expect(msg).toBe("Potentially dereference of undefined (reading f4)");
        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(0);
    });

    test("Example 15", () => {
        const fileName = "0-starter-examples7.js";
        const { warnings, errors } = getResults(fileName);
        const [error1, error2] = errors;
        expect(error1.code).toBe("(Line 4): const s = obj.f1;");
        expect(error1.msg).toBe("Attempted to access property of undefined object obj");

        expect(error2.code).toBe("(Line 6): const u = obj.f3;");
        expect(error2.msg).toBe("Attempted to access property of undefined object obj");
        expect(warnings.length).toBe(0);
        expect(errors.length).toBe(2);
    });

    test("Example 16", () => {
        const fileName = "0-starter-examples8.js";
        const { warnings, errors } = getResults(fileName);
        const [warning] = warnings;
        const { code, msg } = warning;
        expect(code).toBe("(Line 6): console.log(obj.f3.f4);");
        expect(msg).toBe("Potentially dereference of undefined (reading f4)");

        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(0);
    });

    test("Example 17", () => {
        const fileName = "0-starter-examples9.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1] = warnings;

        expect(warning1.code).toBe("(Line 8): console.log(obj.f3.f4);");
        expect(warning1.msg).toBe("Potentially dereference of undefined (reading f4)");
        expect(warnings.length).toBe(1);
        expect(errors.length).toBe(0);
    });

    test("Example 18", () => {
        const fileName = "0-starter-examples10.js";
        const { warnings, errors } = getResults(fileName);
        const [warning1, warning2] = warnings;

        expect(warning1.code).toBe("(Line 8): console.log(obj.f3.f4.f5);");
        expect(warning1.msg).toBe("Potentially dereference of undefined (reading f5)");

        expect(warning2.code).toBe("(Line 8): console.log(obj.f3.f4.f5);");
        expect(warning2.msg).toBe("obj.f3.f4.f5 value may be undefined");

        expect(warnings.length).toBe(2);
        expect(errors.length).toBe(0);
    });
});
