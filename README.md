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

In your top level file (Usually App.js) import and initialize the global state
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

### Register a component

You can register to listen to a particular property or a whole object on the global state. 
You can also use aliases to keep a local naming that makes more sense for your component:

```javascript
import React from 'react'
import { StyleSheet, SafeAreaView, Text } from 'react-native'
import { OmniAural } from 'omniaural'

export class IntroScreen extends React.Component<*, *> {
  constructor() {
    super()
    this.state = {
      person: {
        employed: true
      }
    }

    OmniAural.register(this, ['account as person', 'account.address as address'])
    OmniAural.addGlobalAction('updateAddress', (address) => {
        OmniAural.state.account.address.set(address)
    })
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

You can register a functional component by wrapping it in the [withGlobal](#withGlobal) HOC function

```javascript
import React from 'react'
import { View, Text } from 'react-native'
import { withGlobal } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <View>
      <Text>User Id: {props.person.id}</Text>
    </View>
  )
}

export default withGlobal(PersonScreen, ["account as person"])
```

---

## __API__

### OmniAural

The main global state manager class. It should be initialized at your top most component (usually App.js). This class will contain your global state. Components can register to specific properties or the whole global state object and update when it changes.

#### Methods:
   - [initGlobalState()](#initGlobalState)
   - [register()](#register)
   - [addGlobalAction()](#addGlobalAction)
   - [addGlobalActions()](#addGlobalActions)
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


#### register()

Register a component to listen to changes on the global state. This method will add the component as a listener to the passed in properties that you want to listen to and call `setState` on that component whenever a change happens. 
An alias can be used for each property using the keyword `as` and will be added to the local state using that alias.

__Note:__ This function must should be called after you have initialized your initial local state.


| Parameter     | Type             | Description  |
| ------------- |:---------------: | :----------- |
| component     | React.Component  | The component to be registered as a listener to the global state properties.
| paths         | Array<string>    | The global state paths to subscribe to. If an empty array is passed in, the whole global state will be observed (not recommended).

##### Example: 
```javascript
import { OmniAural } from 'omniaural'

constructor() {
    super()
    this.state = {}

    OmniAural.register(this, ['account as person', 'account.address as address'])
}
```

#### addGlobalAction()

Actions can be added to OmniAural to be used as batch updates or async calls that need to update the global state after they are completed. 
You can add an action as a predeclared named function or by passing an anonymous function with a name.


| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| action        | Function                | The body of this function will be added as a global action. Must be a named function


##### Example: 
```javascript
import { OmniAural } from 'omniaural'

const updateAddress = (address) => {
    OmniAural.state.account.address.set(address)
}

OmniAural.addGlobalAction(updateAddress)

_onClick = () => {
    OmniAural.updateAddress({street: "Main st"})
}
```


__* If you don't want to use a named function, you can also pass a string as the first argument that will represent the name of the function on OmniAural and an anonymous funtion as a second argument__

##### Example: 
```javascript
import { OmniAural } from 'omniaural'

OmniAural.addGlobalAction('updateAddress', (opts) => {
    OmniAural.state.account.address.set(address)
})

_onClick = () => {
    OmniAural.updateAddress({street: "Main st"})
}
```

#### addGlobalActions()

Actions can be added to OmniAural in bulk by passing named functions as arguments to this function


| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| action        | ...Function             | One or more named functions to be added to OmniAural. __Note:__ All actions must be named functions

##### Example: 
```javascript
import { OmniAural } from 'omniaural'

const updateAddress = (address) => {
    OmniAural.state.account.address.set(address)
}

const updateAccount = (account) => {
    OmniAural.state.account.set(account)
}

OmniAural.addGlobalActions(updateAccount, updateAddress)

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
import { OmniAural } from 'omniaural'

OmniAural.addProperty("account.id", 4568585)
//or
OmniAural.addProperty("account", {id: 4568585})
```

---

### Functions

#### withGlobal

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
import { withGlobal } from 'omniaural'

const PersonScreen = (props) => {
  return (
    <View>
      <Text>User Id: {props.person.id}</Text>
    </View>
  )
}

export default withGlobal(PersonScreen, ["account as person"])
```


## License
[MIT](https://choosealicense.com/licenses/mit/)