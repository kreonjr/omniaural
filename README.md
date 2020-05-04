# OmniAural

OmniAural is a minimal global state manager for React/React-Native applications.

## Core Concepts

OmniAural provides global state managment with no need for boiler plate code.

This is done by allowing React components to 'register' for the global state elements they need to be aware of.  Those global elements then become part of the component's local state and can be treated like, read-only, local state from the component's point of view.

Changing global state is handled through a call to OmniAural that can be called from any js code (not just components).  However, the recommened pattern is to put global state changes in OmniAural actions which are a convenient way to orginize these global state changes.  Actions are optional and may not be best suited for all types of projects, but are recommended for most.


## Getting started

### Instalation

Install package from npm

```bash
yarn add omniaural
```

## Usage

### Initialize

In your top level component (usually App.js) import OmniAural and initialize the global state
```javascript
import OmniAural from 'omniaural';

OmniAural.initGlobalState({
   account: {
        name: 'Jack',
        phone: '3129058787',
        address: {
            "street": "1st st"
        }
    },
    movies: []
})
```

After initialization, global state properties can be (but rarely need to be) accessed directly through the `.value()` function. See below (Register a component) on the recommened approach to accessing global state values.
```javascript
OmniAural.state.account.name.value()
```

Global state properties can be set directly through the `.set()` function.
```javascript
OmniAural.state.account.name.set("John")
```


### Register a component

You can register to listen to a particular property or a whole object on the global state. 
You can also use aliases to allow for local naming that makes more sense for your component.  IMPORTANT - if you create a state object in your component, this must be done before you call OmniAural.register.

```javascript
import React from 'react'
import OmniAural from 'omniaural'

export class IntroScreen extends React.Component<*, *> {
  constructor() {
    super()
    this.state = {
      person: {
        employed: true
      }
    }

    // Register for the global 'account' (defaults to 'account' in local state)
    // Register for the account.address as 'address' in local state
    OmniAural.register(this, ['account', 'account.address as address'])
  }

  render() {
    return (
      <div style={styles.container}>
        <span style={styles.instructions}>
          Account information
        </span>
        <div style={styles.instructions}>
          {'\n'}
          {`Name: ${this.state.account.name}` /* I'm accessing global state here, it just looks local to the component */}
          {'\n'}
          {`Currently employed: ${this.state.person.employed}` /* this is actually local state */}
          {'\n'}
          {`Street: ${this.state.address.street}` /* this is global state again */}
        </div>
      </div>
    )
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  }
}

```

### Update global state

Using the OmniAural.state object, you can make changes to the global state values.

```javascript
import React from 'react'
import OmniAural from 'omniaural'

export class IntroScreen extends React.Component<*, *> {
  constructor() {
    super()
    this.state = {
      person: {
        employed: true
      }
    }

    OmniAural.register(this, ['account', 'account.address as address'])
  }

  _updateAddress = () => {
      // Updating the street to a hard coded "Main st"
      // Note this is the full global state path
      OmniAural.state.account.address.street.set("Main st")
  }

  render() {
    return (
      <div style={styles.container}>
        <span style={styles.instructions}>
          Account information
        </span>
        <div style={styles.instructions} onClick={this._updateAddress}>
          {'\n'}
          {`Name: ${this.state.account.name}`}
          {'\n'}
          {`Currently employed: ${this.state.person.employed}`}
          {'\n'}
          {`Street: ${this.state.address.street}`}
        </div>
      </div>
    )
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  }
}

```

### Adding an action

Actions are the prefered way to encapsulate your global state changes.  They can be added from any file in the global space, although it makes sense to group these actions in designated files.

```javascript
import React from 'react'
import OmniAural from 'omniaural'

// Add a globally accessable action to update the global address object
OmniAural.addAction('updateAddress', (address) => {
    OmniAural.state.account.address.set(address)
})

export class IntroScreen extends React.Component<*, *> {
  constructor() {
    super()
    this.state = {
      person: {
        employed: true
      }
    }

    OmniAural.register(this, ['account.name', 'account.address as address'])
  }

  _updateAddress = () => {
      // call the global action using the name passed into OmniAural.addAction
      OmniAural.updateAddress({street: "Main st"})
  }

  render() {
    return (
      <div style={styles.container}>
        <span style={styles.instructions}>
          Account information
        </span>
        <div style={styles.instructions} onClick={this._updateAddress}>
          {'\n'}
          {`Name: ${this.state.account.name}`}
          {'\n'}
          {`Currently employed: ${this.state.person.employed}`}
          {'\n'}
          {`Street: ${this.state.address.street}`}
        </div>
      </div>
    )
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  }
}

```

### Functional components

You can register a functional component by creating an OmniAural state hook [useOmniAural](#useOmniAural)

```javascript
import React from 'react'
import { useOmniAural } from 'omniaural'

const PersonScreen = () => {
  const [person] = useOmniAural("account")
  
  return (
    <div>
      <span>User Id: {person.id}</span>
    </div>
  )
}

export default PersonScreen
```

You can register a functional component to listen to OmniAural state property updates using [useOmniAuralEffect](#useOmniAuralEffect)

```javascript
import React from 'react'
import { useOmniAuralEffect } from 'omniaural'

const PersonScreen = () => {
  const [person] = useOmniAural("account")

  useOmniAuralEffect(()=> {
    console.log("The account id has changed")
  }, "account.id")
  
  return (
    <div>
      <span>User Id: {person.id}</span>
    </div>
  )
}

export default PersonScreen
```

You can also register a functional component by wrapping it in the [withOmniAural](#withOmniAural) HOC function

```javascript
import React from 'react'
import { withOmniAural } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <div>
      <span>User Id: {props.person.id}</span>
    </div>
  )
}

export default withOmniAural(PersonScreen, ["account as person"])
```

---

## __API__

### OmniAural

The main global state manager class. It should be initialized at your top most component (usually App.js). This class will contain your global state. Components can register to specific properties or the whole global state object and update when it changes.

#### Methods:
   - [initGlobalState()](#initGlobalState)
   - [register()](#register)
   - [addAction()](#addAction)
   - [addActions()](#addActions)
   - [addProperty()](#addProperty)
   - [updateProperty()](#updateProperty)
   - [useOmniAural()](#useOmniAural)
   - [useOmniAuralEffect()](#useOmniAuralEffect)

#### initGlobalState() 

Initialize the global state with an initial object to which components will register and listen to its changes. You can access and update properties directly from the creates state object

| Parameter     | Type          | Description  |
| ------------- |:------------: | :----------- |
| initialState  | Object        | The object with which to initialize your global object.

##### Example: 
```javascript
import { initGlobalState } from 'omniaural';

initGlobalState({
   account: {
        name: 'Jack',
        phone: '3129058787',
        address: {
            "street": "1st st"
        }
    },
    movies: []
})

console.log(OmniAural.state.account.phone.value()) //Prints 3129058787
OmniAural.state.account.phone.set('2125548844')
console.log(OmniAural.state.account.phone.value()) //Prints 2125548844
```

Can also be used directly on OmniAural:

```javascript
import OmniAural from 'omniaural';

OmniAural.initGlobalState({
   account: {
        name: 'Jack',
        phone: '3129058787',
        address: {
            "street": "1st st"
        }
    },
    movies: []
})
```


#### register()

Register a component to listen to changes on the global state. This method will add the component as a listener to the passed in properties that you want to listen to and call `setState` on that component whenever a change happens. 
An alias can be used for each property using the keyword `as` and will be added to the local state using that alias.

__Note:__ This function must be called after you have initialized your initial local state (if any).


| Parameter     | Type                      | Description  |
| ------------- |:---------------:          | :----------- |
| component     | React.Component           | The component to be registered as a listener to the global state properties.
| paths         | string | Array<string>    | The global state path(s) to subscribe to. It cab either be a string or an array of strings. If an empty array is passed in, the whole global state will be observed (not recommended).
| listener      | Function | null           | (Optional) A function that will fire when one of values of the passed in paths changes.

##### Example: 
```javascript
import OmniAural from 'omniaural'

constructor() {
    super()
    this.state = {}

    OmniAural.register(this, ['account as person', 'account.address as address'])
}
```

#### addAction()

Actions can be added to OmniAural to be used as batch updates or async calls that need to update the global state after they are completed. 
You can add an action as a predeclared named function or by passing an anonymous function and a name for it.


| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| action        | Function                | The body of this function will be added as a global action. Must be a named function

##### Example: 
```javascript
import OmniAural from 'omniaural'

const updateAddress = (address) => {
    OmniAural.state.account.address.set(address)
}

OmniAural.addAction(updateAddress)

_onClick = () => {
    OmniAural.updateAddress({street: "Main st"})
}
```

__* If you don't want to use a named function, you can also pass a string as the first argument that will represent the name of the function on OmniAural and an anonymous funtion as a second argument__

| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| name          | String                  | The name of the function that will be save on OmniAural
| action        | Function                | The body of this function will be added as a global action.

##### Example: 
```javascript
import OmniAural from 'omniaural'

OmniAural.addAction('updateAddress', (address) => {
    OmniAural.state.account.address.set(address)
})

_onClick = () => {
    OmniAural.updateAddress({street: "Main st"})
}
```

#### addActions()

Actions can be added to OmniAural in bulk by passing named functions as arguments to this function


| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| action        | ...Function             | One or more named functions to be added to OmniAural. __Note:__ All actions must be named functions

##### Example: 
```javascript
import OmniAural from 'omniaural'

const updateAddress = (address) => {
    OmniAural.state.account.address.set(address)
}

const updateAccount = (account) => {
    OmniAural.state.account.set(account)
}

OmniAural.addActions(updateAccount, updateAddress)

_onClick = () => {
    OmniAural.updateAddress({street: "Main st"})
}

_onAnotherClick = () => {
    OmniAural.updateAccount({address: street: "Main st"}})
}
```

#### addProperty()

This function adds new properties to the global state object structure. If you add properties to nested objects, any listener to the parent object will also start listenting to the newly added property.

| Parameter     | Type          | Description  |
| ------------- |:------------: | :----------- |
| path          | String        | The path in the global state to which to add a property.
| value         | any           | The value to initialize the newly added property as.


##### Example: 
```javascript
import OmniAural from 'omniaural'

OmniAural.addProperty("account.id", 4568585)
//or
OmniAural.addProperty("account", {id: 4568585})
```

#### updateProperty()

This function updates a property at a given path. It receives a string representing the path to the property and a value to update the property
with.

| Parameter     | Type          | Description  |
| ------------- |:------------: | :----------- |
| path          | String        | The path in the global state to the property to update.
| value         | any           | The value to set the passed in property with.


##### Example: 
```javascript
import OmniAural from 'omniaural'

OmniAural.updateProperty("account.id", 4568585)
//or
OmniAural.updateProperty("account", {id: 4568585})
```

---

### HOOK 

#### useOmniAural

The `useOmniAural` hook is a custom hook that creates a local variable tied to a global state property value. It can be used in stateless
functional components to register to variables that live on global state. `useOmniAural` does *not* provide a setter because any updates to 
the global state should always be done through the property setter or custom omniaural actions.

| Parameter     | Type          | Description  |
| ------------- |:------------: | :----------- |
| path          | String        | A string path that represent the path to the global properties to register to.

##### Example: 
```javascript
import React from 'react'
import { useOmniAural } from 'omniaural'

const PersonScreen = () => {
  const [accountId] = useOmniAural("account.id")

  return (
    <div>
      <span>User Id: {accountId}</span>
    </div>
  )
}

export default PersonScreen
```

#### useOmniAuralEffect

The `useOmniAuralEffect` hook takes a function and a path (or an array of paths) to properties on the OmniAural state and fires the
passed in function when those properties values change.

| Parameter     | Type           | Description  |
| ------------- |:------------:  | :----------- |
| listener      | Function       | A function that will be called when any of the passed in property paths values change
| path(s)       | String | Array | A string (or array of strings) that represent the path to the global property to register the listener to.

##### Example: 
```javascript
import React from 'react'
import { useOmniAuralEffect } from 'omniaural'

const PersonScreen = () => {
  const [accountId] = useOmniAural("account.id")

  useOmniAuralEffect(() => {
    console.log("Account Id has changed")
  }, ["account.id"])

  return (
    <div>
      <span>User Id: {accountId}</span>
    </div>
  )
}

export default PersonScreen
```

### HOC

#### withOmniAural

This function can be used to register a functional component with a collection of properties from the global state using a higher order component.
The registered properties will be passed in as props to the functional component.

| Parameter     | Type          | Description  |
| ------------- |:------------: | :----------- |
| component     | Function      | The functional component to start listening to the global state.
| paths         | Array<string> | An array of strings that represent the paths to the global properties to listen to. Each path can receive an alias similar to the [register](#register) function to be passed into the props.


##### Example: 
```javascript
import React from 'react'
import { withOmniAural } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <div>
      <span>User Id: {props.person.id}</span>
    </div>
  )
}

export default withOmniAural(PersonScreen, ["account as person"])
```


## License
MIT License

Copyright (c) 2020  Isobar North America, Inc. (Chris Steele and Creon Creonopoulos)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
