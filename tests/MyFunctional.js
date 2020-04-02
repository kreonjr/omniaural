import React from "react"
import { withOmniAural } from "../src/OmniAural"

const MyFunctional = (props) => {
    return <div>
        <div>{`Dev mode: ${props.dev_mode}`}</div>
        <div>{props.account.name}</div>
    </div>
}

export default withOmniAural(MyFunctional, ["dev_mode", "account.name"])