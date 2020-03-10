# Omniaural

Omniaural is a minimal global state manager for React/React-Native applications.

## Getting started

TBD npm repo. For now, download from repo and reference folder directly in `package.json`

```bash
(eventually) yarn install @isobar/omniaural
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

You can register to listen to a particular property or a whole object on the global state. You can also use aliases to keep a local naming that makes more sense for your component:

```javascript
import React from 'react'
import { StyleSheet, SafeAreaView, Text } from 'react-native'
import { GlobalState } from 'omniaural'

export class IntroScreen extends React.Component<*, *> {
  constructor() {
    super()
    this.state = {
      person: {
        employed: true
      }
    }

    GlobalState.register(this, ['account as person', 'account.address as address'])
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.instructions}>
          Account information
        </Text>
        <Text style={styles.instructions}>
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


### Add Actions

```javascript
import { GlobalState, GlobalSetters } from 'omniaural'

GlobalState.addGlobalAction('updateAddress', ({ address, getGlobalState }) => {
    GlobalSetters.account.address.set(address)
})


_onClick = () => {
    GlobalState.updateAddress({street: "Main st"})
}
```


### Add Properties

```javascript
import { GlobalState } from 'omniaural'

GlobalState.addProperty("account.id", 4568585)
//or
GlobalState.addProperty("account", {id: 4568585})
```

### Use with functional components
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

## __API__

### GlobalState

The main global state manager class. It should be initialized at your top most component (usually App.js). This class will contain your global state. Components can register to specific properties or the whole global state object and update when it changes.

#### Methods:
   - [initGlobalState()](#initialglobalstate)
   - [register()](#register)
   - [addGlobalAction()](#addGlobalAction)
   - [addProperty()](#addProperty)
   - [getCurrentState()](#getCurrentState)

#### initialGlobalState() 

Initialize the global state with an initial object to which the different components will listen to its changes. This will create the GlobalState structure as well as the [GlobalSetters](#globalsetters) structure to update the state with.

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
import { GlobalState } from 'omniaural'

constructor() {
    super()
    this.state = {}

    GlobalState.register(this, ['account as person', 'account.address as address'])
}
```

#### addGlobalAction()

Actions can be added to the Global State to be used as batch updates or async calls that need to update the global state after they are completed. 


| Parameter     | Type                    | Description  |
| ------------- |:----------------------: | :----------- |
| actionName    | String                                 | The name of the action to be added to the global state object
| action        | (opts: {params, getGlobalState}) => {} | The body of this function will be added as a global action. This function can be called from anywhere. Opts is an object that contains the object parameter passed in to your action when its called and also contains a function to get the current global state.

##### Example: 
```javascript
import { GlobalState, GlobalSetters } from 'omniaural'

GlobalState.addGlobalAction('updateAddress', ({ address, getGlobalState }) => {
    const currentGlobalState = getGlobalState()

    GlobalSetters.account.address.set(address)
})


_onClick = () => {
    GlobalState.updateAddress({street: "Main st"})
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
import { GlobalState } from 'omniaural'

GlobalState.addProperty("account.id", 4568585)
//or
GlobalState.addProperty("account", {id: 4568585})
```

#### getCurrentState()

This function gets the current global state object at any given point in time. (Not recommended to access outside a global action).
You have to reference the GlobalState Instance to call this function.


##### Example: 
```javascript
import { GlobalState } from 'omniaural'

GlobalState.UnsafeGlobalInstance.getCurrentState()
```

### GlobalSetters

This is a dynamicaly created class that is called when you initialize your [GlobalState](#globalstate).
This class mimics your global state structure and it is what should be used to update you global state object. you can set properties on the global object structure directly. 

##### Example:
```javascript
//If your global state is setup to look like the following:

globalState = {
    account: {
        name: "John",
        address: {
            street: "Main st"
        }
    }
}

//You can update your global state as such:

GlobalSetters.account.address.street.set("1st st")

//or

GlobalSetters.account.address.set({street: "1st st"})
```

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


## Contributing


## License
[MIT](https://choosealicense.com/licenses/mit/)