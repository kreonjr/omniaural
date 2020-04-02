import React from "react";
import OmniAural from "../src/OmniAural";

export default class MyOtherComponent extends React.Component {
    constructor() {
        super()
        OmniAural.register(this, "account.phone_number")
    }

    render() {
        return <div>
            <div>{this.state.account.phone_number}</div>
        </div>
    }
}