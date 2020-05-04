import React from "react"
import OmniAural, { useOmniAural, useOmniAuralEffect } from "../src/OmniAural"

export default () => {
    const [name] = useOmniAural("account.name")
    const [address] = useOmniAural("account.address")

    useOmniAuralEffect(() => {
        console.log(OmniAural.state.account.id.value())
    }, "account.id")

    return <div>
        <div>{name}</div>
        <div>{`${address.street} in ${address.city}`}</div>
    </div>
}

