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
    return typeof val == 'object' && !Array.isArray(val)
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
            GlobalState.UnsafeGlobalInstance = GlobalState.UnsafeGlobalInstance
        }

        return GlobalState.UnsafeGlobalInstance
    }

    registerProperty = (aliasPath, component, propertyObject) => {
        let state = {}
        if (!isObject(propertyObject.value)) {
            propertyObject.listeners.add({ aliasPath, component })
        } else {
            Object.keys(propertyObject.value).forEach((key) => {
                GlobalState.UnsafeGlobalInstance.registerProperty(
                    aliasPath,
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
     * @param {object} component       The component to listen to specific global properties.
     * @param {array}  properties      An array of strings with the names of the global properties you
     *                                 want the component to listen to. Can be a top level object
     *                                 (i.e. account) or a nested object (i.e acount.address.street).
     *                                 Registered properties can be given aliases to be used on the component state
     *                                 (i.e acount.address.street as user.street).
     *                                 Passing nothing or an empty array will register the whole global object
     *
     *
     * @return {object} An object containing all the properties that will be passed in to local state.
     *
     * @example
     *
     * this.state = {
     *     person: {
     *        email: "john@mail.com"
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
     *      name: "John",
     *      email: "john@mail.com"
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
    static register = (component: object, properties?: [string]) => {
        component.globalStateId = GlobalState.globalStateCounter++
        let state = component.state || {}

        if (!properties || !properties.length) {
            GlobalState.UnsafeGlobalInstance.registerProperty(
                null,
                component,
                GlobalState.UnsafeGlobalInstance
            )
            state = { ...state, global: sanitize(GlobalState.UnsafeGlobalInstance) }
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
                    path.forEach((step, index) => {
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

                GlobalState.UnsafeGlobalInstance.registerProperty(
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
     * @param {function}  actionFunc   A function that will be set on the GlobalState object. Has a `props`
     *                                   parameter which contains the parameters passed in when the callback 
     *                                   is invoked and some more properties like the `getGlobalState` function
     *                                   to get the a snapshot of the global state object
     * 
     * @example
     *
     * GlobalState.addAction("updateAccount", (props) => {
     *   const {phone, name, getGlobalState} = props
     * 
     *   const globalState = getGlobalState()
     * 
     * 
     *   GlobalSetters.account.phone.set(phone)
     *   GlobalSetters.account.name.set(name)
     *    //or
     *   GlobalSetters.account.set({phone, name})
     *    
     * })
     *
     * //Call action
     *
     * GlobalState.updateAccount({phone: "111-22-3222", name: "Jason"})
     *
     */
    static addGlobalAction = (actionName: string, actionFunc: mixed) => {
        const action = () => {
            return (params) => {
                params.getGlobalState = GlobalState.UnsafeGlobalInstance.getCurrentState
                console.log("IT WORKED!")
                actionFunc(params)
            }
        }

        GlobalState[actionName] = action()
    }

    constructor(initialState) {
        this.value = {}
        Object.keys(initialState).forEach((key) => {
            this._addSetter(GlobalSetters, key, initialState[key], key)
            this._addKeyValue(this.value, key, initialState[key])
        })
    }

    /**
     * @private addSetter
     *
     * @param {object} base           The object that will be created and added to the global setter object.
     * @param {string} key            The key for the property to be added to the {base} object.
     * @param {any}    initialVal     The initial value the property should have.
     *
     * This function creates a setter function for each property in the global object to be called outside this file.
     * It then creates a key for each global state property and adds it to the GlobalSetters object
     */
    _addSetter = (base: any, key: string, value: any, path) => {
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
     * @private addKeyValue
     *
     * @param {object} base           The object that will be created and added to the global object.
     * @param {string} key            The key for the property to be added to the {base} object.
     * @param {any}    initialVal     The initial value the property should have.
     *
     * It creates an object for each global property set on initialization. It saves
     * the property key/value pair on the global object instance and also creates a setter
     * for each global property. Should not be called outside this file.
     */
    _addKeyValue = (base: any, key: string, initialVal: any = null) => {
        if (!base[key] || !base[key].value) {
            if (!isObject(initialVal)) {
                base[key] = {
                    value: initialVal,
                    listeners: new Set(),
                    set: function (path, newVal) {
                        this.value = newVal
                        this.listeners.forEach((listener) => {
                            listener.component.setState((prevState) => {
                                const statePath = listener.aliasPath || path
                                assign(prevState, statePath.split('.'), newVal)
                                return prevState
                            })
                        })
                    }
                }
            } else {
                base[key] = {
                    value: initialVal,
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

                Object.keys(initialVal).forEach((innerKey) => {
                    this._addKeyValue(initialVal, innerKey, initialVal[innerKey])
                })
            }
        } else {
            console.error(`${key} already exists in global state`)
        }
    }

    /**
     * @private deregister
     *
     * It deregisters a passed in component removing it from the listeners of all properties.
     *
     * @param {string} component The name of the action to add t the global state object.
     *
     */
    _deregister = (base: any, component: string) => {
        if (base.hasOwnProperty('listeners')) {
            base.listeners.forEach((listener) => {
                if (listener.component.globalStateId === component.globalStateId) {
                    base.listeners.delete(listener)
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