const obj = { f1: "hello", f2: 1234 };

while (Math.random() > 0.5) {
    obj.f1 = { nested: "loop" };
}

const v = obj.f1.nested;        // warning: if the loop is not entered, obj.f1.nested is undefined

obj.f1 = "normal";
const t = obj.f1.zzz;           // warning: setting a constant to an undefined value
