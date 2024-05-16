/**
 * This function does something.
 * @struct(inputObject)={"course" : "Number", "name": "String"}
 */
function doSomething (inputObject, unusedVariable) {
    const t = inputObject.course;
    const y = inputObject.name;
    const e = inputObject.message;      // warning, property is undefined
    const b = inputObject.what;         // warning, property is undefined
    const v = inputObject.f.sss;        // error, reading property of undefined

    inputObject.message = "please give good mark";
    const o = inputObject.message;

    return { course: 310, name: "InsightFacade" };
}

const myObj = { course: 410, name: "SmartObj" };

/**
 * @struct(myObj)={"course" : "Number", "name": "String", "message": "String"}
 * @struct(otherObj)={"course" : "Number", "name": "String"}
 */
const otherObj = doSomething(myObj, "unused");

const a = otherObj.course;
const b = otherObj.name;
const bb = otherObj.message;        // warning, property is undefined
const c = otherObj.aasdf;           // warning, property is undefined
const d = otherObj.unun.aasdf;      // error, accessing a property of an undefined

const f = myObj.message;

myObj.prereq = otherObj;
const x = myObj.prereq.course;
const y = myObj.prereq.name;
const z = myObj.prereq.pp;          // warning, property is undefined
const w = myObj.prereq.pp.tt;       // error, accessing a property of an undefined
