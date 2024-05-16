import { analyzeCode } from "../src/main/analyzeCode.js";

import CodeContext from "../src/utils/codeContext.js";

describe("Basic Tests", () => {
    test("Detect undefined property access", () => {
        const code =
        `
        int = 1;
        const obj = { f1: "hello", f2: 1234 };
        const s = obj.f1;
        const abc = obj.f3;
        const x = abc.vv;
        console.log(s);
        cosnole.log(x);
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = true;
        const result = analyzeCode(code);

        expect(result.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                level: "error",
                code: "(Line 6): const x = abc.vv;",
                msg: "Attempted to access property of undefined object abc"
            })
        ]));

        expect(result.warnings).toEqual(expect.arrayContaining([
            expect.objectContaining({
                level: "warn",
                code: "(Line 5): const abc = obj.f3;",
                msg: "obj.f3 is undefined"
            })
        ]));
    });

    test("Detect no errors on valid code", () => {
        const code =
        `
        const obj = { f1: "hi", f2: 5678 };
        const value = obj.f1;
        console.log(value);
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        const result = analyzeCode(code);

        expect(result.errors.length).toBe(0);
    });

    test("Ex1. Detect undefined dereference ", () => {
        const code =
        `
        const obj = { f1: "hello", f2: 1234 };
        const u = obj.f3.f1; // bad, null dereference
        console.log(u);
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        const result = analyzeCode(code);

        expect(result.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                level: "error",
                code: "(Line 3): const u = obj.f3.f1;",
                msg: "Attempted to read property of undefined (reading f1)"
            })
        ]));
        expect(result.warnings.length).toBe(0);
    });

    test("Ex2. Happy path, no message ", () => {
        const code =
        `
        let obj = {f1: "hello", f2: 1234};
        obj.f3 = "world";
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        const result = analyzeCode(code);

        expect(result.errors.length).toBe(0);
        expect(result.warnings.length).toBe(0);
    });

    test("Ex3. Detect potentially undefined value and give warning", () => {
        const code =
        `
        const obj = { f1: "hello", f2: {} };

        if (Math.random() > 0.5) {
            obj.f2.f3 = "hello world";
        }
        console.log(obj.f2.f3);
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        const result = analyzeCode(code);
        expect(result.errors.length).toBe(0);
        expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining(
            {
                level: "warn",
                code: "(Line 7): console.log(obj.f2.f3);",
                msg: "obj.f2.f3 value may be undefined"
            }
        )]));
    });

    test("Ex4. No error", () => {
        const code =
        `
        let obj = {f1: "hello", f2: 1234};
        let obj2 = obj;
        obj.f3 = {f4: 1};
        console.log(obj2.f3.f4); 
        `;

        CodeContext.setBuffer(code);
        CodeContext.DEBUG = false;
        const result = analyzeCode(code);

        expect(result.errors.length).toBe(0);
        expect(result.warnings.length).toBe(0);
    });

    // WIP
    // test("Detect error in object method invocation", () => {
    //     const code =
    //     `
    //     const obj = {
    //         greet: function() { console.log("Hello"); }
    //     };
    //     obj.greettt(); // Misspelled method name
    //     `;

    //     CodeContext.setBuffer(code);
    //     CodeContext.DEBUG = false;
    //     const result = analyzeCode(code);

    //     expect(result.errors.length).toBe(0);
    // });
});
