import React, { Component } from 'react'
import 'aframe'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position'
import config from '../config'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

class VRScene01 extends Component {
    render () {
    console.log("components", AFRAME.components)
    console.log("systems", AFRAME.systems)
    return (
      <a-scene firebase={aframeConfig}>
       <a-entity id="ground"
          geometry="primitive: box; width: 12; height: 0.01; depth: 12"
          material="shader: flat; src: #floor">
        </a-entity>
        <a-entity id="left-hand"
          brush
          if-no-vr-headset="visible: false"
          paint-controls="hand: left"
          teleport="ground: #ground; hitCylinderColor: #ff3468; curveHitColor: #ff3468; curveMissColor: #333333; curveLineWidth: 0.01; hitEntity: #hitEntityLeft"
          ui
        ></a-entity>

      </a-scene>
    )

  }

}

export default VRScene01
