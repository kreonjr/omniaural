import { GlobalState, initGlobalState, GlobalSetters } from "./index";
import React from 'react';
import renderer from "react-test-renderer"
import MyComponent from "./MyComponent.react";

beforeAll(() => {
    initGlobalState({
        account: {
            name: "Josh",
            address: {
                street: "Randolph"
            }
        },
        dev_mode: false
    })
});

test('should validate global state has been initialized correctly', () => {
    const globalObject = GlobalState.UnsafeGlobalInstance.value

    expect(globalObject["dev_mode"].value === false).toBeTruthy()
    expect(globalObject["account"].value["name"].value === "Josh").toBeTruthy()
    expect(globalObject["account"].value["address"].value["street"].value === "Randolph").toBeTruthy()
})

describe('Global Setters', () => {
    test('should update top level non-object property', () => {
        GlobalSetters.dev_mode.set(true)

        expect(GlobalState.UnsafeGlobalInstance.value["dev_mode"].value === true).toBeTruthy()
    })

    test('should update top level object property', () => {
        GlobalSetters.account.set({ address: { street: "Clark" } })

        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Clark").toBeTruthy()
    })

    test('should update nested object property', () => {
        GlobalSetters.account.address.street.set("State")

        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "State").toBeTruthy()
    })

    test('should update object property by merging into existing object', () => {
        GlobalSetters.account.set({ address: { street: "Clark" } })

        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["address"].value["street"].value === "Clark").toBeTruthy()
        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Josh").toBeTruthy()
    })

})

describe("Component Testing", () => {
    test('should register and contain the account name on initialization', () => {
        const component = renderer.create(<MyComponent />)
        let tree = component.toJSON()
        expect(tree).toMatchSnapshot()

        expect(tree.children.includes("Josh")).toBeTruthy()
    })

    test('should update the account name global property and also be listening to global updates', () => {
        const component = renderer.create(<MyComponent />)
        let tree = component.toJSON()
        expect(tree).toMatchSnapshot()

        expect(tree.children.includes("Josh")).toBeTruthy()
        GlobalSetters.account.name.set("Victor")
        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Victor").toBeTruthy()

        tree = component.toJSON();
        expect(tree).toMatchSnapshot();
        expect(tree.children.includes("Victor")).toBeTruthy()
    })

    test('should update the account name global property from within the component', () => {
        const component = renderer.create(<MyComponent />)
        let tree = component.toJSON()
        expect(tree).toMatchSnapshot()

        expect(tree.children.includes("Victor")).toBeTruthy()
        tree.props.onClick("Jack")
        expect(GlobalState.UnsafeGlobalInstance.value["account"].value["name"].value === "Jack").toBeTruthy()

        tree = component.toJSON();
        expect(tree).toMatchSnapshot();
        expect(tree.children.includes("Jack")).toBeTruthy()
    })
})

