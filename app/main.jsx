'use strict'
import React from 'react'
import {Router, Route, IndexRedirect, browserHistory} from 'react-router'
import {render} from 'react-dom'
import {connect, Provider} from 'react-redux'
import store from './store'

import VRScene01 from './components/VRScene01'
import VRScene02 from './components/VRScene02'
import App from './components/App'

render (
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={App}>
        <IndexRedirect to="/scene01" />
        <Route path="/scene01" component={VRScene01} />
        <Route path="/scene02" component={VRScene02} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main')
)
