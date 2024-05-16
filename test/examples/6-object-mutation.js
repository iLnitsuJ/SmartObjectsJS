const obj = { f1: "hello", f2: 1234 };
const other = { p1: "bye", p2: 42, p3: { zz: "zz", pp: "pp" } };
obj.f3 = other;

// Pass by reference, these access are all good.
const t1 = obj.f3.p1;
const t2 = obj.f3.p2;
const t3 = obj.f3.p3.zz;

other.p1 = { test: "bye" };

const t4 = obj.f3.p1.test;
const t5 = obj.f3.p1.chance;        // warning: obj.f3.p1.chance is undefined
const t6 = obj.f3.p1.chance.yy;     // error: trying to access property on undefined
