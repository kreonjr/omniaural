import { GlobalState, initGlobalState, GlobalSetters } from "../index";
import React from 'react';
import renderer from "react-test-renderer"
import MyComponent from "./MyComponent";
import MyBadComponent from "./MyBadComponent";
import MyFunctional from "./MyFunctional";

beforeAll(() => {
    initGlobalState({
        account: {
            name: "Josh",
            address: {
                street: "Randolph",
                city: "Chicago"
            }
        },
        dev_mode: false
    })
});

describe('Basic Global State Manager', () => {

    test('should validate global state has been initialized correctly', () => {
        const globalObject = GlobalState.UnsafeGlobalInstance.value

        expect(globalObject["dev_mode"].value).toBeFalsy()
        expect(globalObject["account"].value["name"].value === "Josh").toBeTruthy()
        expect(globalObject["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
    })

    describe("Action Creator", () => {
        test('should create an action on the Global State Object', () => {
            GlobalState.addGlobalAction('action1', () => {

            })

            expect(GlobalState.action1).toBeTruthy()
            expect(typeof GlobalState.action1 === "function").toBeTruthy()
        })

        test('should contain the global state snapshot getter and setter in the callback', () => {
            GlobalState.addGlobalAction('action2', (props) => {
                expect(props.getGlobalState).toBeTruthy()
                expect(typeof props.getGlobalState === "function").toBeTruthy()
                expect(props.globalSetters).toBeTruthy()
                expect(typeof props.globalSetters === "object").toBeTruthy()
                const currentSnapshot = props.getGlobalState()
                expect(JSON.stringify(currentSnapshot) === JSON.stringify(GlobalState.UnsafeGlobalInstance.getCurrentState()))
            })

            expect(GlobalState.action2).toBeTruthy()
            expect(typeof GlobalState.action2 === "function").toBeTruthy()
            GlobalState.action2()
        })

        //Add test to make sure action performs given funciton body
        test('should execute the given action to update global state', () => {
            GlobalState.addGlobalAction('action3', (props) => {
                const { globalSetters, account } = props
                globalSetters.account.set(account)

                expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
                expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["city"].value === "New York").toBeTruthy()
                expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
            })

            expect(GlobalState.action3).toBeTruthy()
            expect(typeof GlobalState.action3 === "function").toBeTruthy()
            GlobalState.action3({ account: { address: { city: "New York" } } })
        })
    })

    describe("Adding a property", () => {
        test('should contain the new property on the global object', () => {
            GlobalState.addProperty("app_theme", "light")

            expect(GlobalState.UnsafeGlobalInstance.value["app_theme"].value === "light").toBeTruthy()
        })

        test('should contain the new property on the global object and have kept the structure intact', () => {
            GlobalState.addProperty("account.billing", { cc: 1234123412341234 })

            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["billing"].value["cc"].value === 1234123412341234).toBeTruthy()
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
        })

        test('should contain the new nested object property on the global object and have kept the structure intact', () => {
            GlobalState.addProperty("account", { nextOfKin: { name: "James" } })

            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["nextOfKin"].value["name"].value === "James").toBeTruthy()
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()

            GlobalState.addProperty("account.grandParent.name", "Sue")
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["grandParent"].value["name"].value === "Sue").toBeTruthy()
        })

        test('should error if an existing property is attempted to be added', () => {
            expect(() => GlobalState.addProperty("account.name", "Victor")).toThrow("name already exists at this global state path")
        })
    })

})

describe('Global Setters', () => {
    test('should update top level non-object property', () => {
        GlobalSetters.dev_mode.set(true)

        expect(GlobalState.UnsafeGlobalInstance.value["dev_mode"].value).toBeTruthy()
    })

    test('should update top level object property without changing account or address structures', () => {
        GlobalSetters.account.set({ address: { street: "Clark" } })

        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Clark").toBeTruthy()
        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["city"].value === "New York").toBeTruthy()
        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
    })

    test('should update nested object property', () => {
        GlobalSetters.account.address.street.set("State")

        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "State").toBeTruthy()
    })

    test('should error if a property does not exist at provided path', () => {
        expect(() => GlobalSetters.account.set({ contact: { tel: 1234345544 } })).toThrow("Property 'contact' not present in object 'account'")
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

            GlobalSetters.account.name.set("Victor")
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Victor").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Victor")).toBeTruthy()
        })

        test('should update correctly the address street name global property and also be listening to global updates through the alias', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[1].children.includes("State")).toBeTruthy()

            GlobalSetters.account.address.street.set("Randolph")
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[1].children.includes("Randolph")).toBeTruthy()
        })

        test('should update correctly the account name global property from within the component', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[0].children.includes("Victor")).toBeTruthy()
            tree.props.onClick("Jack")
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Jack").toBeTruthy()

            tree = component.toJSON();
            expect(tree.children[0].children.includes("Jack")).toBeTruthy()
        })

        test('should add a property and include it in its state', () => {
            const component = renderer.create(<MyComponent />)
            let tree = component.toJSON()

            expect(tree.children[2].children).toBeNull()
            tree.children[2].props.onClick()
            expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["zip"].value === 12345).toBeTruthy()

            tree = component.toJSON()
            expect(tree.children[2].children.includes("12345")).toBeTruthy()

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

        test('should update correctly when global state changes', () => {
            const component = renderer.create(<MyFunctional />)
            let tree = component.toJSON()
            expect(tree.children.includes("Dev mode: true")).toBeTruthy()

            GlobalSetters.dev_mode.set(false)
            expect(GlobalState.UnsafeGlobalInstance.value["dev_mode"].value).toBeFalsy()

            tree = component.toJSON();
            expect(tree.children.includes("Dev mode: false")).toBeTruthy()
        })
    })

})

