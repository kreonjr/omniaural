import React from "react";
import { OmniAural } from "../src/index";

export default class MyComponent extends React.Component {
    constructor() {
        super()
        this.state = {
            description: "Small Description"
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

    _updateNameLocallyAlt = () => {
        this.setState((prevState) => {
            return { ...prevState, person: { ...prevState.person, name: "Jane" } }
        })
    }

    _updateDescription = () => {
        this.setState({ description: "Long Description" })
    }

    _updateDescriptionAlt = () => {
        this.setState((prev) => {
            return { ...prev, description: "Long Description" }
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
            <div onClick={this._updateNameLocallyAlt}>{this.state.person.name}</div>
            <div onClick={this._updateDescription}>{this.state.description}</div>
            <div onClick={this._updateDescriptionAlt}>{this.state.description}</div>
        </div>
    }
}