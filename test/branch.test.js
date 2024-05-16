import { analyzeCode } from "../src/main/analyzeCode.js";
import CodeContext from "../src/utils/codeContext.js";

beforeEach(() => {

});

describe("Branch tests", () => {
    describe("Simple if branch", () => {
        it("has expression with undefined value. Should see warning.", () => {
            const code =
                `
            const obj = { a: "hi" };
            const i = 0;

            if (i === 0) { 
                const u2 = obj.b; // warning for undefined value
            }
            `;

            CodeContext.setBuffer(code);
            CodeContext.DEBUG = true;
            const result = analyzeCode(code);

            expect(result.errors.length).toBe(0);
            expect(result.warnings).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    code: "(Line 6): const u2 = obj.b;",
                    level: "warn",
                    msg: "obj.b is undefined"
                })
            ]));
        });

        it("has expression with potentially undefined dereference. Should see warning.", () => {
            const code =
                `
            const obj = { a: "hi" };
            const i = 0;

            if (i === 0) { 
                obj.b = "jack"; 
            }

            console.log(obj.b.qwer); // warning for potentailly undefined dereference
            
            `;
            CodeContext.setBuffer(code);
            const result = analyzeCode(code);

            expect(result.errors.length).toBe(0);
            expect(result.warnings).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    code: "(Line 9): console.log(obj.b.qwer);",
                    level: "warn",
                    msg: "obj.b.qwer value may be undefined"
                }),
                expect.objectContaining({
                    code: "(Line 9): console.log(obj.b.qwer);",
                    level: "warn",
                    msg: "Potentially dereference of undefined (reading qwer)"
                })
            ]));
        });

        it("has expression with undefined dereference. Should see error.", () => {
            const code =
                `
            const obj = { a: "hi" };
            const i = 0;

            if (i === 0) { 
                obj.b = "jack"; 
            }

            console.log(obj.qqq.abcd); // error for undefined dereference
            
            `;
            CodeContext.setBuffer(code);
            const result = analyzeCode(code);

            expect(result.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    code: "(Line 9): console.log(obj.qqq.abcd);",
                    level: "error",
                    msg: "Attempted to read property of undefined (reading abcd)"

                })
            ]));
            expect(result.warnings.length).toBe(0);
        });

        it("has expression with undefined object. Should see error.", () => {
            const code =
                `
            const obj = { a: "hi" };
            const i = 0;
            
            if (i === 0) {
                obj.b = "jack";
            }
            
            console.log(abc.def);

            `;
            CodeContext.setBuffer(code);
            const result = analyzeCode(code);

            expect(result.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    code: "(Line 9): console.log(abc.def);",
                    level: "error",
                    msg: "Attempted to access property of undefined object abc"
                })
            ]));
            expect(result.warnings.length).toBe(0);
        });
    });
    describe("More complex branch case", () => {
        it("Undefined value and undefined dereference warning, undefined dereference error", () => {
            const code =
                `
            const obj = { a: "hi" };
            const i = 0;

            if (i === 0) { // new copy
                obj.b = i;
                obj.c = { mission: "hello" };
                const u1 = obj.b;
                const u2 = obj.b.abc; // [WARNING] undefined value
                obj.second = 2;
            } else if (i > 0) {
                console.log(obj.b); // [WARNING] undefined value
            } else if (i < 0) {
                console.log(obj.c); // [WARNING] undefined value
            } else {
                console.log(obj.asd.qwer); // [ERROR] attempt undefined dereferenced
            }

            console.log(obj.c.mission); // [WARNING] potentially undefined dereferenced
            `;

            CodeContext.setBuffer(code);
            CodeContext.DEBUG = true;
            const result = analyzeCode(code);

            expect(result.warnings).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    code: "(Line 8): const u1 = obj.b;",
                    level: "warn",
                    msg: "obj.b is undefined"
                }),
                expect.objectContaining({
                    code: "(Line 12): console.log(obj.b);",
                    level: "warn",
                    msg: "obj.b is undefined"
                }),
                expect.objectContaining({
                    code: "(Line 14): console.log(obj.c);",
                    level: "warn",
                    msg: "obj.c is undefined"
                }),
                expect.objectContaining({
                    code: "(Line 19): console.log(obj.c.mission);",
                    level: "warn",
                    msg: "Potentially dereference of undefined (reading mission)"
                })

            ]));

            expect(result.errors).toEqual(expect.arrayContaining([
                expect.objectContaining(
                    {
                        level: "error",
                        code: "(Line 16): console.log(obj.asd.qwer);",
                        msg: "Attempted to read property of undefined (reading qwer)"
                    })
            ]));
        });
    });
});
