import React from "react";
import { OmniAural } from "../src/index";

export default class MyComponent extends React.Component {
    constructor() {
        super()
        this.state = {
        }

        OmniAural.register(this, ["account.name as name", "account.name as person.name", "account.address", "account.address.street as street", "account as info.account"])
    }

    _updateName = (name) => {
        OmniAural.state.account.name.set(name)
    }

    _addZipCode = () => {
        OmniAural.addProperty("account.address", { zip: 12345 })
    }

    _updateNameLocally = () => {
        this.setState({
            name: "Jane"
        })
    }

    _updateAliasNameLocally = () => {
        this.setState({
            person: {
                name: "Jane"
            }
        })
    }

    render() {
        return <div onClick={this._updateName}>
            <div>{this.state.person.name}</div>
            <div>{this.state.account.address.street}</div>
            <div onClick={this._addZipCode}>{this.state.account.address.zip}</div>
            <div>{this.state.street}</div>
            <div>{this.state.info.account.name}</div>
            <div onClick={this._updateNameLocally}>{this.state.name}</div>
            <div onClick={this._updateAliasNameLocally}>{this.state.person.name}</div>
        </div>
    }
}