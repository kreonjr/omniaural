import React from "react"

/*
* @typedef {value: any, listeners: Map<{}>} GlobalProperty
*/

/**
 * @constant
 * GlobalSetters Object
 *
 * Should be used to update GlobalState properties instead of accessing GlobalState directly. This object will contain a structure similar to the initial GlobalState
 * structure but will be accessible from anywhere where a GlobalState property needs to be updated
 *
 * @example
 *
 *  global = {
 *      account: {
 *          name: "John"
 *      }
 *  }
 *
 * import {GlobalSetters} from "omniaural"
 *
 * GlobalSetters.account.name.set("John47")
 *             or
 * GlobalSetters.account.set({name: "John47"})
 *
 */
export const GlobalSetters = {}

const isObject = (val) => {
    return !Array.isArray(val) && typeof val == 'object'
}

const sanitize = (obj) => {
    let newObj = {}

    if (!isObject(obj.value)) {
        return obj.value
    } else {
        Object.keys(obj.value).forEach((key) => {
            newObj[key] = sanitize(obj.value[key])
        })
    }
    return newObj
}

const assign = (obj, keyPath, value) => {
    let lastKeyIndex = keyPath.length - 1
    for (var i = 0; i < lastKeyIndex; ++i) {
        let key = keyPath[i]
        if (!(key in obj)) {
            obj[key] = {}
        }
        obj = obj[key]
    }

    obj[keyPath[lastKeyIndex]] = value
}

const flatten = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (isObject(obj[key])) {
            Object.assign(acc, flatten(obj[key], pre + key))
        }
        else {
            acc[pre + key] = obj[key]
        }

        return acc;
    }, {});
}

/**
 * @class
 * GlobalState Class
 *
 * Used to create and maintain a global state used throught an app execution.
 * This Object is a singelton and it should be initialized at the top most component
 * of the render hierarchy.
 *
 * @example
 *
 * import {initGlobalState} from "omniaural"
 *
 * initGlobalState({
 *      account: {
 *          username: ""
 *      },
 *      appHasLaunchedBefore: false
 * })
 *
 * // Inside your Class Components import GlobalState and register by your component to listen to
 * // the global state object. Properties will be available on local state:
 *
 * state = {
 *      user: {}
 * }
 * 
 * Global.register(this, ["account.username as user.name", "account.address.street.name as user.street"])
 *
 */
export class GlobalState {
    /**
     * Each component passed in is given a specific id that auto-increments,
     * used to keep a reference to the component listeners and remove them as necessary
     */
    static globalStateCounter = 1

    /**
     * Named "unsafe" to inform developers that they should not access properties directly
     * if they want to get the latest value of the property after a global state update
     */
    static UnsafeGlobalInstance = null

    static initializeInstance(initialState = {}) {
        if (!GlobalState.UnsafeGlobalInstance) {
            GlobalState.UnsafeGlobalInstance = new GlobalState(initialState)
        }

        return GlobalState.UnsafeGlobalInstance
    }

    constructor(initialState) {
        this.value = {}
        Object.keys(initialState).forEach((key) => {
            this._addSetter(GlobalSetters, key, initialState[key], key)
            this._addKeyValue(this.value, key, initialState[key])
        })
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
     * GlobalState.addProperty("account.id", 1234123412341234)
     *
     */
    static addProperty = (path, property) => {
        const newObj = {}
        const pathArr = path.split(".")
        assign(newObj, pathArr, property)
        const flatObject = flatten(newObj)

        Object.keys(newObj).forEach((key) => {
            GlobalState.UnsafeGlobalInstance._addSetter(GlobalSetters, key, newObj[key], key)
            GlobalState.UnsafeGlobalInstance._addKeyValue(GlobalState.UnsafeGlobalInstance.value, key, newObj[key])
        })

        let setter = GlobalSetters
        if (!isObject(property)) {
            pathArr.forEach((step) => {
                setter = setter[step]
            })

            setter.set(property)
        } else {
            Object.keys(flatObject).forEach((innerPath) => {
                innerPath.split(".").forEach((step) => {
                    setter = setter[step]
                })

                setter.set(flatObject[innerPath])
            })
        }
    }

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
    _registerProperty = (aliasPath, component, propertyObject) => {
        propertyObject.listeners.set(component.globalStateId + aliasPath, { aliasPath, component })

        if (isObject(propertyObject.value)) {
            Object.keys(propertyObject.value).forEach((key) => {
                const newPath = aliasPath ? aliasPath + "." + key : null
                GlobalState.UnsafeGlobalInstance._registerProperty(
                    newPath,
                    component,
                    propertyObject.value[key]
                )
            })
        }
    }

    /**
     * register
     *
     * Register a component as a global state listener
     *
     * It registers a component to listent to specific global properties.
     * It also deregisters components from listening to global state changes when they unmount.
     *
     * @param {React.Component}       component       The component to listen to specific global properties.
     * @param {string[] | null}       properties      An array of strings with the names of the global properties you
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
     * GlobalState.register(this, ["account.username as person", "account.address.street", "appHasLaunched"])
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
    static register = (component, properties) => {
        component.globalStateId = GlobalState.globalStateCounter++
        let state = component.state || {}

        if (!properties || !properties.length) {
            GlobalState.UnsafeGlobalInstance._registerProperty(
                null,
                component,
                GlobalState.UnsafeGlobalInstance
            )
            state = { ...state, ...sanitize(GlobalState.UnsafeGlobalInstance) }
        } else {
            properties.forEach((prop) => {
                let propertyObject = GlobalState.UnsafeGlobalInstance
                let aliasPath = null

                let aliasArr = prop.split(" as ")
                if (aliasArr.length > 1) {
                    prop = aliasArr[0]
                    aliasPath = aliasArr[1]
                }

                let path = prop.split('.')
                if (path.length > 0) {
                    path.forEach((step) => {
                        if (!propertyObject.value.hasOwnProperty(step)) {
                            // error
                            throw `Invalid object path: ${prop}. Make sure the path to the property matches your global state structure.`
                        } else {
                            propertyObject = propertyObject.value[step]
                        }
                    })

                    const propPath = aliasPath ? aliasPath.split(".") : path
                    assign(state, propPath, sanitize(propertyObject))
                }

                GlobalState.UnsafeGlobalInstance._registerProperty(
                    aliasPath,
                    component,
                    propertyObject
                )
            })
        }

        if (component.__proto__.componentWillUnmount) {
            const unMount = component.componentWillUnmount
            component.componentWillUnmount = function () {
                GlobalState.UnsafeGlobalInstance._deregister(
                    GlobalState.UnsafeGlobalInstance,
                    component
                )
                unMount()
            }
        } else {
            component.componentWillUnmount = function () {
                GlobalState.UnsafeGlobalInstance._deregister(
                    GlobalState.UnsafeGlobalInstance,
                    component
                )
            }
        }

        component.state = state
    }

    /**
     * addAction
     *
     * It adds specific actions to the global object class to be able to
     * encapsulate global state manipulation.
     *
     * @param {string}      actionName   The name of the action to add to the global state object.
     * @param {function}  actionFunc     A function that will be set on the GlobalState object. Has a `props`
     *                                   parameter which contains the parameters passed in when the callback 
     *                                   is invoked and some more properties like the `getGlobalState` function
     *                                   to get the a snapshot of the global state object
     * 
     * @example
     *
     * GlobalState.addAction("updateAccount", (props) => {
     *   const {account, getGlobalState, globalSetters} = props
     * 
     *   const globalState = getGlobalState()
     * 
     *   globalSetters.account.phone.set(account.phone)
     *   globalSetters.account.name.set(account.name)
     *    //or
     *   globalSetters.account.set(account)
     *    
     * })
     *
     * //Call action
     *
     * GlobalState.updateAccount({account: {phone: "111-22-3222", name: "Jason"}})
     *
     */
    static addGlobalAction = (actionName, actionFunc) => {
        const action = () => {
            return (props = {}) => {
                props.getGlobalState = GlobalState.UnsafeGlobalInstance.getCurrentState
                props.globalSetters = GlobalSetters
                actionFunc(props)
            }
        }

        GlobalState[actionName] = action()
    }

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
                    let obj = GlobalState.UnsafeGlobalInstance
                    path.split('.').forEach((pathStep) => {
                        obj = obj.value[pathStep]
                    })
                    obj.set(path, newValue)
                }
            }
        } else {
            if (!base[key]) {
                base[key] = {
                    set: (params) => {
                        if (!isObject(params)) {
                            throw `You are trying to set an object. Please pass an object arguement`
                        }
                        let obj = GlobalState.UnsafeGlobalInstance
                        path.split('.').forEach((pathStep) => {
                            obj = obj.value[pathStep]
                        })

                        obj.set(path, params)
                    }
                }
            }

            Object.keys(value).forEach((innerKey) => {
                this._addSetter(
                    base[key],
                    innerKey,
                    value[innerKey],
                    path + '.' + innerKey
                )
            })
        }
    }

    /**
     * @private _addKeyValue
     *
     * @param {object} base           The object that will be created and added to the global object.
     * @param {string} key            The key for the property to be added to the {base} object.
     * @param {any}    initialVal     The initial value the property should have.
     *
     * It creates an object for each global property set on initialization. It saves
     * the property key/value pair on the global object instance and also creates a setter
     * for each global property. Should not be called outside this file.
     */
    _addKeyValue = (base, key, initialVal = null, initialListeners = new Map()) => {
        if (!isObject(initialVal)) {
            if (!base[key] || !base[key].value) {
                const newListeners = new Map()
                if (initialListeners.size) {
                    initialListeners.forEach((listener, mapKey) => {
                        const newListener = {
                            component: listener.component,
                            aliasPath: null
                        }

                        if (listener.aliasPath) {
                            newListener.aliasPath = listener.aliasPath + "." + key
                        }
                        newListeners.set(mapKey + "." + key, newListener)
                    })
                }
                base[key] = {
                    value: initialVal,
                    listeners: newListeners,
                    set: function (path, newVal) {
                        this.value = newVal
                        this.listeners.forEach((listener) => {
                            listener.component.setState((prevState) => {
                                const newPath = listener.aliasPath ? listener.aliasPath.split(".") : path.split(".")
                                assign(prevState, newPath, newVal)
                                return prevState
                            })
                        })
                    }
                }
            } else {
                throw `${key} already exists at this global state path`
            }
        } else {
            let baseValue = initialVal
            if (base[key] && base[key].value) {
                base[key].listeners = new Map([...base[key].listeners], [...initialListeners])
                baseValue = base[key].value
            } else {
                base[key] = {
                    value: initialVal,
                    listeners: new Map([...initialListeners]),
                    set: function (path, params) {
                        Object.keys(params).forEach(function (key) {
                            let obj = GlobalState.UnsafeGlobalInstance
                            const pathArr = path.split('.')
                            pathArr.forEach((step) => {
                                obj = obj.value[step]
                            })

                            if (!obj.value.hasOwnProperty(key)) {
                                throw `Property '${key}' not present in object '${path}'`
                            }

                            obj.value[key].set(path + '.' + key, params[key])
                        })
                    }
                }
            }

            Object.keys(initialVal).forEach((innerKey) => {
                this._addKeyValue(baseValue, innerKey, initialVal[innerKey], base[key].listeners)
            })
        }

    }

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
            base.listeners.forEach((_, listenerId) => {
                if (listenerId === component.globalStateId) {
                    base.listeners.delete(listenerId)
                }
            })
        } else {
            Object.keys(base.value).forEach((key) => {
                GlobalState.UnsafeGlobalInstance._deregister(base.value[key], component)
            })
        }
    }

    /**
     * getCurrentState
     *
     * It returns a copy of the global state object at a given time.
     *
     * @returns {object} The current global state object.
     *
     */
    getCurrentState = () => {
        return sanitize(this)
    }
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
 * @return {object} The singleton instance of the Global State object.
 *
 * @example
 *
 * GlobalState.initGlobalState({
 *    account: {
 *      name: "John",
 *      phone: "332-56-3322"
 *    },
 *    appHasLaunchedBefore: "false"
 * })
 *
 */
export const initGlobalState = GlobalState.initializeInstance
/**
 * withGlobal
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
 * export default withGlobal(MyAddress, ["account.address.street as streetName"])
 * 
 *
 */
export const withGlobal = (RegisteredComponent, paths = []) => {

    return class GlobalComponent extends React.Component {
        constructor(props) {
            super(props)
            this.state = {}
            this.name = RegisteredComponent.name
            GlobalState.register(this, paths)
        }

        render() {
            return <RegisteredComponent {...this.state} />
        }
    }
}