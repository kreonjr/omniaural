import React from "react"
import OmniAural, { useOmniAural, useOmniAuralEffect } from "../src/OmniAural"

export default () => {
    const [name, setName] = useOmniAural("account.name")
    const [address] = useOmniAural("account.address")
    const [tempAddress] = useOmniAural("account.address.tempAddress")
    const [currentEmployment] = useOmniAural("account.currentEmployment")
    const [nulledOut] = useOmniAural("nulledOut")
    const [thousandItems] = useOmniAural("thousandItems")
    const [foobar] = useOmniAural("thousandItems.episodes.UtlJT6vWjE.p")

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
        <div>{`${address?.street} in ${address?.city}`}</div>
        <div>{`Works in ${employmentCity}`}</div>
        <div>{`${customValue}`}</div>
        <div>{`${foobar}`}</div>
        <div>{`${thousandItems?.episodes?.UtlJT6vWjE?.c}`}</div>
        <button onClick={() => {OmniAural.state.thousandItems?.episodes?.UtlJT6vWjE?.c?.set(false)}}/>
        <button id="nested_set" onClick={function(){
            OmniAural.state.account.address.tempAddress.set({street: "State", number: 13})
        }}/>
        <div>{`${tempAddress}`}</div>
        <button id="hook_setter" onClick={function(){
            setName("Jake")
        }}/>
    </div>
}

