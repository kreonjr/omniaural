import React from "react";
import OmniAural from "../src/OmniAural";

export default class MyBadComponent extends React.Component {
    constructor() {
        super()
        this.state = {
        }

        OmniAural.register(this, ["account.bad"])
    }

    render() {
        return <div></div>
    }
}