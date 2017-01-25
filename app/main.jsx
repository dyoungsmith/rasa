
'use strict'
import React from 'react'
import {Router, Route, IndexRedirect, browserHistory} from 'react-router'
import {render} from 'react-dom'
import {connect, Provider} from 'react-redux'
import store from './store'

import VRScene06 from './components/VRScene06'

import App from './components/App'

render (
  <Provider store={ store }>
    <Router history={ browserHistory }>
      <Route path="/" component={ App }>
        <IndexRedirect to="/scene06" />
        <Route path="/scene06" component={ VRScene06 } />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main')
)
