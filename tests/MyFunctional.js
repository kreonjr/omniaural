import React from "react"
import { withOmniAural } from "../src/OmniAural"

const MyFunctional = (props) => {
    return <div>{`Dev mode: ${props.dev_mode}`}</div>
}

export default withOmniAural(MyFunctional, ["dev_mode"])