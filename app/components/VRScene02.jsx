import React, { Component } from 'react'
import 'aframe-animation-component';
import 'aframe-text-component';
import './aframe/components/follow'
import './aframe/components/random-position'

import Camera from './aframe/aframeReactComponents/Camera.js'
import Text from './aframe/aframeReactComponents/Text.js'
import Sky from './aframe/aframeReactComponents/Sky.js'

console.log("text", Text)
import { Entity, Scene } from 'aframe-react'
import config from '../config'

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

class VRScene02 extends Component {
  constructor(props) {
    super(props);
    this.state = {color: 'red'};
  }

  changeColor() {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue'];
    this.setState({
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  render() {
    console.log("components", AFRAME.components)
    console.log("systems", AFRAME.systems)

    return (
      <Scene>
        <Camera>
          <a-cursor
            animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150">
          </a-cursor>
        </Camera>

        <Sky src="url(https://rawgit.com/aframevr/assets/gh-pages/360-image-gallery-boilerplate/img/sechelt.jpg)"/>

        <Text
          text='Hello World!'
          color='#DADADA'
          position='-1.75 1 -3'/>

          <Entity light={{type: 'ambient', color: '#888'}}/>
          <Entity light={{type: 'directional', intensity: 0.5}} position='-1 1 0'/>
          <Entity light={{type: 'directional', intensity: 1}} position='1 1 0'/>

          <Entity
            animation__rot={{property: 'rotation', dur: 2000, loop: true, to: '360 360 360'}}
            animation__sca={{property: 'scale', dir: 'alternate', dur: 100, loop: true, to: '1.1 1.1 1.1'}}
            geometry='primitive: box'
            material={{color: this.state.color, opacity: 0.6}}
            position='0 -0.5 -3'
            onClick={this.changeColor.bind(this)}>
          <Entity
            animation__scale={{property: 'scale', dir: 'alternate', dur: 100, loop: true, to: '2 2 2'}}
            geometry='primitive: box; depth: 0.2; height: 0.2; width: 0.2'
            material={{color: '#24CAFF'}}/>
          </Entity>
      </Scene>
    )
  }

}

export default VRScene02
