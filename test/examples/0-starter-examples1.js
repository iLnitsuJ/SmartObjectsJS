const obj = { f1: "hello", f2: { a: 3 } };
const i = 0;

if (i === 0) {
    obj.f2.a = "jack";
}

console.log(obj.b.qwer); // warning for potentailly undefined dereference
