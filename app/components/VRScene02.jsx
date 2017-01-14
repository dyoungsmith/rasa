import React, { Component } from 'react'
import 'aframe'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position'

import Camera from './aframe/aframeReact/Camera.js'
import Text from './aframe/aframeReact/Camera.js'

import { Entity, Scene } from 'aframe-react'
import config from '../config'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

class VRScene01 extends Component {

  render () {

    return (
      <Scene firebase="apiKey: AIzaSyBL3Un4kWrA_bI6uRNsei4nQk9DkY3WD-4;
                       authDomain: reactaframe.firebaseapp.com;
                       databaseURL: https://reactaframe.firebaseio.com;
                       storageBucket: reactaframe.appspot.com" >

      </Scene>
    )

  }

}

export default VRScene01
