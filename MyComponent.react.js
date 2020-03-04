import React from "react";
import { GlobalState, GlobalSetters } from "./index";

export default class MyComponent extends React.Component {
    constructor() {
        super()
        this.state = {
        }

        GlobalState.register(this, ["account.name as person.name", "account.address"])
    }

    _updateName = (name) => {
        GlobalSetters.account.name.set(name)
    }

    render() {
        return <div onClick={this._updateName}>
            <div>{this.state.person.name}</div>
            <div>{this.state.account.address.street}</div>
        </div>
    }
}