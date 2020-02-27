import React from "react";
import { GlobalState, GlobalSetters } from "./index";

export default class MyComponent extends React.Component {
    constructor() {
        super()
        this.state = {
            ...GlobalState.register(this, ["account.name"])
        }
    }

    _updateName = (name) => {
        GlobalSetters.account.name.set(name)
    }

    render() {
        return <div onClick={this._updateName}>{this.state.account.name}</div>
    }
}