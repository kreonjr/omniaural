# Omniaural

Omniaural is a minimal global state manager for React/React-Native applications.

## Getting started

TBD npm repo.

For now, install it from github directly.

```bash
yarn add ccreonopoulos/omniaural
```

## Usage

### Initialize

In your top level component (usually App.js) import and initialize the global state
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
```

After initialization, global state properties can be accessed directly through the `.value()` function
```javascript
OmniAural.state.account.name.value()
```

Global state properties can be set directly through the `.set()` function
```javascript
OmniAural.state.account.name.set("John")
```


### Register a component

You can register to listen to a particular property or a whole object on the global state. 
You can also use aliases to keep a local naming that makes more sense for your component:

```javascript
import React from 'react'
import { StyleSheet, SafeAreaView, Text } from 'react-native'
import OmniAural from 'omniaural'

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

    OmniAural.register(this, ['account as person', 'account.address as address'])
  }

  _updateAddress = () => {
      OmniAural.updateAddress({street: "Main st"})
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.instructions}>
          Account information
        </Text>
        <Text style={styles.instructions} onPress={this._updateAddress}>
          {'\n'}
          {`Name: ${this.state.person.name}`}
          {'\n'}
          {`Currently employed: ${this.state.person.employed}`}
          {'\n'}
          {`Street: ${this.state.address.street}`}
        </Text>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  }
})

```

### Functional components

You can register a functional component by wrapping it in the [withOmniAural](#withOmniAural) HOC function

```javascript
import React from 'react'
import { View, Text } from 'react-native'
import { withOmniAural } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <View>
      <Text>User Id: {props.person.id}</Text>
    </View>
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

This function add new properties to the global state object structure. If you add properties to nested objects, any listener to the parent object will also start listenting to the newly added property.

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

---

### Functions

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
import { View, Text } from 'react-native'
import { withOmniAural } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <View>
      <Text>User Id: {props.person.id}</Text>
    </View>
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
