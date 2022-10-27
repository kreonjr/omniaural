import OmniAural, { initGlobalState } from "../src/OmniAural";
import mockInitialState from "./mockInitialState";
const fetch = require("node-fetch").default;

beforeAll(() => {
  initGlobalState(mockInitialState);
});

describe("Global State Manager", () => {
  test("should validate global state has been initialized correctly", () => {
    const globalObject = OmniAural.UnsafeGlobalInstance.value;

    expect(globalObject["dev_mode"].value).toBeFalsy();
    expect(globalObject["account"].value["name"].value).toBe("Mike");
    expect(globalObject["account"].value["address"].value["street"].value).toBe(
      "Randolph"
    );
    expect(globalObject["items"].value.length).toBe(0);
  });

  test("should validate global state was declared correctly in the state object", () => {
    const currentSnapshot = OmniAural.state.value();
    expect(
      JSON.stringify(currentSnapshot) === JSON.stringify(mockInitialState)
    );
  });

  test("should provide all the properties values from the state object", () => {
    expect(OmniAural.state.dev_mode.value()).toBeFalsy();
    expect(OmniAural.state.account.name.value()).toBe("Mike");
    expect(OmniAural.state.account.address.city.value()).toBe("Chicago");
    expect(OmniAural.state.account.address.street.value()).toBe("Randolph");
    expect(OmniAural.state.account.phone_number.value()).toBe(1234567890);
    expect(OmniAural.state.dev_mode.value()).toBeFalsy();
  });

  describe("Action Creator", () => {
    test("should create an action on the Global State Object", () => {
      OmniAural.addAction("action1", () => {});

      expect(typeof OmniAural.action1).toBe("function");
    });

    test("should create multiple actions on the Global State Object", () => {
      const action2 = () => {};
      const action3 = () => {};
      const action4 = function () {};
      OmniAural.addActions(action2, action3, action4);

      expect(typeof OmniAural.action2).toBe("function");
      expect(typeof OmniAural.action3).toBe("function");
      expect(typeof OmniAural.action4).toBe("function");
    });

    test("should allow for async actions to update global state", async () => {
      OmniAural.addAction("asyncAction", () => {
        return fetch("https://www.google.com").then((response) => {
          OmniAural.state.account.name.set("Josh");
        });
      });

      expect(typeof OmniAural.asyncAction).toBe("function");
      await OmniAural.asyncAction();
      expect(OmniAural.state.account.name.value()).toBe("Josh");
    });

    test("should execute the given action and update global state", () => {
      const action5 = (account) => {
        OmniAural.state.account.set(account);

        expect(
          OmniAural.UnsafeGlobalInstance.value["account"].value["address"]
            .value["street"].value
        ).toBe("Randolph");
        expect(OmniAural.state.account.address.street.value()).toBe("Randolph");

        expect(
          OmniAural.UnsafeGlobalInstance.value["account"].value["address"]
            .value["city"].value
        ).toBe("New York");
        expect(
          OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value
        ).toBe("Josh");
      };
      OmniAural.addAction(action5);

      expect(OmniAural.action5).toBeTruthy();
      expect(typeof OmniAural.action5).toBe("function");
      OmniAural.action5({ address: { city: "New York" } });
    });

    test("should not allow addAction to accept more than 2 arguments", () => {
      expect(() =>
        OmniAural.addAction(
          "",
          () => {},
          () => {}
        )
      ).toThrow("addAction must have exactly 1 or 2 arguments");
      expect(() => OmniAural.addActions(() => {})).toThrow(
        "All actions must be named functions"
      );
    });

    test("should not allow nameless actions to be added", () => {
      expect(() => OmniAural.addAction(() => {})).toThrow(
        "Actions must be named functions"
      );
      expect(() => OmniAural.addActions(() => {})).toThrow(
        "All actions must be named functions"
      );
    });
  });

  describe("Adding a property", () => {
    test("should contain the new property on the global object", () => {
      OmniAural.addProperty("app_theme", "light");

      expect(OmniAural.UnsafeGlobalInstance.value["app_theme"].value).toBe(
        "light"
      );
    });

    test("should contain the new property on the global object and have kept the state structure intact", () => {
      OmniAural.addProperty("account.billing", { cc: 1234123412341234 });

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["billing"].value[
          "cc"
        ].value
      ).toBe(1234123412341234);
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value
      ).toBe("Josh");

      expect(OmniAural.state.account.billing.cc.value()).toBe(1234123412341234);
      expect(OmniAural.state.account.name.value()).toBe("Josh");
    });

    test("should contain the new nested object property on the global object and have kept the structure intact", () => {
      OmniAural.addProperty("account", {
        nextOfKin: { name: "James", job: "mailman" },
        job: "astronaught",
      });

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["nextOfKin"]
          .value["name"].value
      ).toBe("James");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["nextOfKin"]
          .value["job"].value
      ).toBe("mailman");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["job"].value
      ).toBe("astronaught");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value
      ).toBe("Josh");

      expect(OmniAural.state.account.nextOfKin.name.value()).toBe("James");
      expect(OmniAural.state.account.name.value()).toBe("Josh");

      OmniAural.addProperty("account.grandParent.name", "Sue");
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["grandParent"]
          .value["name"].value
      ).toBe("Sue");

      expect(OmniAural.state.account.grandParent.name.value()).toBe("Sue");
    });

    test("should error if an existing property is attempted to be added", () => {
      expect(() => OmniAural.addProperty("account.name", "Victor")).toThrow(
        "name already exists at this global state path"
      );
    });

    test("should be able to handle property keys with the '.' character in the name", () => {
      OmniAural.addProperty("account.domain", {"omniaural.com": "token"});

      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["domain"].value["omniaural.com"].value
      ).toBe("token");

      expect(OmniAural.state.account.domain["omniaural.com"].value()).toBe("omniaural.com");
    });
  });

  describe("Deleting a property", () => {
    test("Deletes an omniaural property", () => {
      const jobInfo = {
        title: "Software Engineer",
        years: 10,
      };

      expect(() => OmniAural.state.jobInfo.value()).toThrow(
        "Cannot read property 'value' of undefined"
      );
      OmniAural.addProperty("account.jobInfo", jobInfo);
      expect(JSON.stringify(OmniAural.state.account.jobInfo.value())).toBe(
        JSON.stringify(jobInfo)
      );
      OmniAural.state.account.jobInfo.delete();
      expect(() => OmniAural.state.account.jobInfo.value()).toThrow(
        "Cannot read property 'value' of undefined"
      );
      expect(
        () =>
          OmniAural.UnsafeGlobalInstance.value["account"].value["jobInfo"].value
      ).toThrow("Cannot read property 'value' of undefined");
    });

    test("Throws an error when invalid data is passed in the _deleteProperty private function", () => {
      expect(() => OmniAural.UnsafeGlobalInstance._deleteProperty(5)).toThrow(
        "Path needs to be a string representation of the global state path to the property you want to delete."
      );
      expect(() =>
        OmniAural.UnsafeGlobalInstance._deleteProperty(
          "account.jobInfo.jiberish"
        )
      ).toThrow(
        "Invalid property path: 'account.jobInfo.jiberish'. Make sure the path to the property exists."
      );
    });
  });

  describe("Clearing a property", () => {
    const jobInfo = {
      title: "Software Engineer",
      years: 10,
    };

    beforeEach(() => {
      OmniAural.addProperty("account.jobInfo", jobInfo);
    });

    afterEach(() => {
      OmniAural.state.account.jobInfo.delete();
    });

    test("Clears out an omniaural object property", () => {
      OmniAural.clearProperty("account.jobInfo");

      expect(Object.keys(OmniAural.state.account.jobInfo.value()).length).toBe(
        0
      );
      expect(
        Object.keys(
          OmniAural.UnsafeGlobalInstance.value["account"].value["jobInfo"].value
        ).length
      ).toBe(0);
    });

    test("Throws an error when invalid data is passed in", () => {
      expect(() => OmniAural.clearProperty("account.jobInfo.years")).toThrow(
        "Only object properties can be cleared out. Please make sure your path is correct and that the property is an object."
      );
      expect(() => OmniAural.clearProperty("account.jobInfo.jiberish")).toThrow(
        "Only object properties can be cleared out. Please make sure your path is correct and that the property is an object."
      );
      expect(() => OmniAural.clearProperty(5)).toThrow(
        "Path needs to be a string representation of the global state path to the property you want to update."
      );
    });
  });
});

describe("Global State Updater", () => {
  test("should update top level non-object property", () => {
    OmniAural.state.dev_mode.set(true);

    expect(OmniAural.UnsafeGlobalInstance.value["dev_mode"].value).toBeTruthy();
  });

  test("should update top level object property without changing property parent structures", () => {
    OmniAural.state.account.set({ address: { street: "Clark" } });

    expect(
      OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
        "street"
      ].value
    ).toBe("Clark");
    expect(
      OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
        "city"
      ].value
    ).toBe("New York");
    expect(
      OmniAural.UnsafeGlobalInstance.value["account"].value["name"].value
    ).toBe("Josh");
  });

  test("should update nested object property", () => {
    OmniAural.state.account.address.street.set("State");

    expect(
      OmniAural.UnsafeGlobalInstance.value["account"].value["address"].value[
        "street"
      ].value
    ).toBe("State");
  });

  test("should update the global state object correctly", () => {
    OmniAural.state.account.nextOfKin.name.set("Mike");

    expect(OmniAural.state.account.nextOfKin.name.value()).toBe("Mike");
  });

  test("should update an existing object property", () => {
    const newInvoice = {
      number: 1234,
      amount: 300,
      type: "$",
    };

    OmniAural.state.invoice.set(newInvoice);
    expect(JSON.stringify(OmniAural.state.invoice.value())).toBe(
      JSON.stringify(newInvoice)
    );
  });

  test("should update the value of an internal property that didn't exist on initialization", () => {
    const newInvoice = {
      number: 1234,
      amount: 300,
      type: "$",
    };

    OmniAural.state.invoice.set(newInvoice);
    expect(JSON.stringify(OmniAural.state.invoice.value())).toBe(
      JSON.stringify(newInvoice)
    );
    OmniAural.state.invoice.amount.set(500);
    expect(OmniAural.state.invoice.amount.value()).toBe(500);
  });

  test("should update the value of an internal property that was null on initialization", () => {
    const lastReceipt = {
      number: 1234,
      amount: 300,
      type: "$",
    };

    OmniAural.state.lastReceipt.set(lastReceipt);
    expect(JSON.stringify(OmniAural.state.lastReceipt.value())).toBe(
      JSON.stringify(lastReceipt)
    );

    expect(OmniAural.state.lastReceipt.amount.value()).toBe(300);
  });

  test("should throw an error when trying to add a property using the set function", () => {
    expect(() => OmniAural.state.anotherInvoice.set({})).toThrow(
      "Cannot read property 'set' of undefined"
    );
    expect(() => OmniAural.state.invoice.someOtherPieceOfInfo.set({})).toThrow(
      "Cannot read property 'set' of undefined"
    );
  });

  test('should update the global state object using the "setProperty" function correctly', () => {
    OmniAural.setProperty("account.nextOfKin.name", "Jake");
    expect(OmniAural.state.account.nextOfKin.name.value()).toBe("Jake");

    OmniAural.setProperty("account.nextOfKin", { name: "Luke" });
    expect(OmniAural.state.account.nextOfKin.name.value()).toBe("Luke");
    expect(OmniAural.state.account.nextOfKin.job.value()).toBe("mailman");

    expect(() => OmniAural.setProperty("account.nextOfKin.name")).toThrow(
      "Missing or undefined second argument. Please provide an update value for path 'account.nextOfKin.name'"
    );
    expect(() => OmniAural.setProperty({}, "")).toThrow(
      "Path needs to be a string representation of the global state path to the property you want to update."
    );
  });

  test('should delete the property content when an object is set to "null"', () => {
    const objectToDelete = { innerValue: 50 };
    OmniAural.addProperty("deleteValue", 100);
    OmniAural.addProperty("objectToDelete", objectToDelete);

    expect(OmniAural.state.deleteValue.value()).toBe(100);
    expect(OmniAural.state.objectToDelete.innerValue.value()).toBe(50);

    OmniAural.state.deleteValue.set(null);
    expect(OmniAural.state.deleteValue.value()).toBe(null);

    OmniAural.state.objectToDelete.set(null);

    expect(() => OmniAural.state.objectToDelete.innerValue.value()).toThrow(
      "Cannot read property 'innerValue' of null"
    );
    expect(OmniAural.state.objectToDelete.value()).toBe(null);
  });
});
