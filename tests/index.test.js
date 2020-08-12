import OmniAural, { initGlobalState } from "../src/OmniAural";
import React from 'react';
import renderer, { act } from "react-test-renderer"
import MyComponent from "./MyComponent";
import MyOtherComponent from "./MyOtherComponent";
import MyBadComponent from "./MyBadComponent";
import MyFunctional from "./MyFunctional";
import MyHooksFunctional from "./MyHooksFunctional";
import mockInitialState from "./mockInitialState";
const fetch = require("node-fetch").default

beforeAll(() => {
    initGlobalState(mockInitialState)
});

describe('Global State Manager', () => {

    test('should validate global state has been initialized correctly', () => {
        const globalObject = OmniAural.UnsafeGlobalInstance.value

        expect(globalObject["dev_mode"].value).toBeFalsy()
        expect(globalObject["account"].value["name"].value === "Mike").toBeTruthy()
        expect(globalObject["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
        expect(globalObject["items"].value.length === 0).toBeTruthy()
    })

    test('should validate global state was declared correctly in the state object', () => {
        const currentSnapshot = OmniAural.state.value()
        expect(JSON.stringify(currentSnapshot) === JSON.stringify(mockInitialState))
    })

    test('should provide all the properties values from the state object', () => {
        expect(OmniAural.state.dev_mode.value()).toBeFalsy()
        expect(OmniAural.state.account.name.value() === "Mike").toBeTruthy()
        expect(OmniAural.state.account.address.city.value() === "Chicago").toBeTruthy()
        expect(OmniAural.state.account.address.street.value() === "Randolph").toBeTruthy()
        expect(OmniAural.state.account.phone_number.value() === 1234567890).toBeTruthy()
        expect(OmniAural.state.dev_mode.value()).toBeFalsy()
    })

    describe("Action Creator", () => {
        test('should create an action on the Global State Object', () => {
            OmniAural.addAction('action1', () => { })

            expect(OmniAural.action1).toBeTruthy()
            expect(typeof OmniAural.action1 === "function").toBeTruthy()
        })

        test('should create multiple actions on the Global State Object', () => {
            const action2 = () => { }
            const action3 = () => { }
            const action4 = function () {

            }
            OmniAural.addActions(action2, action3, action4)

            expect(OmniAural.action2).toBeTruthy()
            expect(typeof OmniAural.action2 === "function").toBeTruthy()
            expect(OmniAural.action3).toBeTruthy()
            expect(typeof OmniAural.action3 === "function").toBeTruthy()
            expect(OmniAural.action4).toBeTruthy()
            expect(typeof OmniAural.action4 === "function").toBeTruthy()
        })

        test('should allow for async actions to update global state', async () => {
            OmniAural.addAction('asyncAction', () => {
                return fetch('https://www.google.com')
                    .then(response => {
                        OmniAural.state.account.name.set("Josh")
                    })
            })

            expect(OmniAural.asyncAction).toBeTruthy()
            expect(typeof OmniAural.asyncAction === "function").toBeTruthy()
            await OmniAural.asyncAction()
            expect(OmniAural.state.account.name.value() === "Josh").toBeTruthy()
        })


        test('should execute the given action and update global state', () => {
            const action5 = (account) => {
                OmniAural.state.account.set(account)

                expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
                expect(OmniAural.state.account.address.street.value() === "Randolph").toBeTruthy()

                expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["city"].value === "New York").toBeTruthy()
                expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
            }
            OmniAural.addAction(action5)

            expect(OmniAural.action5).toBeTruthy()
            expect(typeof OmniAural.action5 === "function").toBeTruthy()
            OmniAural.action5({ address: { city: "New York" } })
        })

        test('should not allow addAction to accept more than 2 arguments', () => {
            expect(() => OmniAural.addAction("", () => { }, () => { })).toThrow("addAction must have exactly 1 or 2 arguments")
            expect(() => OmniAural.addActions(() => { })).toThrow("All actions must be named functions")
        })

        test('should not allow nameless actions to be added', () => {
            expect(() => OmniAural.addAction(() => { })).toThrow("Actions must be named functions")
            expect(() => OmniAural.addActions(() => { })).toThrow("All actions must be named functions")
        })
    })

    describe("Adding a property", () => {
        test('should contain the new property on the global object', () => {
            OmniAural.addProperty("app_theme", "light")

            expect(OmniAural.UnsafeGlobalInstance.value["app_theme"].value === "light").toBeTruthy()
        })

        test('should contain the new property on the global object and have kept the state structure intact', () => {
            OmniAural.addProperty("account.billing", { cc: 1234123412341234 })

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["billing"].value["cc"].value === 1234123412341234).toBeTruthy()
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()

            expect(OmniAural.state.account.billing.cc.value() === 1234123412341234).toBeTruthy()
            expect(OmniAural.state.account.name.value() === "Josh").toBeTruthy()
        })

        test('should contain the new nested object property on the global object and have kept the structure intact', () => {
            OmniAural.addProperty("account", { nextOfKin: { name: "James", job: "mailman" }, job: "astronaught" })

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["nextOfKin"].value["name"].value === "James").toBeTruthy()
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["nextOfKin"].value["job"].value === "mailman").toBeTruthy()
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["job"].value === "astronaught").toBeTruthy()
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()

            expect(OmniAural.state.account.nextOfKin.name.value() === "James").toBeTruthy()
            expect(OmniAural.state.account.name.value() === "Josh").toBeTruthy()

            OmniAural.addProperty("account.grandParent.name", "Sue")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["grandParent"].value["name"].value === "Sue").toBeTruthy()

            expect(OmniAural.state.account.grandParent.name.value() === "Sue").toBeTruthy()
        })

        test('should error if an existing property is attempted to be added', () => {
            expect(() => OmniAural.addProperty("account.name", "Victor")).toThrow("name already exists at this global state path")
        })
    })

    describe("Deleting a property", () => {
        test("Deletes an omniaural property", () => {
            const jobInfo = {
                title: "Software Engineer",
                years: 10
            }

            expect(() => OmniAural.state.jobInfo.value()).toThrow("Cannot read property 'value' of undefined")
            OmniAural.addProperty("account.jobInfo", jobInfo)
            expect(JSON.stringify(jobInfo) === JSON.stringify(OmniAural.state.account.jobInfo.value())).toBeTruthy()
            OmniAural.state.account.jobInfo.delete()
            expect(() => OmniAural.state.account.jobInfo.value()).toThrow("Cannot read property 'value' of undefined")
            expect(() => OmniAural.UnsafeGlobalInstance.value["account"].value["jobInfo"].value).toThrow("Cannot read property 'value' of undefined")
        })

        test("Throws an error when invalid data is passed in the _deleteProperty private function", () => {
            expect(() => OmniAural.UnsafeGlobalInstance._deleteProperty(5)).toThrow("Path needs to be a string representation of the global state path to the property you want to delete.")
            expect(() => OmniAural.UnsafeGlobalInstance._deleteProperty("account.jobInfo.jiberish")).toThrow("Invalid property path: 'account.jobInfo.jiberish'. Make sure the path to the property exists.")
        })
    })

    describe("Clearing a property", () => {
        const jobInfo = {
            title: "Software Engineer",
            years: 10
        }

        beforeEach(() => {
            OmniAural.addProperty("account.jobInfo", jobInfo)
        })

        afterEach(() => {
            OmniAural.state.account.jobInfo.delete()
        })

        test("Clears out an omniaural object property", () => {
            OmniAural.clearProperty("account.jobInfo")

            expect(Object.keys(OmniAural.state.account.jobInfo.value()).length == 0).toBeTruthy()
            expect(Object.keys(OmniAural.UnsafeGlobalInstance.value["account"].value["jobInfo"].value).length == 0).toBeTruthy()
        })

        test("Throws an error when invalid data is passed in", () => {
            expect(() => OmniAural.clearProperty("account.jobInfo.years")).toThrow("Only object properties can be cleared out. Please make sure your path is correct and that the property is an object.")
            expect(() => OmniAural.clearProperty("account.jobInfo.jiberish")).toThrow("Only object properties can be cleared out. Please make sure your path is correct and that the property is an object.")
            expect(() => OmniAural.clearProperty(5)).toThrow("Path needs to be a string representation of the global state path to the property you want to update.")
        })
    })

})

describe('Global State Updater', () => {
    test('should update top level non-object property', () => {
        OmniAural.state.dev_mode.set(true)

        expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].value).toBeTruthy()
    })

    test('should update top level object property without changing account or address structures', () => {
        OmniAural.state.account.set({ address: { street: "Clark" } })

        expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Clark").toBeTruthy()
        expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["city"].value === "New York").toBeTruthy()
        expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
    })

    test('should update nested object property', () => {
        OmniAural.state.account.address.street.set("State")

        expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "State").toBeTruthy()
    })

    test('should update the global state object correctly', () => {
        OmniAural.state.account.nextOfKin.name.set("Mike")

        expect(OmniAural.state.account.nextOfKin.name.value() === "Mike").toBeTruthy()
    })

    test('should update an existing object property', () => {
        const newInvoice = {
            number: 1234,
            amount: 300,
            type: "$"
        }

        OmniAural.state.invoice.set(newInvoice)
        expect(JSON.stringify(newInvoice) === JSON.stringify(OmniAural.state.invoice.value())).toBeTruthy()
    })

    test("should update the value of an internal property that didn't exist on initialization", () => {
        const newInvoice = {
            number: 1234,
            amount: 300,
            type: "$"
        }

        OmniAural.state.invoice.set(newInvoice)
        expect(JSON.stringify(newInvoice) === JSON.stringify(OmniAural.state.invoice.value())).toBeTruthy()
        OmniAural.state.invoice.amount.set(500)
        expect(OmniAural.state.invoice.amount.value() === 500).toBeTruthy()
    })

    test('should throw an error when trying to add a property using the set function', () => {
        expect(() => OmniAural.state.anotherInvoice.set({})).toThrow("Cannot read property 'set' of undefined")
        expect(() => OmniAural.state.invoice.someOtherPieceOfInfo.set({})).toThrow("Cannot read property 'set' of undefined")
    })

    test('should update the global state object using the "setProperty" function correctly', () => {
        OmniAural.setProperty("account.nextOfKin.name", "Jake")
        expect(OmniAural.state.account.nextOfKin.name.value() === "Jake").toBeTruthy()

        OmniAural.setProperty("account.nextOfKin", { name: "Luke" })
        expect(OmniAural.state.account.nextOfKin.name.value() === "Luke").toBeTruthy()
        expect(OmniAural.state.account.nextOfKin.job.value() === "mailman").toBeTruthy()

        expect(() => OmniAural.setProperty("account.nextOfKin.name")).toThrow("Missing or undefined second argument. Please provide an update value for path 'account.nextOfKin.name'")
        expect(() => OmniAural.setProperty({}, "")).toThrow("Path needs to be a string representation of the global state path to the property you want to update.")
    })

    test('should delete the property content when an object is set to "null"', () => {
        const objectToDelete = { "innerValue": 50 }
        OmniAural.addProperty("deleteValue", 100)
        OmniAural.addProperty("objectToDelete", objectToDelete)

        expect(OmniAural.state.deleteValue.value() === 100).toBeTruthy()
        expect(OmniAural.state.objectToDelete.innerValue.value() === 50).toBeTruthy()

        OmniAural.state.deleteValue.set(null)
        expect(OmniAural.state.deleteValue.value() === null).toBeTruthy()

        OmniAural.state.objectToDelete.set(null)

        expect(() => OmniAural.state.objectToDelete.innerValue.value()).toThrow("Cannot read property 'value' of undefined")
        expect(OmniAural.state.objectToDelete.value() === null).toBeTruthy()
    })

})


describe("Component Testing", () => {
    let component
    let component1
    let component2

    afterEach(() => {
        if (component) {
            component.unmount()
            component = null
        }
        if (component1) {
            component1.unmount()
            component1 = null
        }
        if (component2) {
            component2.unmount()
            component2 = null
        }
    })

    describe("The Class Component", () => {
        test('should register and contain the account name on initialization', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree).toMatchSnapshot()

            expect(tree.children[0].children.includes("Josh")).toBeTruthy()
        })

        test('should register and contain the phone number on initialization', () => {
            component = renderer.create(<MyOtherComponent />)
            let tree = component.toJSON()

            expect(tree).toMatchSnapshot()
            expect(component.root.instance.state.account.phone_number === 1234567890).toBeTruthy()
            expect(tree.children[0].children.includes("1234567890")).toBeTruthy()
        })

        test('should register and contain the address street on initialization using an alias', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[1].children.includes("State")).toBeTruthy()
        })

        test('should update correctly the account name global property and also be listening to global updates', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()
            expect(tree.children[0].children.includes("Josh")).toBeTruthy()

            OmniAural.state.account.name.set("Victor")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Victor").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Victor")).toBeTruthy()
        })

        test('should reflect global state updates on all its live instances', () => {
            component1 = renderer.create(<MyComponent />)
            component2 = renderer.create(<MyComponent />)

            let tree1 = component1.toJSON()
            expect(tree1.children[0].children.includes("Victor")).toBeTruthy()

            let tree2 = component2.toJSON()
            expect(tree2.children[0].children.includes("Victor")).toBeTruthy()

            OmniAural.state.account.name.set("Manny")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Manny").toBeTruthy()

            tree1 = component1.toJSON();
            expect(tree1.children[0].children.includes("Manny")).toBeTruthy()
            tree2 = component2.toJSON();
            expect(tree2.children[0].children.includes("Manny")).toBeTruthy()
        })

        test('should update correctly the address street name global property and also be listening to global updates through the alias', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[1].children.includes("State")).toBeTruthy()

            OmniAural.state.account.address.street.set("Randolph")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[1].children.includes("Randolph")).toBeTruthy()
        })

        test('should update correctly the account name global property from within the component', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[0].children.includes("Manny")).toBeTruthy()
            tree.props.onClick("Jack")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Jack").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Jack")).toBeTruthy()
        })

        test('should reflect global property updates from one component to another', () => {
            component1 = renderer.create(<MyComponent />)
            component2 = renderer.create(<MyComponent />)

            let tree1 = component1.toJSON()
            let tree2 = component2.toJSON()

            expect(tree1.children[0].children.includes("Jack")).toBeTruthy()
            expect(tree2.children[0].children.includes("Jack")).toBeTruthy()

            tree1.props.onClick("Michael")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Michael").toBeTruthy()

            tree1 = component1.toJSON();
            expect(tree1.children[0].children.includes("Michael")).toBeTruthy()

            tree2 = component2.toJSON();
            expect(tree2.children[0].children.includes("Michael")).toBeTruthy()
        })

        test('should add a property and include it in its state', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["zip"]).toBeUndefined()
            expect(tree.children[2].children).toBeNull()

            tree.children[2].props.onClick()

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["zip"].value === 12345).toBeTruthy()
            tree = component.toJSON()
            expect(tree.children[2].children.includes("12345")).toBeTruthy()
        })

        test('should not allow to update local state of global property', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[5].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[5].children.includes("Michael")).toBeTruthy()
        })

        test('should not allow to update local state of global property with alias', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[6].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.person.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[6].children.includes("Michael")).toBeTruthy()
        })

        test('should not allow to update local state of global property with alias with function format ', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[7].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.person.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[7].children.includes("Michael")).toBeTruthy()
        })

        test('should allow to update local state properties', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[8].children.includes("Small Description")).toBeTruthy()
            tree.children[8].props.onClick()
            tree = component.toJSON()
            expect(tree.children[8].children.includes("Long Description")).toBeTruthy()
        })

        test('should allow to update local state properties with functional setState', () => {
            component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[9].children.includes("Small Description")).toBeTruthy()
            tree.children[9].props.onClick()
            tree = component.toJSON()
            expect(tree.children[9].children.includes("Long Description")).toBeTruthy()
        })

        test('Delete a property that was previously registered', () => {
            let component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            tree.children[10].props.onClick()
            tree = component.toJSON()
            expect(() => OmniAural.state.purchase.lastPurchase.value()).toThrow("Cannot read property 'value' of undefined")
            expect(() => OmniAural.UnsafeGlobalInstance.value["purchase"].value["lastPurchase"].value).toThrow("Cannot read property 'value' of undefined")
        })

        test('should throw an error if trying to register for an nonexistent property', () => {
            expect(() => shallow(<MyBadComponent />)).toThrow();
        })
    })

    describe('The Functional Component', () => {
        test('should be registered through the high order function', () => {
            const component = renderer.create(<MyFunctional />)
            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[0].children.includes("Dev mode: true")).toBeTruthy()
            component.unmount()
        })

        test('Listeners contain the correct name of the functional component', () => {
            const component = renderer.create(<MyFunctional />)
            const instance = component.getInstance()

            expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].listeners.get(instance.omniId).component.name === instance.name).toBeTruthy()
            component.unmount()
        })

        test('should update correctly when global state changes', () => {
            const component = renderer.create(<MyFunctional />)
            let tree = component.toJSON()
            expect(tree.children[0].children.includes("Dev mode: true")).toBeTruthy()

            OmniAural.state.dev_mode.set(false)
            expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].value).toBeFalsy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Dev mode: false")).toBeTruthy()
            component.unmount()
        })

        test('should update correctly when a global state change happens from another component', () => {
            const functional = renderer.create(<MyFunctional />)
            const component = renderer.create(<MyComponent />)

            let tree1 = component.toJSON()
            expect(tree1.children[0].children.includes("Michael")).toBeTruthy()

            let tree2 = functional.toJSON()
            expect(tree2.children[0].children.includes("Dev mode: false")).toBeTruthy()

            tree1.props.onClick("Linus")

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Linus").toBeTruthy()

            tree1 = component.toJSON();
            expect(tree1.children[0].children.includes("Linus")).toBeTruthy()

            tree2 = functional.toJSON();
            expect(tree2.children[1].children.includes("Linus")).toBeTruthy()

            functional.unmount()
            component.unmount()
        })
    })

    describe("Property update listener function testing", () => {
        const originalLog = console.log
        let consoleOutput = []
        const mockedLog = output => consoleOutput.push(output)

        describe("Class component listerner tester", () => {
            beforeEach(() => (console.log = mockedLog))

            afterEach(() => {
                console.log = originalLog
                consoleOutput = []
            })

            test("Verifies a listener was set and is fired on global registered property change", () => {
                const component = renderer.create(<MyComponent />)

                OmniAural.state.account.phone_number.set(3112114343)

                expect(consoleOutput).toEqual([
                    "Global State Changed",
                    "Global State Changed"
                ])

                component.unmount()
            })
        })
    })

    describe("OmniAural Hooks", () => {
        test("Hook is created with the correct value", () => {
            let component
            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })
            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[0].children.includes("Linus")).toBeTruthy()

            expect(tree.children[1].children.includes("Randolph in New York")).toBeTruthy()
        })

        test("Hook is updated with the correct value", () => {
            let component
            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })

            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[0].children.includes("Linus")).toBeTruthy()

            act(() => {
                OmniAural.state.account.name.set("Evan")
            })

            expect(OmniAural.state.account.name.value() === "Evan").toBeTruthy()
            tree = component.toJSON();

            expect(tree.children[0].children.includes("Evan")).toBeTruthy()
        })

        test("Hook is updated with the correct nested value", () => {
            let component

            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })

            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[1].children.includes("Randolph in New York")).toBeTruthy()

            act(() => {
                OmniAural.state.account.address.set({ street: "Clark" })
            })

            expect(OmniAural.state.account.address.street.value() === "Clark").toBeTruthy()
            tree = component.toJSON();
            expect(tree.children[1].children.includes("Clark in New York")).toBeTruthy()
        })

        test("Hook is updated with the correct nested value", () => {
            let component

            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })

            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[1].children.includes("Clark in New York")).toBeTruthy()

            act(() => {
                OmniAural.state.account.address.street.set("State")
            })

            expect(OmniAural.state.account.address.street.value() === "State").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[1].children.includes("State in New York")).toBeTruthy()
        })

        test("Hook is updated when nested value is deleted", () => {
            let component

            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })

            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[1].children.includes("State in New York")).toBeTruthy()

            act(() => {
                OmniAural.state.account.address.street.delete()
            })

            expect(OmniAural.state.account.address.street === undefined).toBeTruthy()
            tree = component.toJSON();

            expect(tree.children[1].children.includes("undefined in New York")).toBeTruthy()
        })

        test("Hook is updated when nested object is deleted", () => {
            let component

            act(() => {
                component = renderer.create(<MyHooksFunctional />)
            })

            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()
            expect(tree.children[2].children.includes("Works in Chicago")).toBeTruthy()

            act(() => {
                OmniAural.state.account.currentEmployment.address.delete()
            })

            expect(OmniAural.state.account.currentEmployment.address === undefined).toBeTruthy()
            expect(OmniAural.state.account.currentEmployment.title.value() === "Engineer").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[2].children.includes("Works in undefined")).toBeTruthy()
        })

        test("Verifying property listeners registered and unregistered correctly", () => {
            const originalCount = OmniAural.UnsafeGlobalInstance.value.account.value.name.context["account.name"].length

            const component = renderer.create(<MyHooksFunctional />)

            expect(OmniAural.UnsafeGlobalInstance.value.account.value.name.context.hasOwnProperty("account.name")).toBeTruthy()

            component.unmount()

            expect(originalCount === OmniAural.UnsafeGlobalInstance.value.account.value.name.context["account.name"].length).toBeTruthy()
        })
    })
})
