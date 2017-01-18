import React, { Component } from 'react'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position';
import { Scene } from 'aframe-react';
import config from '../config'
import 'axios'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

console.log("AFRAME COMPONENTS", Object.keys(AFRAME.components))

AFRAME.registerComponent('auto-enter-vr2', {
  init: function () {
    this.el.enterVR();
  }
});

class VRScene04 extends Component {
  componentDidMount(){
    const box2 = document.getElementById('box2')
    box2.addEventListener('raycaster-intersected', function(){
      box2.setAttribute('material', {color: "pink"})
      document.location.reload();
    })
  }
  render() {
    let box2;
    return (
      <div style={{width: '100%', height: '100%'}}>
        <a-scene auto-enter-vr2>
          <a-entity position="-0.2 2.0 0">
            <a-entity id="remote" daydream-controller raycaster="objects: .selectable">
              <a-cone id="ray" color="cyan" position="0 0 -2" rotation="-90 0 0" radius-bottom="0.005" radius-top="0.001" height="4"></a-cone>
              <a-box id="position-guide" visible="false" position="0 0 -2"></a-box>
            </a-entity>
          </a-entity>
          <a-box id="box" scale="10 4 4" class="selectable" material="color:orange; shader: flat" position="0 2 -4"></a-box>
          <a-box id="box2" class="selectable" scale="10 4 4" material="color:green; shader: flat" position="0 2 10"></a-box>

          <a-sky color="blue"></a-sky>
        </a-scene>
      </div>
    );
  }
}

export default VRScene04;
