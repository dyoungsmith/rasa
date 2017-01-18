import React, { Component } from 'react'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position';
import { Scene } from 'aframe-react';
import config from '../config'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

class VRScene04 extends Component {
  render() {
    return (
      <div style={{width: '100%', height: '100%'}}>
        <Scene>
          <a-entity position="-0.2 1.3 0">
            <a-entity id="remote" daydream-controller raycaster="objects: .selectable">
              <a-cone id="ray" color="cyan" position="0 0 -2" rotation="-90 0 0" radius-bottom="0.005" radius-top="0.001" height="4"></a-cone>
              <a-box id="position-guide" visible="false" position="0 0 -2"></a-box>
            </a-entity>
          </a-entity>
          <a-box id="box" class="selectable" material="color:orange; shader: flat" position="0 1 -4"></a-box>
          <a-sky color="blue"></a-sky>
        </Scene>
      </div>
    );
  }
}

export default VRScene04;
