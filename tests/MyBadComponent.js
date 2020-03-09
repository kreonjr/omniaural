import React from "react";
import { GlobalState } from "../index";

export default class MyBadComponent extends React.Component {
    constructor() {
        super()
        this.state = {
        }

        GlobalState.register(this, ["account.bad"])
    }

    render() {
        return <div></div>
    }
}