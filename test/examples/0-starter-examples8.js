const obj = { f1: "hello", f2: 1234 };

for (let i = 0; i < 5; i++) {
    obj.f3 = { f4: "world" };
}
console.log(obj.f3.f4);
