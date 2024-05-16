const obj = { f1: "hello", f2: 1234 };

for (let i = 0; i < 5; i++) {
    if (i == obj.f2) {
        obj.f3 = { f4: "world" };
    }
}
console.log(obj.f3.f4.f5);
