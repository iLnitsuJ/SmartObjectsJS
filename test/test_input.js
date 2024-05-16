// const asdf = { f1: "hello", f2: 1234 };

// if (Math.random() > 0.5) {
//     asdf.f3 = "adsfasdf";
//     if (Math.random() > 0.5) {
//         const zz = asdf.f3;
//         const ll = asdf.cc; // warning reported
//     }
// } else {
//     const tt = asdf.f3.asdf; // error reported
//     if (Math.random() > 0.5) {
//         const gg = asdf.f3.dd; // error reported
//     }
// }

// const xx = asdf.f3;

// const obj = { f1: "hello", f2: 1234 };
// const other = { p1: "bye", p2: 42, p3: { zz: "zz", pp: "pp" } };
// obj.f3 = other;
// const i = 0;

// if (i === 0) {
//     obj.f2.a = "jack";
// }

// console.log(obj.b.qwer);

// const yy = obj.f1;
// const yyz = obj.f1.asdf;
// const ffa = yyz;

// const asdf = { f1: "hello", f2: 1234 };
// for (let i = 0; i < 2; i++) {
//     const ll = asdf.f3.length;
//     if (asdf.f2 > 0) {
//         asdf.f3 = { mission: "impossible" };
//     }
// }
const obj = { f1: "hello", f2: 1234 };

while (Math.random() > 0.5) {
    obj.f1 = { nested: "loop" };
}

const v = obj.f1.nested;        // warning: if the loop is not entered, obj.f1.nested is undefined

obj.f1 = "normal";
const t = obj.f1.zzz;           // warning: setting a constant to an undefined value
