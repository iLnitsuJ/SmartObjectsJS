const obj = { f1: "hello", f2: 1234 };

const s = obj.f1;
const b = s.length;

const u = obj.f3;           // warning, obj.f3 is undefined
const v = u.length;         // error, u is undefined and trying to access a property

const x = obj.f1.f2.f3.f;   // error, trying to access properties on undefined

obj.f4 = "asdf";
const a = obj.f4;
