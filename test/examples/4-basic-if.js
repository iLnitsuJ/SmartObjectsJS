const obj = { f1: "hello", f2: 1234 };

if (Math.random() > 0.5) {
    const a = obj.f2;
    const s = obj.asdf;             // warning, assigning undefined value to s
} else {
    obj.f3 = { course: "cpsc 310" };
}

const d = obj.f3.course;            // warning, depending on the branch taken, obj.f3.course may be undefined
