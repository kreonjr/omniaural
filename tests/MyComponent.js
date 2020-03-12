import React from "react";
import { OmniAural } from "../index";

export default class MyComponent extends React.Component {
    constructor() {
        super()
        this.state = {
        }

        OmniAural.register(this, ["account.name as person.name", "account.address", "account.address.street as street", "account as info.account"])
    }

    _updateName = (name) => {
        OmniAural.state.account.name.set(name)
    }

    _addZipCode = () => {
        OmniAural.addProperty("account.address", { zip: 12345 })
    }

    render() {
        return <div onClick={this._updateName}>
            <div>{this.state.person.name}</div>
            <div>{this.state.account.address.street}</div>
            <div onClick={this._addZipCode}>{this.state.account.address.zip}</div>
            <div>{this.state.street}</div>
            <div>{this.state.info.account.name}</div>
        </div>
    }
}