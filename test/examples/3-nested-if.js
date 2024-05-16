const asdf = { f1: "hello", f2: 1234 };

if (Math.random() > 0.5) {
    asdf.f3 = "adsfasdf";
    if (Math.random() > 0.5) {
        const zz = asdf.f3;
        const ll = asdf.cc;     // warning, asdf.cc is undefined value
    }
} else {
    const tt = asdf.f3.gg;      // error, this branch does not define asdf.f3 and cannot access gg property on undefined
    if (Math.random() > 0.5) {
        const gg = asdf.f3.dd;  // error, this branch does not define asdf.f3 and cannot access dd property on undefined
    }
}

const xx = asdf.f3;             // warning, depending on which branch the program took, asdf.f3 might be undefined
