import React, { Component } from 'react'
import 'aframe'
// import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position'
import { Entity, Scene } from 'aframe-react'
import config from '../config'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

class VRScene03 extends Component {
  render () {
    console.log("components", AFRAME.components)
    console.log("systems", AFRAME.systems)
    return (
      <Scene >
            <a-assets>
              <a-mixin id="avatar-head"
                      geometry="primitive: box; depth: 0.3; height: 0.3; width: 0.3"
                      material="color: #222"></a-mixin>
              <a-mixin id="avatar-body"
                       geometry="primitive: cone; height: 1.5; radiusTop: 0.1; radiusBottom: 0.4"
                       material="color: #222"></a-mixin>
            </a-assets>

            <Entity id="head" mixin="avatar-head"
                      camera look-controls wasd-controls
                      random-position="min: -10 1.7 -10; max: 10 1.9 10"
                      ></Entity>

            <Entity id="body">
              <Entity mixin="avatar-body"

                        position="0 -1 0"></Entity>
            </Entity>

            <Entity primitive="a-sphere"  material={{color:"#645FCE"}} radius="0.2" position="-3 0 2"></Entity>

          </Scene>
    )

  }

}

export default VRScene03
