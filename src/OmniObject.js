export default class OmniObject {
    static map = {}

    constructor() {
        const id = this.getClassName()
        if (OmniObject.map[id]) {
            return OmniObject.map[id]
        }

        this.state = {}
        OmniObject.map[id] = this
    }

    setState = (newState) => {
        const currentStateStr = JSON.stringify(this.state)
        const currentStateCopy = JSON.parse(currentStateStr)
        const updatedState = newState(JSON.parse(currentStateStr))

        const stateUpdateObject = this.difference(currentStateCopy, updatedState) || {}

        Object.assign(this.state, updatedState)
        if (this["stateChanged"]) {
            this["stateChanged"](stateUpdateObject)
        } else {
            console.warn("Missing stateChanged listener")
        }
    }

    getClassName = () => {
        return this.constructor.name
    }

    difference = (object1, object2) => {
        let key, kDiff,
            diff = {};

        for (key in object1) {
            if (!object1.hasOwnProperty(key)) {
            } else if (typeof object1[key] != 'object' || typeof object2[key] != 'object') {
                if (!(key in object2) || object1[key] !== object2[key]) {
                    diff[key] = object2[key];
                }
            } else if (kDiff = this.difference(object1[key], object2[key])) {
                diff[key] = kDiff;
            }
        }
        for (key in object2) {
            if (object2.hasOwnProperty(key) && !(key in object1)) {
                diff[key] = object2[key];
            }
        }
        for (key in diff) {
            if (diff.hasOwnProperty(key)) {
                return diff;
            }
        }

        return false;
    }
}