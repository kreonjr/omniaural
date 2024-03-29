import OmniAural, { initGlobalState, PATH_DELIM } from "../src/OmniAural";
import mockInitialState from "./mockInitialState";
const fetch = require("node-fetch").default;

describe("Global State Manager", () => {
  beforeAll(() => {
    initGlobalState(mockInitialState, {pathDelimiter: "."});
  });

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

    expect(OmniAural.getProperty("dev_mode").value()).toBeFalsy();
    expect(OmniAural.getProperty(`account${PATH_DELIM}name`).value()).toBe("Mike");
    expect(OmniAural.getProperty(`account${PATH_DELIM}address${PATH_DELIM}city`).value()).toBe("Chicago");
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
      OmniAural.addProperty(`account${PATH_DELIM}billing`, {
        cc: 1234123412341234,
      });

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

      OmniAural.addProperty(
        `account${PATH_DELIM}grandParent${PATH_DELIM}name`,
        "Sue"
      );
      expect(
        OmniAural.UnsafeGlobalInstance.value["account"].value["grandParent"]
          .value["name"].value
      ).toBe("Sue");

      expect(OmniAural.state.account.grandParent.name.value()).toBe("Sue");
    });

    test("should error if an existing property is attempted to be added", () => {
      expect(() =>
        OmniAural.addProperty(`account${PATH_DELIM}name`, "Victor")
      ).toThrow("name already exists at this global state path");
    });

  });

  describe("Deleting a property", () => {
    test("Deletes an omniaural property", () => {
      const jobInfo = {
        title: "Software Engineer",
        years: 10,
      };

      expect(() => OmniAural.state.jobInfo.value()).toThrow();
      OmniAural.addProperty(`account${PATH_DELIM}jobInfo`, jobInfo);
      expect(JSON.stringify(OmniAural.state.account.jobInfo.value())).toBe(
        JSON.stringify(jobInfo)
      );
      OmniAural.state.account.jobInfo.delete();
      expect(() => OmniAural.state.account.jobInfo.value()).toThrow();
      expect(
        () =>
          OmniAural.UnsafeGlobalInstance.value["account"].value["jobInfo"].value
      ).toThrow();
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
      OmniAural.addProperty(`account${PATH_DELIM}jobInfo`, jobInfo);
    });

    afterEach(() => {
      OmniAural.state.account.jobInfo.delete();
    });

    test("Clears out an omniaural object property", () => {
      OmniAural.clearProperty(`account${PATH_DELIM}jobInfo`);

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
      expect(() =>
        OmniAural.clearProperty(`account${PATH_DELIM}jobInfo${PATH_DELIM}years`)
      ).toThrow(
        "Only object properties can be cleared out. Please make sure your path is correct and that the property is an object."
      );
      expect(() =>
        OmniAural.clearProperty(
          `account${PATH_DELIM}jobInfo${PATH_DELIM}jiberish`
        )
      ).toThrow(
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

  test("should update the empty string property of an object correctly", () => {
    const notEmptyPropertyObject = {
      emptyProperty: "Not Empty Anymore"
    }
    expect(OmniAural.state.emptyPropertyObject.emptyProperty.value()).toBe("");

    OmniAural.state.emptyPropertyObject.set(notEmptyPropertyObject)
    expect(OmniAural.state.emptyPropertyObject.emptyProperty.value()).toBe(notEmptyPropertyObject.emptyProperty);
    expect(JSON.stringify(OmniAural.state.emptyPropertyObject.value())).toBe(JSON.stringify(notEmptyPropertyObject));
  })

  test("should merge the state of an existing object property by default", () => {
    const expectedInvoice = {
      ...OmniAural.state.invoice.value(),
      country: "US"
    };

    OmniAural.state.invoice.set({country:"US"});
    expect(JSON.stringify(OmniAural.state.invoice.value())).toBe(
      JSON.stringify(expectedInvoice)
    );
  });

  test("should overwrite an existing object property if the option is passed in", () => {
    const expectedInvoice = {
      status: "Invalid Invoice"
    };

    OmniAural.state.invoice.set(expectedInvoice, {overwrite: true});
    expect(JSON.stringify(OmniAural.state.invoice.value())).toBe(
      JSON.stringify(expectedInvoice)
    );
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
    expect(() => OmniAural.state.anotherInvoice.set({})).toThrow();
    expect(() => OmniAural.state.invoice.someOtherPieceOfInfo.set({})).toThrow();
  });

  test('should update the global state object using the "setProperty" function correctly', () => {
    OmniAural.setProperty(
      `account${PATH_DELIM}nextOfKin${PATH_DELIM}name`,
      "Jake"
    );
    expect(OmniAural.state.account.nextOfKin.name.value()).toBe("Jake");

    OmniAural.setProperty(`account${PATH_DELIM}nextOfKin${PATH_DELIM}job`, "");
    expect(OmniAural.state.account.nextOfKin.job.value()).toBe("");

    OmniAural.setProperty(`account${PATH_DELIM}nextOfKin${PATH_DELIM}job`, null);
    expect(OmniAural.state.account.nextOfKin.job.value()).toBe(null);
  });

  test('should merge the global state object properties using the "setProperty" function', () => {
    OmniAural.setProperty(`account${PATH_DELIM}nextOfKin${PATH_DELIM}job`, "mailman");
    OmniAural.setProperty(`account${PATH_DELIM}nextOfKin`, { name: "Luke" });
    expect(OmniAural.state.account.nextOfKin.name.value()).toBe("Luke");
    expect(OmniAural.state.account.nextOfKin.job.value()).toBe("mailman");
  });

  test('should throw an error if the "setProperty" function is missing parameters', () => {
    expect(() => OmniAural.setProperty(`account${PATH_DELIM}nextOfKin${PATH_DELIM}name`)).toThrow(
      `Missing or undefined second argument. Please provide an update value for path 'account${PATH_DELIM}nextOfKin${PATH_DELIM}name'`
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

    expect(() => OmniAural.state.objectToDelete.innerValue.value()).toThrow();
    expect(OmniAural.state.objectToDelete.value()).toBe(null);
  });

  describe('should handle really large objects', () => {
    beforeAll(() => {
      const thousandItems = require("./bigdata.json")
      OmniAural.addProperty("thousandItems", thousandItems)
    })

    test("thousand items added to state correctly", () => {
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.c.value()).toBe(true)
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.d.value()).toBe(8497)
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.p.value()).toBe("foo")
    })

    test("thousand items item to update correctly", () => {
      OmniAural.state.thousandItems.episodes.UtlJT6vWjE.p.set("bar")
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.c.value()).toBe(true)
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.d.value()).toBe(8497)
      expect(OmniAural.state.thousandItems.episodes.UtlJT6vWjE.p.value()).toBe("bar")
    })
  })
});
