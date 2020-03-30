import { OmniAural, getDeepValue } from "../src/index";
import React from 'react';
import renderer from "react-test-renderer"
import MyComponent from "./MyComponent";
import MyBadComponent from "./MyBadComponent";
import MyFunctional from "./MyFunctional";
import mockInitialState from "./mockInitialState";
const fetch = require("node-fetch").default

beforeAll(() => {
    OmniAural.initGlobalState(mockInitialState)
});

describe('Global State Manager', () => {

    test('should validate global state has been initialized correctly', () => {
        const globalObject = OmniAural.UnsafeGlobalInstance.value

        expect(globalObject["dev_mode"].value).toBeFalsy()
        expect(globalObject["account"].value["name"].value === "Mike").toBeTruthy()
        expect(globalObject["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
    })

    test('should validate global state was declared correctly in the state object', () => {
        const currentSnapshot = OmniAural.state.value()
        expect(JSON.stringify(currentSnapshot) === JSON.stringify(mockInitialState))
    })

    test('should get properties value from the state object', () => {
        expect(OmniAural.state.dev_mode.value()).toBeFalsy()
        expect(OmniAural.state.account.address.city.value() === "Chicago").toBeTruthy()
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
                return fetch('https://jsonplaceholder.typicode.com/todos/100')
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
            OmniAural.addProperty("account", { nextOfKin: { name: "James" } })

            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["nextOfKin"].value["name"].value === "James").toBeTruthy()
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

    test('should error if a property does not exist at provided path', () => {
        expect(() => OmniAural.state.account.set({ contact: { tel: 1234345544 } })).toThrow("Property 'contact' not present in object 'account'")
    })
})


describe("Component Testing", () => {
    describe("The Class Component", () => {
        test('should register and contain the account name on initialization', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree).toMatchSnapshot()

            expect(tree.children[0].children.includes("Josh")).toBeTruthy()
        })

        test('should register and contain the address street on initialization using an alias', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()
            expect(tree).toMatchSnapshot()

            expect(tree.children[1].children.includes("State")).toBeTruthy()
        })

        test('should update correctly the account name global property and also be listening to global updates', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()
            expect(tree.children[0].children.includes("Josh")).toBeTruthy()

            OmniAural.state.account.name.set("Victor")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Victor").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Victor")).toBeTruthy()
        })

        test('should update correctly the address street name global property and also be listening to global updates through the alias', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[1].children.includes("State")).toBeTruthy()

            OmniAural.state.account.address.street.set("Randolph")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[1].children.includes("Randolph")).toBeTruthy()
        })

        test('should update correctly the account name global property from within the component', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[0].children.includes("Victor")).toBeTruthy()
            tree.props.onClick("Jack")
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value === "Jack").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Jack")).toBeTruthy()
        })

        test('should add a property and include it in its state', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[2].children).toBeNull()
            tree.children[2].props.onClick()
            expect(OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value["zip"].value === 12345).toBeTruthy()

            tree = component.toJSON()
            expect(tree.children[2].children.includes("12345")).toBeTruthy()

        })

        test('should not allow to update local state of global property', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[5].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[5].children.includes("Jack")).toBeTruthy()
        })

        test('should not allow to update local state of global property with alias', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[6].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.person.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[6].children.includes("Jack")).toBeTruthy()
        })

        test('should not allow to update local state of global property with alias with function format ', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(() => tree.children[7].props.onClick()).toThrow('You are attempting to localy update a global variable registered at path \"state.person.name\". Please use the global property setter.')

            tree = component.toJSON()
            expect(tree.children[7].children.includes("Jack")).toBeTruthy()
        })

        test('should allow to update local state properties', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[8].children.includes("Small Description")).toBeTruthy()
            tree.children[8].props.onClick()
            tree = component.toJSON()
            expect(tree.children[8].children.includes("Long Description")).toBeTruthy()
        })

        test('should allow to update local state properties with functional setState', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[9].children.includes("Small Description")).toBeTruthy()
            tree.children[9].props.onClick()
            tree = component.toJSON()
            expect(tree.children[9].children.includes("Long Description")).toBeTruthy()
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

            expect(tree.children.includes("Dev mode: true")).toBeTruthy()
        })

        test('Listeners contain the correct name of the functional component', () => {
            const component = renderer.create(<MyFunctional />)
            const instance = component.getInstance()

            expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].listeners.get(instance.omniId).component.name === instance.name).toBeTruthy()
        })

        test('should update correctly when global state changes', () => {
            const component = renderer.create(<MyFunctional />)
            let tree = component.toJSON()
            expect(tree.children.includes("Dev mode: true")).toBeTruthy()

            OmniAural.state.dev_mode.set(false)
            expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].value).toBeFalsy()

            tree = component.toJSON();
            expect(tree.children.includes("Dev mode: false")).toBeTruthy()
        })
    })

})

let addAction = (action) => {
    OmniAural.addAction(action.name, action)
}

let myAction = (props) => { }
addAction(myAction)

