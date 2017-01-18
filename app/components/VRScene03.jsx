import React, { Component } from 'react'
import 'aframe-firebase-component'
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
      <Scene firebase={aframeConfig}>
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
                      firebase-broadcast="componentsOnce: mixin;
                                          components: position, rotation"></Entity>

            <Entity id="body" firebase-broadcast="components: position" follow="[camera]">
              <Entity mixin="avatar-body"
                      firebase-broadcast="componentsOnce: mixin; components: position"
                        position="0 -1 0"></Entity>
            </Entity>

            <Entity primitive="a-sphere"  material={{color:"#645FCE"}} radius="0.2" position="-3 0 2"></Entity>

            <Entity primitive="a-sphere" color="#645FCE" radius="0.2" position="-3 0 2"></Entity>
            <Entity primitive="a-sphere" position="3 1 -7"></Entity>
            <Entity primitive="a-sphere" radius="0.4" position="1 1 -2"></Entity>
            <Entity primitive="a-sphere" position="-2 0 3"></Entity>
            <Entity primitive="a-sphere" radius="0.8" position="2 4 -4"></Entity>
            <Entity primitive="a-sphere" position="2 4 -1"></Entity>

            <Entity primitive="light" type="ambient" color="#444"></Entity>
            <Entity primitive="light" type="point" intensity="1.2"></Entity>
            <Entity primitive="a-sphere" color="#FFF" radius="0.2" shader="flat" position="0 0.2 0"></Entity>

          <Entity primitive="a-plane" rotation="-90 0 0" color="#0C2233" height="25" width="25"
                   position="0 -0.1 0"></Entity>
          <Entity primitive="a-sky" color="#222"></Entity>

          </Scene>
    )

  }

}

export default VRScene03
