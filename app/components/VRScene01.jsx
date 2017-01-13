import React, { Component } from 'react';
import 'aframe';
// import 'aframe-bmfont-text-component';
import { Entity, Scene } from 'aframe-react';


class VRScene01 extends Component {


  render() {

    return(
      <Scene>
        <Entity geometry={{primitive: 'box'}} material="color: red" position={[0,0, -5]} />
        <Entity position="{[0, 1, -5]}" />
      </Scene>
    )

  }

}

export default VRScene01
