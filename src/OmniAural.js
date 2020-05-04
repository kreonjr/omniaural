import React from 'react';

const isObject = (val) => {
    return !Array.isArray(val) && typeof val == 'object';
};

//Get the value of an object given a deep path
export const getDeepValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => {
        return acc ? acc[key] : undefined;
    }, obj);
};

/**
 * Takes an OmniAural property (special object) and returns a
 * regular key/value pair object version.
 */
const sanitize = (obj) => {
    let newObj = {};

    if (isObject(obj.value)) {
        Object.keys(obj.value).forEach((key) => {
            newObj[key] = sanitize(obj.value[key]);
        });
    } else {
        //exit case for recursion
        return obj.value;
    }

    return newObj;
};

/**
 * Assigns or creates a key/value pair property to the passed in object
 * Does not return because it works by reference
 */
const assign = (obj, keyPath, value) => {
    const lastKeyIndex = keyPath.length - 1;
    for (let i = 0; i < lastKeyIndex; ++i) {
        const key = keyPath[i];
        if (!(key in obj)) {
            obj[key] = {};
        }
        obj = obj[key];
    }

    obj[keyPath[lastKeyIndex]] = value;
};

/**
 * Flattens an nested object to a single layer object
 * with the key representing each path
 *
 * i.e.
 * const obj = {
 *   a: {
 *      b: {
 *          c: "foo"
 *      }
 *   },
 *   d: "bar"
 * }
 *
 * const flat = flatten(obj)
 *
 * flat will be:
 * { "a.b.c": "foo", d: "bar"}
 *
 */
const flatten = (obj, prefix = '') => {
    return Object.keys(obj).reduce((prev, key) => {
        const path = prefix.length ? prefix + '.' : '';
        if (isObject(obj[key])) {
            Object.assign(prev, flatten(obj[key], path + key));
        } else {
            prev[path + key] = obj[key];
        }

        return prev;
    }, {});
};

/**
 * @class
 * OmniAural Class
 *
 * Used to create and maintain a global state used throught an app execution.
 * This Object is a singelton and it should be initialized at the top most component
 * of the render hierarchy.
 *
 * @example
 *
 * import {OmniAural} from "omniaural"
 *
 * OmniAural.initGlobalState({
 *      account: {
 *          username: ""
 *      },
 *      appHasLaunchedBefore: false
 * })
 *
 * // Inside your Class Components import OmniAural and register by your component to listen to
 * // the global state object. Properties will be available on local state:
 *
 * state = {
 *      user: {}
 * }
 *
 * OmniAural.register(this, ["account.username as user.name", "account.address.street.name as user.street"])
 *
 */
export default class OmniAural {
    static state = {
        value: () => {
            return sanitize(OmniAural.UnsafeGlobalInstance);
        },
        context: {},
    };
    /**
     * Each component passed in is given a specific id that auto-increments,
     * used to keep a reference to the component listeners and remove them as necessary
     */
    static listenerCounter = 1;

    /**
     * Named "unsafe" to inform developers that they should not access properties directly
     * if they want to get the latest value of the property after a global state update
     */
    static UnsafeGlobalInstance = null;

    static initGlobalState(initialState = {}) {
        if (!OmniAural.UnsafeGlobalInstance) {
            OmniAural.UnsafeGlobalInstance = new OmniAural(initialState);
        }
    }

    constructor(initialState) {
        this.value = {};
        Object.keys(initialState).forEach((key) => {
            this._addSetter(OmniAural.state, key, initialState[key], key);
            this._addKeyValue(this.value, key, initialState[key]);
        });
    }

    /**
     * addProperty
     *
     * Adds a property to the global state
     *
     * This function can be used to add a property on the global state object after initialization.
     * It will through an error if the path to the property already exists. It will also update all the
     * top level listeners state to include this property
     *
     * @param {string}       path       The path to which to add the new property
     * @param {any}          property   The property value to add to the new path
     *
     *
     * @example
     *
     * OmniAural.addProperty("account.id", 1234123412341234)
     *
     */
    static addProperty = (path, property) => {
        const newObj = {};
        const pathArr = path.split('.');
        assign(newObj, pathArr, property);
        const flatObject = flatten(newObj);

        Object.keys(newObj).forEach((key) => {
            OmniAural.UnsafeGlobalInstance._addSetter(
                OmniAural.state,
                key,
                newObj[key],
                key
            );
            OmniAural.UnsafeGlobalInstance._addKeyValue(
                OmniAural.UnsafeGlobalInstance.value,
                key,
                newObj[key]
            );
        });

        if (!isObject(property)) {
            let setter = OmniAural.state;
            pathArr.forEach((step) => {
                setter = setter[step];
            });

            setter.set(property);
        } else {
            Object.keys(flatObject).forEach((innerPath) => {
                let setter = OmniAural.state;
                innerPath.split('.').forEach((step) => {
                    setter = setter[step];
                });

                setter.set(flatObject[innerPath]);
            });
        }
    };

    static updateProperty = (path, newValue) => {
        if (typeof path !== 'string') {
            throw new Error(
                `Path needs to be a string representation of the global state path to the property you want to update.`
            );
        }

        if (!newValue) {
            throw new Error(
                `Missing or undefined second argument. Please provide an update value for path '${path}'`
            );
        }

        const pathArr = path.split('.');
        let property = OmniAural.state;
        pathArr.forEach((step) => {
            if (!property.hasOwnProperty(step)) {
                throw new Error(
                    `Path '${path}' does not exist on the global state object`
                );
            }
            property = property[step];
        });

        if (isObject(newValue)) {
            const flatObj = flatten(newValue);
            for (const key in flatObj) {
                let newPath = path + '.' + key;
                OmniAural.updateProperty(newPath, flatObj[key]);
            }
        } else {
            property.set(newValue);
        }
    };

    /**
     * @private _registerProperty
     *
     * @param {string | null}       aliasPath        A path to save the property to when it is added to the components state
     * @param {React.Component}     component        The component to add as a listener to the property
     * @param {GlobalProperty}      propertyObject   The property that contains the value and the listeners
     *
     * This function adds a component to a particular property as a listener in order to update
     * it when the value changes
     *
     */
    _registerProperty = (
        aliasPath,
        component,
        propertyObject,
        propertyKeyPath,
        eventCallback
    ) => {
        const mapKey = aliasPath
            ? component.omniId + '.' + aliasPath
            : component.omniId;
        propertyObject.listeners.set(mapKey, { aliasPath, component });
        if (eventCallback) {
            this._addObserver(
                propertyObject,
                propertyKeyPath,
                eventCallback,
                component.omniId
            );
        }

        if (isObject(propertyObject.value)) {
            Object.keys(propertyObject.value).forEach((key) => {
                const newPath = aliasPath ? aliasPath + '.' + key : null;
                this._registerProperty(
                    newPath,
                    component,
                    propertyObject.value[key],
                    propertyKeyPath + '.' + key,
                    eventCallback
                );
            });
        }
    };

    /**
     * register
     *
     * Register a component as a global state listener
     *
     * It registers a component to listent to specific global properties.
     * It also deregisters components from listening to global state changes when they unmount.
     *
     * @param {React.Component}          component    The component to listen to specific global properties.
     * @param {string | string[] | null} properties   A string or an array of strings with the names of the global properties you
     *                                                want the component to listen to. Can be a top level object
     *                                                (i.e. account) or a nested object (i.e acount.address.street).
     *                                                Registered properties can be given aliases to be used on the component state
     *                                                (i.e acount.address.street as user.street).
     *                                                Passing nothing or an empty array will register the whole global object
     *
     *
     * @example
     *
     * this.state = {
     *     person: {
     *        age: 30
     *    }
     * }
     *
     * OmniAural.register(this, ["account.username as person", "account.address.street", "appHasLaunched"])
     *
     * //Local State will contain:
     *
     * {
     *
     *    person: {
     *      name: "John Appleseed",
     *      age: 30
     *    },
     *    account: {
     *      address: {
     *        street: "Main St"
     *      }
     *    }
     *    appHasLaunched: true
     * }
     *
     */
    static register = (component, properties, listener) => {
        if (!component.omniId) {
            component.omniId = OmniAural.listenerCounter++;
            component.omniAuralMap = {};

            if (component.__proto__.componentWillUnmount) {
                const willUnMount = component.componentWillUnmount;
                component.componentWillUnmount = function () {
                    OmniAural.UnsafeGlobalInstance._deregister(
                        OmniAural.UnsafeGlobalInstance,
                        component
                    );
                    willUnMount();
                };
            } else {
                component.componentWillUnmount = function () {
                    OmniAural.UnsafeGlobalInstance._deregister(
                        OmniAural.UnsafeGlobalInstance,
                        component
                    );
                };
            }

            const defaultSetState = component.setState.bind(component);

            component.setState = (stateUpdates, callback, fromOmni = false) => {
                if (!fromOmni) {
                    if (typeof stateUpdates === 'function') {
                        stateUpdates = stateUpdates(component.state);
                    }

                    const flattenUpdates = flatten(stateUpdates);
                    Object.keys(component.omniAuralMap).forEach((key) => {
                        const stateVal = flattenUpdates[key];
                        const omniVal = getDeepValue(
                            OmniAural.state,
                            component.omniAuralMap[key]
                        );

                        if (stateVal && stateVal !== omniVal.value()) {
                            throw new Error(
                                `You are attempting to localy update a global variable registered at path "state.${key}". Please use the global property setter.`
                            );
                        }
                    });
                }

                defaultSetState(stateUpdates, callback);
            };
        }

        let state = component.state || {};

        if (!properties) {
            OmniAural.UnsafeGlobalInstance._registerProperty(
                null,
                component,
                OmniAural.UnsafeGlobalInstance,
                listener
            );
            state = { ...state, ...sanitize(OmniAural.UnsafeGlobalInstance) };
        } else {
            if (typeof properties === 'string') {
                properties = [properties];
            }

            properties.forEach((prop) => {
                let propertyObject = OmniAural.UnsafeGlobalInstance;
                let aliasPath = null;

                let aliasArr = prop.split(' as ');
                if (aliasArr.length > 1) {
                    prop = aliasArr[0];
                    aliasPath = aliasArr[1];
                }

                component.omniAuralMap[aliasPath || prop] = prop;

                let path = prop.split('.');
                if (path.length > 0) {
                    path.forEach((step) => {
                        if (!propertyObject.value.hasOwnProperty(step)) {
                            // error
                            throw new Error(
                                `Invalid object path: ${prop}. Make sure the path to the property matches your global state structure.`
                            );
                        } else {
                            propertyObject = propertyObject.value[step];
                        }
                    });

                    const propPath = aliasPath ? aliasPath.split('.') : path;
                    assign(state, propPath, sanitize(propertyObject));
                }

                OmniAural.UnsafeGlobalInstance._registerProperty(
                    aliasPath,
                    component,
                    propertyObject,
                    prop,
                    listener
                );
            });
        }

        component.state = state;
    };

    /**
     * addAction
     *
     * It adds specific actions to the global object class to be able to
     * encapsulate global state manipulation.
     *
     * @param {string}    actionName   The name of the anonymous function to be added to the OmniAural class.
     * @param {function}  actionFunc   An anonymous function that will be added on the OmniAural class.
     * or
     * @param {function}  actionFunc   A named fucntion to be added on the OmniAural class
     *
     * @example
     *
     * OmniAural.addAction("updateAccount", (account) => {
     *
     *   OmniAural.state.account.phone.set(account.phone)
     *   OmniAural.account.name.set(account.name)
     *    //or
     *   OmniAural.state.account.set(account)
     *
     * })
     *
     * //Call action
     *
     * OmniAural.updateAccount({phone: "111-22-3222", name: "Jason"})
     *
     */
    static addAction = (...args) => {
        let name = '';
        let func = '';

        if (args.length === 1) {
            func = args[0];
            name = args[0].name;
        } else if (args.length === 2) {
            name = args[0];
            func = args[1];
            if (typeof func !== 'function' || !name) {
                throw new Error(`Single argument must be a named function`);
            }
        } else {
            throw new Error(`addAction must have exactly 1 or 2 arguments`);
        }

        if (typeof func !== 'function' || !name) {
            throw new Error(`Actions must be named functions`);
        }

        OmniAural[name] = func;
    };

    /**
     * addActions
     *
     * This function accepts any number of named functions to be added to the OmniAural class
     *
     * @param {...function}  actionFuncs   Any number of named fucntions to be added on the OmniAural class
     *
     *
     */
    static addActions = (...args) => {
        args.forEach((func) => {
            if (typeof func === 'function' && func.name) {
                OmniAural.addAction(func);
            } else {
                throw new Error(`All actions must be named functions`);
            }
        });
    };

    /**
     * @private addSetter
     *
     * @param {object} base           The object that will be created and added to the global setter object.
     * @param {string} key            The key for the property to be added to the {base} object.
     * @param {any}    initialVal     The initial value the property should have.
     * @param {string} path           The path to the property in which to add the setter
     *
     * This function creates a setter function for each property in the global object to be called outside this file.
     * It then creates a key for each global state property and adds it to the GlobalSetters object
     */
    _addSetter = (base, key, value, path) => {
        if (!isObject(value)) {
            base[key] = {
                set: (newValue) => {
                    let obj = OmniAural.UnsafeGlobalInstance;
                    path.split('.').forEach((pathStep) => {
                        obj = obj.value[pathStep];
                    });

                    obj.set(path, newValue);
                    if (obj.observers.has(path)) {
                        obj.observers.get(path).forEach((callback) => {
                            callback();
                        });
                    }
                },
                value: () => {
                    let obj = OmniAural.UnsafeGlobalInstance;
                    path.split('.').forEach((pathStep) => {
                        obj = obj.value[pathStep];
                    });
                    return obj.value;
                },
            };
        } else {
            if (!base[key]) {
                base[key] = {
                    set: (params) => {
                        if (!isObject(params)) {
                            throw new Error(
                                `You are trying to set an object. Please pass an object arguement`
                            );
                        }
                        let obj = OmniAural.UnsafeGlobalInstance;
                        path.split('.').forEach((pathStep) => {
                            obj = obj.value[pathStep];
                        });

                        obj.set(path, params);

                        if (obj.observers.has(path)) {
                            obj.observers[path].forEach((callback) => {
                                callback();
                            });
                        }
                    },
                    value: () => {
                        let obj = OmniAural.UnsafeGlobalInstance;
                        path.split('.').forEach((pathStep) => {
                            obj = obj.value[pathStep];
                        });
                        return sanitize(obj);
                    },
                };
            }

            Object.keys(value).forEach((innerKey) => {
                this._addSetter(
                    base[key],
                    innerKey,
                    value[innerKey],
                    path + '.' + innerKey
                );
            });
        }
    };

    /**
     * @private _addKeyValue
     *
     * @param {object} base              The object that will be created and added to the global object.
     * @param {string} key               The key for the property to be added to the {base} object.
     * @param {any}    initialVal        The initial value the property should have.
     * @param {object} initialListeners  A collection of listeners that might already exist for an existing property
     *
     * It creates an object for each global property set on initialization. It saves
     * the property key/value pair on the global object instance and also creates a setter
     * for each global property. Should not be called outside this file.
     */
    _addKeyValue = (
        base,
        key,
        initialVal = null,
        initialListeners = new Map()
    ) => {
        if (!isObject(initialVal)) {
            if (!base[key] || !base[key].value) {
                const newListeners = new Map();
                if (initialListeners.size) {
                    initialListeners.forEach((listener, mapKey) => {
                        const newListener = {
                            component: listener.component,
                            aliasPath: null,
                        };

                        if (listener.aliasPath) {
                            newListener.aliasPath = listener.aliasPath + '.' + key;
                        }
                        newListeners.set(mapKey + '.' + key, newListener);
                    });
                }
                base[key] = {
                    value: initialVal,
                    listeners: newListeners,
                    set: function (path, newVal) {
                        this.value = newVal;
                        this.listeners.forEach((listener) => {
                            listener.component.setState(
                                (prevState) => {
                                    const newPath = listener.aliasPath
                                        ? listener.aliasPath.split('.')
                                        : path.split('.');
                                    assign(prevState, newPath, newVal);
                                    return prevState;
                                },
                                null,
                                true
                            );
                        });

                        if (this.context[path]) {
                            for (const contextKey in this.context[path]) {
                                this.context[path][contextKey](newVal);
                            }
                        }
                    },
                    context: {},
                    observers: new Map(),
                };
            } else {
                throw new Error(`${key} already exists at this global state path`);
            }
        } else {
            let baseValue = initialVal;
            if (base[key] && base[key].value) {
                base[key].listeners = new Map(
                    [...base[key].listeners],
                    [...initialListeners]
                );
                baseValue = base[key].value;
            } else {
                base[key] = {
                    value: initialVal,
                    listeners: new Map([...initialListeners]),
                    set: function (path, params) {
                        Object.keys(params).forEach(function (key) {
                            let obj = OmniAural.UnsafeGlobalInstance;
                            const pathArr = path.split('.');
                            pathArr.forEach((step) => {
                                obj = obj.value[step];
                            });

                            if (!obj.value.hasOwnProperty(key)) {
                                throw new Error(
                                    `Property '${key}' not present in object '${path}'`
                                );
                            }

                            obj.value[key].set(path + '.' + key, params[key]);
                        });

                        if (this.context[path]) {
                            for (const contextKey in this.context[path]) {
                                this.context[path][contextKey](
                                    Object.assign(sanitize(this), params)
                                );
                            }
                        }
                    },
                    context: {},
                    observers: new Map(),
                };
            }

            Object.keys(initialVal).forEach((innerKey) => {
                this._addKeyValue(
                    baseValue,
                    innerKey,
                    initialVal[innerKey],
                    base[key].listeners
                );
            });
        }
    };

    _addObserver = (
        prop,
        path,
        observer,
        newId = OmniAural.listenerCounter++
    ) => {
        if (!prop.observers.has(path)) {
            prop.observers.set(path, new Map());
        }
        prop.observers.get(path).set(newId, observer);

        if (isObject(prop.value)) {
            let removers = [];
            Object.keys(prop.value).forEach((key) => {
                removers.push(
                    this._addObserver(prop.value[key], `${path}.${key}`, observer, newId)
                );
            });
            return () => {
                removers.forEach((remover) => {
                    remover();
                });
                prop.observers.get(path).delete(newId);
            };
        } else {
            return () => {
                prop.observers.get(path).delete(newId);
            };
        }
    };

    /**
     * @private _deregister
     *
     * It deregisters a passed in component removing it from the listeners of all properties.
     *
     * @param {GlobalProperty}    base      The base property to start deregistering from all its properties
     * @param {React.Component}   component The component to deregister as a listener from a property
     *
     */
    _deregister = (base, component) => {
        if (!isObject(base.value)) {
            base.listeners.forEach((listener, listenerId) => {
                if (listener.component.omniId === component.omniId) {
                    base.listeners.delete(listenerId);
                }
            });
            base.observers.forEach((observer) => {
                if (observer.has(component.omniId)) {
                    observer.delete(component.omniId);
                }
            });
        } else {
            Object.keys(base.value).forEach((key) => {
                OmniAural.UnsafeGlobalInstance._deregister(base.value[key], component);
            });
        }
    };
}

/**
 * initGlobalState
 *
 * Initializes the global state
 *
 * This function creates a Global singleton and should be the first function
 * to be called at the top most component (Usually App.js) before anything else is rendered.
 *
 * @param {object} initialState Contains the properties to initialize the global state with.
 *
 *
 * @example
 *
 * initGlobalState({
 *    account: {
 *      name: "John",
 *      phone: "332-56-3322"
 *    },
 *    appHasLaunchedBefore: "false"
 * })
 *
 */
export const initGlobalState = OmniAural.initGlobalState;

/**
 * useOmniAural
 *
 * Creates a hook to a property at the given path
 *
 * This function creates a variable hook to a property at the given path. Variable value will change as the value to
 * amniaural state path is changed
 *
 * @param {string} path  The path to the omniaural state property to create the hook varible to
 *
 * @return {Array} An array where the first element is the variable hook to the requested property
 *
 */

export const useOmniAural = (path) => {
    let pathKeys = path.split('.');
    let omniObject = OmniAural.UnsafeGlobalInstance;
    pathKeys.forEach((key) => {
        if (omniObject.value.hasOwnProperty(key)) {
            omniObject = omniObject.value[key];
        } else {
            throw new Error(`OmniAural state path ${path} is invalid.`);
        }
    });

    const initialVal = isObject(omniObject.value)
        ? sanitize(omniObject)
        : omniObject.value;
    const [property, setProperty] = React.useState(initialVal);

    React.useEffect(() => {
        const omniAuralId = OmniAural.listenerCounter++;
        if (!omniObject.context[path]) {
            omniObject.context[path] = {};
        }
        omniObject.context[path][omniAuralId] = setProperty;

        return () => {
            delete omniObject.context[path][omniAuralId];
        };
    }, [path, omniObject.context]);

    return [property];
};

/**
 * useOmniAuralEffect
 *
 * Created a listener hook for the provided property paths
 *
 * This function add the passed in observer function as a callback everytime any of its passed in
 * property paths get updated
 *
 * @param {Function}       callback  The function to be called every time any of the values to the passed in property paths changes
 * @param {Array | String} listeners The array of paths to the properties to listen to changes on
 *
 */
export const useOmniAuralEffect = (callback, listeners = []) => {
    const memoizedCallBack = React.useCallback(callback, []);
    const refListeners = React.useRef(listeners);

    React.useEffect(() => {
        let listerPaths = [];
        if (typeof refListeners.current === 'string') {
            listerPaths = [refListeners.current];
        } else {
            listerPaths = [...refListeners.current];
        }

        let removers = [];
        listerPaths.forEach((path) => {
            let property = OmniAural.UnsafeGlobalInstance;
            path.split('.').forEach((pathStep) => {
                property = property.value[pathStep];
            });

            removers.push(
                OmniAural.UnsafeGlobalInstance._addObserver(
                    property,
                    path,
                    memoizedCallBack
                )
            );
        });

        return () => {
            removers.forEach((rem) => rem());
        };
    }, [memoizedCallBack, refListeners]);
};

/**
 * withOmniAural
 *
 * Adds the a global state object as a prop to a component
 *
 * This high order function receives a component and passed the global state object (or a part of it)
 * as props. Returns a new component that listens to global state updates
 *
 * @param {React.FunctionComponent} RegisteredComponent  The component to turn into a higher order component
 * @param {array}                   paths                The array of paths that the user want to observe from
 *                                                       the global state. Works similarly as registering a component
 *                                                       as a listener.
 *
 * @return {React.Component}  The Higher order component with the registered state passed in to its props. Will contain the name
 *                            the passed in component on its object under this.name
 *
 * @example
 *
 * const MyAddress = (props) => {
 *    return <div>
 *      <div>{props.streetName}</div>
 *    </div>
 * }
 *
 * export default withOmniAural(MyAddress, ["account.address.street as streetName"])
 *
 *
 */
export const withOmniAural = (RegisteredComponent, paths = []) => {
    return class GlobalComponent extends React.Component {
        constructor(props) {
            super(props);
            this.state = {};
            this.name = RegisteredComponent.name;
            OmniAural.register(this, paths);
        }

        render() {
            return <RegisteredComponent {...this.state} />;
        }
    };
};
