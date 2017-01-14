import React, { Component } from 'react'
import 'aframe'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position'
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
      <a-assets>
            <a-mixin id="avatar-head"
                    geometry="primitive: box; depth: 0.3; height: 0.3; width: 0.3"
                    material="color: #222"></a-mixin>
            <a-mixin id="avatar-body"
                     geometry="primitive: cone; height: 1.5; radiusTop: 0.1; radiusBottom: 0.4"
                     material="color: #222"></a-mixin>
          </a-assets>


          <a-entity id="head" mixin="avatar-head"
                    camera look-controls wasd-controls
                    random-position="min: -10 1.7 -10; max: 10 1.9 10"
                    firebase-broadcast="componentsOnce: mixin;
                                        components: position, rotation"></a-entity>


          <a-entity id="body" firebase-broadcast="components: position" follow="[camera]">
            <a-entity mixin="avatar-body"
                      firebase-broadcast="componentsOnce: mixin; components: position"
                      position="0 -1 0"></a-entity>
          </a-entity>


          <a-sphere color="#645FCE" radius="0.2" position="-3 0 2"></a-sphere>
          <a-sphere color="#69E9F5" position="3 1 -7"></a-sphere>
          <a-sphere color="#43BFC7" radius="0.4" position="1 1 -2"></a-sphere>
          <a-sphere color="#A45FBE" position="-2 0 3"></a-sphere>
          <a-sphere color="#382F60" radius="0.8" position="2 4 -4"></a-sphere>
          <a-sphere color="#485188" position="2 4 -1"></a-sphere>
          <a-light type="ambient" color="#444"></a-light>
          <a-light type="point" intensity="1.2"></a-light>
          <a-sphere color="#FFF" radius="0.2" shader="flat" position="0 0.2 0"></a-sphere>
          <a-plane rotation="-90 0 0" color="#0C2233" height="25" width="25"
                   position="0 -0.1 0"></a-plane>
          <a-sky color="#222"></a-sky>


      </Scene>
    )

  }

}

export default VRScene01