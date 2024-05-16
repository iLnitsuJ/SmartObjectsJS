// @struct(obj) = {"f1": {"f2": "String", "f3": "Number"}, "f4": "Number"}
const obj = getObjFromOtherFunction();

const s = obj.f1; // good

const u = obj.f3; // bad, undefined
