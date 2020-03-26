import React from "react"
import { withGlobal } from "../src/index"

const MyFunctional = (props) => {
    return <div>{`Dev mode: ${props.dev_mode}`}</div>
}

export default withGlobal(MyFunctional, ["dev_mode"])