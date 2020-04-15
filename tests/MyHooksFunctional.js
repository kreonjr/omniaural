import React from "react"
import { useOmniAural } from "../src/OmniAural"

export default () => {
    const [name] = useOmniAural("account.name")
    const [address] = useOmniAural("account.address")

    console.log("There was a change to name. Its now: ", name)
    return <div>
        <div>{name}</div>
        <div>{`${address.street} in ${address.city}`}</div>
    </div>
}

