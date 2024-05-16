import Memory from "../src/handlers/memory";

const getTestObject = (additionalFields) => {
    return {
        name: "James Bond",
        id: "007",
        ...additionalFields
    };
};

describe("Memory tests", () => {
    let memory;

    beforeEach(() => {
        memory = new Memory();
        memory.clear();
    });

    describe("happy path", () => {
        describe("Flat object manipulations", () => {
            it("Adding object to memory", () => {
                expect(memory.objectExists("testObj")).toBeFalsy();

                // Add object in memory
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
            });

            it("Adding object then adding more fields to the same object", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["mission"])).toBeFalsy();

                memory.updateObject("spectre", ["testObj", "mission"]);
                expect(memory.propertyExistsOnObject("testObj", ["mission"])).toBeTruthy();

                memory.updateObject("Spain", ["testObj", "location"]);
                expect(memory.propertyExistsOnObject("testObj", ["location"])).toBeTruthy();
            });

            it("Adding object then updating existing object fields", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.updateObject("Not Bond", ["testObj", "name"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
            });

            it("Deleting object properties", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.deleteObjectProperty(["testObj", "name"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeFalsy();

                memory.deleteObjectProperty(["testObj", "id"]);
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeFalsy();
            });

            it("Deleting object", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.deleteObject("testObj");
                expect(memory.objectExists("testObj")).toBeFalsy();
            });

            it("Assigning reference", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.assignReference("ref", ["testObj"]);
                expect(memory.propertyExistsOnObject("ref", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["id"])).toBeTruthy();
            });

            it("Assigning reference, then deleting a property from object", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.assignReference("ref", ["testObj"]);
                expect(memory.propertyExistsOnObject("ref", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["id"])).toBeTruthy();

                memory.deleteObjectProperty(["testObj", "name"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeFalsy();
                expect(memory.propertyExistsOnObject("ref", ["name"])).toBeFalsy();
            });

            it("Updating existing object property with literal", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.updateObject("Raoul Silva", ["testObj", "name"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
            });

            it("Adding a new property to existing object (literal)", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.updateObject("Raoul Silva", ["testObj", "nemesis"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["nemesis"])).toBeTruthy();
            });

            it("Updating existing object property with another object", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.updateObject({ first: "Raoul", last: "Silva" }, ["testObj", "name"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
            });

            it("Adding new object property that is another object", () => {
                memory.addObject("testObj", getTestObject());
                expect(memory.objectExists("testObj")).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();

                memory.updateObject({ first: "Raoul", last: "Silva" }, ["testObj", "nemesis"]);
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["id"])).toBeTruthy();
            });
        });

        describe("Nested object manipulations", () => {
            it("Adding object", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));
                expect(memory.propertyExistsOnObject("testObj", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["mission"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["mission", "name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["mission", "location", "city"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("testObj", ["mission", "city", "location"])).toBeFalsy();
            });

            it("Assigning object reference", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));
                memory.assignReference("ref", ["testObj"]);

                expect(memory.propertyExistsOnObject("ref", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["mission"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "location", "city"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "city", "location"])).toBeFalsy();
            });

            it("Assigning object reference to property of object", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));
                memory.assignReference("ref", ["testObj", "mission"]);

                expect(memory.propertyExistsOnObject("ref", ["mission"])).toBeFalsy();

                expect(memory.propertyExistsOnObject("ref", ["name"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["location", "city"])).toBeTruthy();
                expect(memory.propertyExistsOnObject("ref", ["city", "location"])).toBeFalsy();
            });

            it("Deleting a property that is a literal", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));

                memory.deleteObjectProperty(["testObj", "mission", "location", "country"]);
                expect(memory.propertyExistsOnObject("ref", ["mission", "location", "country"])).toBeFalsy();
            });

            it("Deleting a property that is a flat object", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));

                memory.deleteObjectProperty(["testObj", "mission", "location"]);
                expect(memory.propertyExistsOnObject("ref", ["mission", "location"])).toBeFalsy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "location", "country"])).toBeFalsy();
            });

            it("Deleting a property that is a nested object", () => {
                memory.addObject("testObj", getTestObject({
                    mission:
                    {
                        name: "spectre",
                        status: "failed",
                        location:
                        { country: "Spain", city: "Madrid" }
                    }
                }));

                memory.deleteObjectProperty(["testObj", "mission"]);
                expect(memory.propertyExistsOnObject("ref", ["mission"])).toBeFalsy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "location"])).toBeFalsy();
                expect(memory.propertyExistsOnObject("ref", ["mission", "location", "country"])).toBeFalsy();
            });
        });
    });
});
