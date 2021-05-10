import React from "react"
import OmniAural, { useOmniAural, useOmniAuralEffect } from "../src/OmniAural"

export default () => {
    const [name] = useOmniAural("account.name")
    const [address] = useOmniAural("account.address")
    const [currentEmployment] = useOmniAural("account.currentEmployment")
    const [nulledOut] = useOmniAural("nulledOut")

    let employmentCity
    let customValue

    useOmniAuralEffect(() => {
        console.log(OmniAural.state.account.id.value())
    }, "account.id")

    if(currentEmployment.address) {
        employmentCity = currentEmployment.address.city
    }

    if(nulledOut) {
        customValue = nulledOut.key
    }

    return <div>
        <div>{name}</div>
        <div>{`${address.street} in ${address.city}`}</div>
        <div>{`Works in ${employmentCity}`}</div>
        <div>{`${customValue}`}</div>
    </div>
}

