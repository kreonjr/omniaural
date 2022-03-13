import OmniAural, { initGlobalState } from "../src/OmniAural";
import React from "react";
import renderer, { act } from "react-test-renderer";
import MyComponent from "./MyComponent";
import MyOtherComponent from "./MyOtherComponent";
import MyBadComponent from "./MyBadComponent";
import MyFunctional from "./MyFunctional";
import MyHooksFunctional from "./MyHooksFunctional";
import mockInitialState from "./mockInitialState";

beforeAll(() => {
  initGlobalState(mockInitialState);
});

describe("Component Testing", () => {
  let component;
  let component1;
  let component2;

  afterEach(() => {
    if (component) {
      component.unmount();
      component = null;
    }
    if (component1) {
      component1.unmount();
      component1 = null;
    }
    if (component2) {
      component2.unmount();
      component2 = null;
    }
  });

  describe("The Class Component", () => {
    test("should register and contain the account name on initialization", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(tree).toMatchSnapshot();

      expect(tree.children[0].children.includes("Mike")).toBeTruthy();
    });

    test("should register and contain the phone number on initialization", () => {
      component = renderer.create(<MyOtherComponent />);
      let tree = component.toJSON();

      expect(tree).toMatchSnapshot();
      expect(
        component.root.instance.state.account.phone_number === 1234567890
      ).toBeTruthy();
      expect(tree.children[0].children.includes("1234567890")).toBeTruthy();
    });

    test("should register and contain the address street on initialization using an alias", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(tree.children[1].children.includes("Randolph")).toBeTruthy();
    });

    test("should update correctly the account name global property and also be listening to global updates", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();
      expect(tree.children[0].children.includes("Mike")).toBeTruthy();

      OmniAural.state.account.name.set("Victor");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value ===
          "Victor"
      ).toBeTruthy();

      tree = component.toJSON();
      expect(tree.children[0].children.includes("Victor")).toBeTruthy();
    });

    test("should reflect global state updates on all its live instances", () => {
      component1 = renderer.create(<MyComponent />);
      component2 = renderer.create(<MyComponent />);

      let tree1 = component1.toJSON();
      expect(tree1.children[0].children.includes("Victor")).toBeTruthy();

      let tree2 = component2.toJSON();
      expect(tree2.children[0].children.includes("Victor")).toBeTruthy();

      OmniAural.state.account.name.set("Manny");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value ===
          "Manny"
      ).toBeTruthy();

      tree1 = component1.toJSON();
      expect(tree1.children[0].children.includes("Manny")).toBeTruthy();
      tree2 = component2.toJSON();
      expect(tree2.children[0].children.includes("Manny")).toBeTruthy();
    });

    test("should update correctly the address street name global property and also be listening to global updates through the alias", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(tree.children[1].children.includes("Randolph")).toBeTruthy();

      OmniAural.state.account.address.street.set("State");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
          "street"
        ].value === "State"
      ).toBeTruthy();

      tree = component.toJSON();
      expect(tree.children[1].children.includes("State")).toBeTruthy();
    });

    test("should update correctly the account name global property from within the component", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(tree.children[0].children.includes("Manny")).toBeTruthy();
      tree.props.onClick("Jack");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value ===
          "Jack"
      ).toBeTruthy();

      tree = component.toJSON();
      expect(tree.children[0].children.includes("Jack")).toBeTruthy();
    });

    test("should reflect global property updates from one component to another", () => {
      component1 = renderer.create(<MyComponent />);
      component2 = renderer.create(<MyComponent />);

      let tree1 = component1.toJSON();
      let tree2 = component2.toJSON();

      expect(tree1.children[0].children.includes("Jack")).toBeTruthy();
      expect(tree2.children[0].children.includes("Jack")).toBeTruthy();

      tree1.props.onClick("Michael");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value ===
          "Michael"
      ).toBeTruthy();

      tree1 = component1.toJSON();
      expect(tree1.children[0].children.includes("Michael")).toBeTruthy();

      tree2 = component2.toJSON();
      expect(tree2.children[0].children.includes("Michael")).toBeTruthy();
    });

    test("should add a property and include it in its state", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
          "zip"
        ]
      ).toBeUndefined();
      expect(tree.children[2].children).toBeNull();

      tree.children[2].props.onClick();

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
          "zip"
        ].value === 12345
      ).toBeTruthy();
      tree = component.toJSON();
      expect(tree.children[2].children.includes("12345")).toBeTruthy();
    });

    test("should not allow to update local state of global property", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(() => tree.children[5].props.onClick()).toThrow(
        'You are attempting to localy update a global variable registered at path "state.name". Please use the global property setter.'
      );

      tree = component.toJSON();
      expect(tree.children[5].children.includes("Michael")).toBeTruthy();
    });

    test("should not allow to update local state of global property with alias", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(() => tree.children[6].props.onClick()).toThrow(
        'You are attempting to localy update a global variable registered at path "state.person.name". Please use the global property setter.'
      );

      tree = component.toJSON();
      expect(tree.children[6].children.includes("Michael")).toBeTruthy();
    });

    test("should not allow to update local state of global property with alias with function format ", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(() => tree.children[7].props.onClick()).toThrow(
        'You are attempting to localy update a global variable registered at path "state.person.name". Please use the global property setter.'
      );

      tree = component.toJSON();
      expect(tree.children[7].children.includes("Michael")).toBeTruthy();
    });

    test("should allow to update local state properties", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(
        tree.children[8].children.includes("Small Description")
      ).toBeTruthy();
      tree.children[8].props.onClick();
      tree = component.toJSON();
      expect(
        tree.children[8].children.includes("Long Description")
      ).toBeTruthy();
    });

    test("should allow to update local state properties with functional setState", () => {
      component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      expect(
        tree.children[9].children.includes("Small Description")
      ).toBeTruthy();
      tree.children[9].props.onClick();
      tree = component.toJSON();
      expect(
        tree.children[9].children.includes("Long Description")
      ).toBeTruthy();
    });

    test("Delete a property that was previously registered", () => {
      let component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      tree.children[10].props.onClick();
      tree = component.toJSON();
      expect(() => OmniAural.state.purchase.lastPurchase.value()).toThrow(
        "Cannot read property 'value' of undefined"
      );
      expect(
        () =>
          OmniAural.UnsafeGlobalInstance.value["purchase"].value["lastPurchase"]
            .value
      ).toThrow("Cannot read property 'value' of undefined");
    });

    test("Set a previously registered property to null", () => {
      let component = renderer.create(<MyComponent />);
      let tree = component.toJSON();

      tree.children[11].children.includes("200");
      tree.children[11].props.onClick();
      tree = component.toJSON();
      expect(OmniAural.state.nulledPurchase.value()).toBeNull();
      expect(
        OmniAural.UnsafeGlobalInstance.value["nulledPurchase"].value
      ).toBeNull();

      tree.children[11].children.includes("null");
    });

    test("should throw an error if trying to register for an nonexistent property", () => {
      expect(() => shallow(<MyBadComponent />)).toThrow();
    });
  });

  describe("The Functional Component", () => {
    test("should be registered through the high order function", () => {
      const component = renderer.create(<MyFunctional />);
      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(
        tree.children[0].children.includes("Dev mode: false")
      ).toBeTruthy();
      component.unmount();
    });

    test("Listeners contain the correct name of the functional component", () => {
      const component = renderer.create(<MyFunctional />);
      const instance = component.getInstance();

      expect(
        OmniAural.UnsafeGlobalInstance.value["dev_mode"].listeners.get(
          instance.omniId
        ).component.name === instance.name
      ).toBeTruthy();
      component.unmount();
    });

    test("should update correctly when global state changes", () => {
      const component = renderer.create(<MyFunctional />);
      let tree = component.toJSON();
      expect(
        tree.children[0].children.includes("Dev mode: false")
      ).toBeTruthy();

      OmniAural.state.dev_mode.set(true);
      expect(
        OmniAural.UnsafeGlobalInstance.value["dev_mode"].value
      ).toBeTruthy();

      tree = component.toJSON();
      expect(tree.children[0].children.includes("Dev mode: true")).toBeTruthy();
      component.unmount();
    });

    test("should update correctly when a global state change happens from another component", () => {
      const functional = renderer.create(<MyFunctional />);
      const component = renderer.create(<MyComponent />);

      let tree1 = component.toJSON();
      expect(tree1.children[0].children.includes("Michael")).toBeTruthy();

      let tree2 = functional.toJSON();
      expect(
        tree2.children[0].children.includes("Dev mode: true")
      ).toBeTruthy();

      tree1.props.onClick("Linus");

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value ===
          "Linus"
      ).toBeTruthy();

      tree1 = component.toJSON();
      expect(tree1.children[0].children.includes("Linus")).toBeTruthy();

      tree2 = functional.toJSON();
      expect(tree2.children[1].children.includes("Linus")).toBeTruthy();

      functional.unmount();
      component.unmount();
    });
  });

  describe("Property update listener function testing", () => {
    const originalLog = console.log;
    let consoleOutput = [];
    const mockedLog = (output) => consoleOutput.push(output);

    describe("Class component listerner tester", () => {
      beforeEach(() => (console.log = mockedLog));

      afterEach(() => {
        console.log = originalLog;
        consoleOutput = [];
      });

      test("Verifies a listener was set and is fired on global registered property change", () => {
        const component = renderer.create(<MyComponent />);

        OmniAural.state.account.phone_number.set(3112114343);

        expect(consoleOutput).toEqual([
          "Global State Changed",
          "Global State Changed",
          "Global State Changed",
        ]);

        component.unmount();
      });
    });
  });

  describe("OmniAural Hooks", () => {
    test("Hook is created with the correct value", () => {
      let component;
      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });
      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(tree.children[0].children.includes("Linus")).toBeTruthy();

      expect(
        tree.children[1].children.includes("State in Chicago")
      ).toBeTruthy();
    });

    test("Hook is updated with the correct value", () => {
      let component;
      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(tree.children[0].children.includes("Linus")).toBeTruthy();

      act(() => {
        OmniAural.state.account.name.set("Evan");
      });

      expect(OmniAural.state.account.name.value() === "Evan").toBeTruthy();
      tree = component.toJSON();

      expect(tree.children[0].children.includes("Evan")).toBeTruthy();
    });

    test("Hook is updated with the correct nested value through setting an object", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(
        tree.children[1].children.includes("State in Chicago")
      ).toBeTruthy();

      act(() => {
        OmniAural.state.account.address.set({ street: "Clark" });
      });

      expect(
        OmniAural.state.account.address.street.value() === "Clark"
      ).toBeTruthy();
      tree = component.toJSON();
      expect(
        tree.children[1].children.includes("Clark in Chicago")
      ).toBeTruthy();
    });

    test("Hook is updated with the correct nested value through setting a property", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(
        tree.children[1].children.includes("Clark in Chicago")
      ).toBeTruthy();

      act(() => {
        OmniAural.state.account.address.street.set("Randolph");
      });

      expect(
        OmniAural.state.account.address.street.value() === "Randolph"
      ).toBeTruthy();

      tree = component.toJSON();
      expect(
        tree.children[1].children.includes("Randolph in Chicago")
      ).toBeTruthy();
    });

    test("Hook is updated when nested value is deleted", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();

      expect(
        tree.children[1].children.includes("Randolph in Chicago")
      ).toBeTruthy();

      act(() => {
        OmniAural.state.account.address.street.delete();
      });

      expect(OmniAural.state.account.address.street === undefined).toBeTruthy();
      tree = component.toJSON();

      expect(
        tree.children[1].children.includes("undefined in Chicago")
      ).toBeTruthy();
    });

    test("Hook is updated when nested object is deleted", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(
        tree.children[2].children.includes("Works in Chicago")
      ).toBeTruthy();

      act(() => {
        OmniAural.state.account.currentEmployment.address.delete();
      });

      expect(
        OmniAural.state.account.currentEmployment.address === undefined
      ).toBeTruthy();
      expect(
        OmniAural.state.account.currentEmployment.title.value() === "Engineer"
      ).toBeTruthy();

      tree = component.toJSON();
      expect(
        tree.children[2].children.includes("Works in undefined")
      ).toBeTruthy();
    });

    test("Hook is updated when property is set to null", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(tree.children[3].children.includes("value")).toBeTruthy();

      act(() => {
        OmniAural.state.nulledOut.set(null);
      });

      expect(OmniAural.state.nulledOut.value()).toBeNull();

      tree = component.toJSON();
      expect(tree.children[3].children.includes("undefined")).toBeTruthy();
    });

    test("Hook is updated when null object is set to a value", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(tree.children[3].children.includes("undefined")).toBeTruthy();

      act(() => {
        OmniAural.state.nulledOut.set({ key: "value" });
      });

      expect(OmniAural.state.nulledOut.key.value()).toBe("value");

      tree = component.toJSON();
      expect(tree.children[3].children.includes("value")).toBeTruthy();
    });

    test("Hook is updated when an object is set to a really large object", () => {
      let component;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(tree.children[5].children[0]).toBe(
        "Large object contains data: false"
      );

      act(() => {
        component.root.findAllByType("button")[0].props.onClick();
      });

      expect(
        OmniAural.state.thousandItems.episodes.UtlJT6vWjE.c.value()
      ).toBeTruthy();

      tree = component.toJSON();
      expect(tree.children[5].children[0]).toBe(
        "Large object contains data: true"
      );
    });

    test("correctly pass context when setting new properties to object", () => {
      let component;
      const globalObject = OmniAural.UnsafeGlobalInstance.value;

      act(() => {
        component = renderer.create(<MyHooksFunctional />);
      });

      act(() => {
        component.root.findAllByType("button")[1].props.onClick();
      });

      expect(
        OmniAural.state.account?.address?.tempAddress?.street?.value() ===
          "State"
      ).toBeTruthy();
      expect(
        OmniAural.state.account?.address?.tempAddress?.number?.value() === 13
      ).toBeTruthy();
      expect(
        OmniAural.state.account?.address?.tempAddress?.street?.value() === "State"
      ).toBeTruthy();
      expect(
        Object.keys(globalObject.account.value.address.value.tempAddress.context).length > 0
      ).toBeTruthy();
      expect(
        Object.keys(globalObject.account.value.address.value.tempAddress.value.number.context).length > 0
      ).toBeTruthy();
      expect(
        Object.keys(globalObject.account.value.address.value.tempAddress.value.street.context).length > 0
      ).toBeTruthy();
    });

    test("Verifying property listeners registered and unregistered correctly", () => {
      const originalCount =
        OmniAural.UnsafeGlobalInstance.value.account.value.name.context[
          "account.name"
        ].length;

      const component = renderer.create(<MyHooksFunctional />);

      expect(
        OmniAural.UnsafeGlobalInstance.value.account.value.name.context.hasOwnProperty(
          "account.name"
        )
      ).toBeTruthy();

      component.unmount();

      expect(
        originalCount ===
          OmniAural.UnsafeGlobalInstance.value.account.value.name.context[
            "account.name"
          ].length
      ).toBeTruthy();
    });
  });
});
