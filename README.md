# Omniaural

Omniaural is a minimal global state manager for React/React-Native applications.

## Installation

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
            "street": "Randolph st"
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



## Contributing


## License
[MIT](https://choosealicense.com/licenses/mit/)