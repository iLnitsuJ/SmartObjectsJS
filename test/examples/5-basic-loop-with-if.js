const asdf = { f1: "hello", f2: 12345 };
for (let i = 0; i < 10; i++) {
    const ll = asdf.f3;                     // warning: asdf.f3 might be undefined
    const lll = ll.length;                  // error: property length will never exist on asdf.f3

    if (i > 1) {
        asdf.f3 = { mission: "impossible" };
    }

    const m = asdf.f3.mission;              // warning: mission might not exist on asdf.f3
}
