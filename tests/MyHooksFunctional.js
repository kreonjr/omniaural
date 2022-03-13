import React from "react"
import OmniAural, { useOmniAural, useOmniAuralEffect } from "../src/OmniAural"
const bigdata = require("./bigdata.json")

export default () => {
    const [name] = useOmniAural("account.name")
    const [address] = useOmniAural("account.address")
    const [currentEmployment] = useOmniAural("account.currentEmployment")
    const [nulledOut] = useOmniAural("nulledOut")
    const [thousandItems] = useOmniAural("thousandItems")

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

    console.log("Rendering")
    const dataPopulated = (thousandItems?.episodes?.UtlJT6vWjE?.c) ? 'true' : 'false'
    return <div>
        <div>{name}</div>
        <div>{`${address.street} in ${address.city}`}</div>
        <div>{`Works in ${employmentCity}`}</div>
        <div>{`${customValue}`}</div>
        <button id="thousands" onClick={function(){
            OmniAural.state.thousandItems.set(bigdata)
        }}/>
        <div>{"Large object contains data: " + dataPopulated}</div>
    </div>
}

