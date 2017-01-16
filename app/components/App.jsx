import React, { Component } from 'react'
// import firebase from 'firebase'
// import config from '../config'
import { connect } from 'react-redux'
import Login from './Login'
import WhoAmI from './WhoAmI'


class App extends Component {
  constructor() {
    super()


  }
  componentDidMount() {
    // firebase.initializeApp(config);
  }

  render() {
    const { user, children } = this.props

    return(
      <div style={{width: "100%", height: "100%"}}>
        {children}
      </div>
    )
  }

}



export default connect( ({ auth }) => ({ user: auth }) )(App)
