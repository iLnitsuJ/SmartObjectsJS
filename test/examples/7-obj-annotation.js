const myObj = { course: 410, name: "SmartObj" };

function otherMethod () {
    return { course: 310, name: "InsightFacade" };
}

// @struct(otherObj)={"course" : "310", "name": "String"}
const otherObj = otherMethod();

const a = otherObj.course;
const b = otherObj.name;
const c = otherObj.aasdf;           // warning, property is undefined
const d = otherObj.unun.aasdf;      // error, accessing a property of an undefined

myObj.prereq = otherObj;
const x = myObj.prereq.course;
const y = myObj.prereq.name;
const z = myObj.prereq.pp;          // warning, property is undefined
const w = myObj.prereq.pp.tt;       // error, accessing a property of an undefined
