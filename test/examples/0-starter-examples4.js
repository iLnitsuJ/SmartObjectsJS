const obj = { f1: "hello", f2: 1234 };

const s = obj.f1; // good

obj.f3 = { f4: "world" };
const u = obj.f3; // good
const v = u.f4; // good
const w = obj.f3.f4; // good
