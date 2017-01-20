import React, { Component } from 'react'
import '../binarymanager.js'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position';
import { Scene } from 'aframe-react';
import config from '../config'
import axios from 'axios';


//////////////////////////////////////////////
//EventEmitter
//////////////////////////////////////////////
window.EventEmitter = class EventEmitter {
  constructor () {
    this.subscribers = {};
  }

  on (eventName, eventListener) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }

    // Push the given listener function into the array
    // located on the instance's subscribers object.
    this.subscribers[eventName].push(eventListener);
  }

  emit (eventName, ...args) {
    if (!this.subscribers[eventName]) {
      return;
    }

    // For each subscriber, call it with our arguments.
    this.subscribers[eventName].forEach(listener => listener(...args));
  }
};

//////////////////////////////////////////////
//socket
//////////////////////////////////////////////
// const socket = window.io(window.location.origin);

// socket.on('connect', () => {

//     const room = window.location.pathname;

//     socket.emit('wantToJoinRoom', room);

//     window.whiteboard.on('draw', (start, end, color) => socket.emit('imDrawing', start, end, color));

//     socket.on('drawHistory', (drawHistory) => drawHistory.forEach(draw => window.whiteboard.draw(draw.start, draw.end, draw.color)));

//     socket.on('otherDraw', (start, end, color) => window.whiteboard.draw(start, end, color));

// });
//////////////////////////////////////////////
//whiteBoard
//////////////////////////////////////////////

window.whiteboard = new window.EventEmitter();



function netLog(...input){
  let joinedInput = input.join(' , ')
  console.log(joinedInput)

  axios.post('/api/logs', {message: joinedInput } )
}

let isVR = false;

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

netLog("AFRAME COMPONENTS", Object.keys(AFRAME.components))

netLog("BInary Manager", BinaryManager)

// AFRAME.registerComponent('auto-enter-vr2', {
//   init: function () {
//     this.el.enterVR();
//   }
// });


class VRScene05 extends Component {
  componentDidMount(){


    (function () {

        // Ultimately, the color of our stroke;
        var color = "black";

        // The color selection elements on the DOM.
        //var colorElements = [].slice.call(document.querySelectorAll('.marker'));
        // const colorElements = Array.from(document.querySelectorAll('.marker'));

        // colorElements.forEach(el => {

        //     // Set the background color of this element
        //     // to its id (purple, red, blue, etc).
        //     el.style.backgroundColor = el.id;

        //     // Attach a click handler that will set our color variable to
        //     // the elements id, remove the selected class from all colors,
        //     // and then add the selected class to the clicked color.
        //     el.addEventListener('click', function () {
        //         color = this.id;
        //         document.querySelector('.selected').classList.remove('selected');
        //         this.classList.add('selected');
        //     });

        // });

        const canvas = document.querySelector('#paint');
        const sketch = document.querySelector('#box1');
        const sketchStyle = getComputedStyle(sketch);

        canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
        canvas.height = parseInt(sketchStyle.getPropertyValue('height'));

        const ctx = canvas.getContext('2d');

        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const currentRayPosition = {
            x: 0,
            y: 0
        };

        const lastRayPosition = {
            x: 0,
            y: 0
        };

        let drawing = false;

        canvas.addEventListener('buttondown', function (e) {
            drawing = true;
            netLog("buttown down canvas event at e", e)
            // currentRayPosition.x = e.pageX - this.offsetLeft;
            // currentRayPosition.y = e.pageY - this.offsetTop;
        });

        canvas.addEventListener('buttonup', function () {
            netLog("buttown up canvas event at e", e)
            drawing = false;
        });

        canvas.addEventListener('axismove', function (e) {
            netLog("axismove canvas event at e", e)
            if (!drawing) return;

            // lastMousePosition.x = currentMousePosition.x;
            // lastMousePosition.y = currentMousePosition.y;

            // currentMousePosition.x = e.pageX - this.offsetLeft;
            // currentMousePosition.y = e.pageY - this.offsetTop;

            // whiteboard.draw(lastMousePosition, currentMousePosition, color, true);

        });

        whiteboard.draw = function (start, end, strokeColor = 'black', shouldBroadcast) {

            // Draw the line between the start and end positions
            // that is colored with the given color.
            ctx.beginPath();
            ctx.strokeStyle = strokeColor;
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.closePath();
            ctx.stroke();

            // If shouldBroadcast is truthy, we will emit a draw event to listeners
            // with the start, end and color data.
            // if (shouldBroadcast) {
            //     whiteboard.emit('draw', start, end, strokeColor);
            // }

        };

    })();

    netLog("AFRAME SYSTEMS", simpleStringify( AFRAME.systems ))

    const box1 = document.getElementById('box1')
    const box2 = document.getElementById('box2')
    const remote = document.getElementById('remote')


    // box2.addEventListener('raycaster-intersected', function(e){
    //   // box2.setAttribute('material', {color: "pink"})
    //   // document.location.reload();
    // })
    box1.addEventListener('buttondown', function(){
      netLog("box1 button down pressed");
      netLog("box1 button down pressed");
      box1.setAttribute('material', {color: "green"})
      // document.location.reload();
    })
    box1.addEventListener('raycaster-intersected', function(e){
      console.dir(e.intersection);
      netLog("raycaster event", JSON.stringify(e))

      netLog("raycaster event2", JSON.stringify(e))
    })
    // box1.addEventListener('raycaster-intersected', function(e){
    //   // console.log("e from box1 raycaster", e.detail)
    //   // console.dir("e.detail", e.detail)


    //   if (!isVR) {
    //     box1.setAttribute('material', {color: "pink"})
    //     document.querySelector('a-scene').enterVR()
    //     isVR = true;
    //   }


  }

  render() {
    let box2;
    netLog("HERE")
    return (
      <div style={{width: '100%', height: '100%'}}>
        <a-scene >
          <a-assets>
            <canvas id="paint"></canvas>
          </a-assets>
          <a-camera id="camera">
          </a-camera>
          <a-entity position="-0.2 2.0 0">
            <a-entity id="remote"  daydream-controller brush paint-controls raycaster="objects: .selectable">
              <a-cone id="ray" color="cyan" position="0 0 -2" rotation="-90 0 0" radius-bottom="0.005" radius-top="0.001" height="4"></a-cone>
              <a-box id="position-guide" visible="false" position="0 0 -2"></a-box>
            </a-entity>
          </a-entity>
          <a-sphere position="0 0 0" material="color: red; shader:flat" radius="15"></a-sphere>
          <a-box src="#paint" id="box1" scale="10 4 4" class="selectable" material="color:orange; shader: flat" position="0 2 -4"></a-box>
          <a-box id="box2" class="selectable" scale="10 4 4" material="color:green; shader: flat" position="0 2 10"></a-box>

          <a-sky color="blue"></a-sky>
        </a-scene>
      </div>
    );
  }
}



export default VRScene05;


// const MAX_POINTS = 500;

// const geometry = new THREE.BufferGeometry();

// const positions = new Float32Array( MAX_POINTS * 3 );
// geometry.addAttributes( 'position', new THREE.BufferAttribute( positions, 3 ).setDynamic(true) );
// // geometry.addAttributes( 'uv', new THREE.BufferAttribute( positions, 3 ).setDynamic(true) );
// // geometry.addAttributes( 'normal', new THREE.BufferAttribute( positions, 3 ).setDynamic(true) );

// //draw range
// drawCount = 2 // draw the first 2 points, only
// geometry.setDrawRange( 0, drawCount );

// //material
// const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );

// //line
// line = new THREE.LINE( geometry, material );
// scene.add( line


// const positions = line.geometry.attributes.array;

// let index = 0;
// for ( let i = 0; i < splineArray.length; i ++) {
//     positions[ index ++ ] = splineArray[i].x;
//     positions[ index ++ ] = splineArray[i].y;
//     positions[ index ++ ] = splineArray[i].z;
// }

// let x = ( event.clientX / window.innerWidth ) * 2 - 1;
// let y = ) event.clientY / window.innerHeight ) * 2 + 1;
// let vNow = new Three.Vector3(x, y, 0);

// vNow.unproject(camera);
// splineArray.push(vNow);

// line.geometry.setDrawRange( 0, newValue);

// line.geometry.attributes.position.needsUpdate = true



// var addPoint = function ( position, orientation, pointerPosition, pressure, timestamp) {
//   var uv = 0;
//   for ( i = 0; i < this.data.numPoints; i++) {
//     this.uvs[ uv++ ] = i / (this.data.numPoints - 1);
//     this.uvs[ uv++ ] = 0;

//     this.uvs[ uv++ ] = i / (this.data.numPoints - 1);
//     this.uvs[ uv++ ] = 1;

//     var direction = new THREE.Vector3();
//     direction.set(1, 0, 0);
//     direction.applyQuaternion(orientation);
//     direction.normalize();

//     var posA = pointerPosition.clone();
//     var posB = pointerPosition.clone();
//     posA.add(direction.clone());
//     posb.add(direction.clone());

//     this.vertices[ this.idx++ ] = posA.x;
//     this.vertices[ this.idx++ ] = posA.y;
//     this.vertices[ this.idx++ ] = posA.z;

//     this.vertices[ this.idx++ ] = posB.x;
//     this.vertices[ this.idx++ ] = posB.y;
//     this.vertices[ this.idx++ ] = posB.z;

//     // this.computerVertexNormals();
//     this.geometry.attributes.normal.needsUpdate = true;
//     this.geometry.attributes.position.needsUpdate = true;
//     this.geometry.attributes.uv.needsUpdate = true;

//     this.geometry.setDataRange(0, this.data.numPoints * 2);
//   }
// }

// const computerVertexNormals = function() {
//   var pA = new THREE.Vector3();
//   var pB = new THREE.Vector3();
//   var pC = new THREE.Vector3();
//   var cb = new THREE.Vector3();
//   var ab = new THREE.Vector3();

//   for (var i = 0; il = this.idx; i < il; i += 3) {
//     if (pair) {
//       pA.fromArray(this.vertices, i);
//       pB.fromArray(this.vertices, i + 3);
//       pC.fromArray(this.vertices, i + 6);
//     } else {
//       pA.fromArray(this.vertices, i + 3);
//       pB.fromArray(this.vertices, i);
//       pC.fromArray(this.vertices, i + 6);
//     }
//     pair = !pair;

//     cb.subVectors(pC, pB);
//     ab.subVectors(pA, pB);
//     cb.cross(ab);
//     cb.normalize();

//     this.normals[ i ] += cb.x;
//     this.normals[ i + 1 ] += cb.y;
//     this.normals[ i + 2 ] += cb.z;

//     this.normals[ i + 3 ] += cb.x;
//     this.normals[ i + 4 ] += cb.y;
//     this.normals[ i + 5 ] += cb.z;

//     this.normals[ i + 6 ] += cb.x;
//     this.normals[ i + 7 ] += cb.y;
//     this.normals[ i + 8 ] += cb.z;
//   }


//   first and last vertice (0 and 8) belongs just to one triangle
//   second and penultimate (1 and 7) belongs to two triangles
//   the rest of the vertices belongs to three triangles
//     1_____3_____5_____7
//     /\    /\    /\    /\
//    /  \  /  \  /  \  /  \
//   /____\/____\/____\/____\
//   0    2     4     6     8


//   // Vertices that are shared across three triangles
//   for (i = 2 * 3, il = this.idx - 2 * 3; i < il; i++) {
//     this.normals[ i ] = this.normals[ i ] / 3;
//   }

//   // Second and penultimate triangle, that shares just two triangles
//   this.normals[ 3 ] = this.normals[ 3 ] / 2;
//   this.normals[ 3 + 1 ] = this.normals[ 3 + 1 ] / 2;
//   this.normals[ 3 + 2 ] = this.normals[ 3 * 1 + 2 ] / 2;

//   this.normals[ this.idx - 2 * 3 ] = this.normals[ this.idx - 2 * 3 ] / 2;
//   this.normals[ this.idx - 2 * 3 + 1 ] = this.normals[ this.idx - 2 * 3 + 1 ] / 2;
//   this.normals[ this.idx - 2 * 3 + 2 ] = this.normals[ this.idx - 2 * 3 + 2 ] / 2;

//   this.geometry.normalizeNormals();


// }



// this is global now


// (function () {

//     // Ultimately, the color of our stroke;
//     var color;

//     // The color selection elements on the DOM.
//     var colorElements = [].slice.call(document.querySelectorAll('.marker'));

//     colorElements.forEach(function (el) {

//         // Set the background color of this element
//         // to its id (purple, red, blue, etc).
//         el.style.backgroundColor = el.id;

//         // Attach a click handler that will set our color variable to
//         // the elements id, remove the selected class from all colors,
//         // and then add the selected class to the clicked color.
//         el.addEventListener('click', function () {
//             color = this.id;
//             document.querySelector('.selected').classList.remove('selected');
//             this.classList.add('selected');
//         });

//     });

//     var canvas = document.querySelector('#paint');
//     var sketch = document.querySelector('#sketch');
//     var sketchStyle = getComputedStyle(sketch);

//     canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
//     canvas.height = parseInt(sketchStyle.getPropertyValue('height'));

//     var ctx = canvas.getContext('2d');

//     ctx.lineWidth = 5;
//     ctx.lineJoin = 'round';
//     ctx.lineCap = 'round';

//     var currentMousePosition = {
//         x: 0,
//         y: 0
//     };

//     var lastMousePosition = {
//         x: 0,
//         y: 0
//     };

//     var drawing = false;

//     canvas.addEventListener('mousedown', function (e) {
//         drawing = true;
//         currentMousePosition.x = e.pageX - this.offsetLeft;
//         currentMousePosition.y = e.pageY - this.offsetTop;
//     });

//     canvas.addEventListener('mouseup', function () {
//         drawing = false;
//     });

//     canvas.addEventListener('mousemove', function (e) {

//         if (!drawing) return;

//         lastMousePosition.x = currentMousePosition.x;
//         lastMousePosition.y = currentMousePosition.y;

//         currentMousePosition.x = e.pageX - this.offsetLeft;
//         currentMousePosition.y = e.pageY - this.offsetTop;

//         whiteboard.draw(lastMousePosition, currentMousePosition, color, true);

//     });

//     whiteboard.draw = function (start, end, strokeColor, shouldBroadcast) {

//         // Draw the line between the start and end positions
//         // that is colored with the given color.
//         ctx.beginPath();
//         ctx.strokeStyle = strokeColor || 'black';
//         ctx.moveTo(start.x, start.y);
//         ctx.lineTo(end.x, end.y);
//         ctx.closePath();
//         ctx.stroke();

//         // If shouldBroadcast is truthy, we will emit a draw event to listeners
//         // with the start, end and color data.
//         if (shouldBroadcast) {
//             // this event we emit is caught by the whiteboard object in app.js
//             whiteboard.emit('draw', start, end, strokeColor);
//         }

//     };

// })();
