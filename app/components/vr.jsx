import React, { Component } from 'react';
import aframe from 'aframe';


aframe.registerComponent('grab', {
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    // Bind event handlers
    this.onHit = this.onHit.bind(this);
    this.onGripOpen = this.onGripOpen.bind(this);
    this.onGripClose = this.onGripClose.bind(this);
  },

  play: function () {
    var el = this.el;
    el.addEventListener('hit', this.onHit);
    el.addEventListener('gripclose', this.onGripClose);
    el.addEventListener('gripopen', this.onGripOpen);
    el.addEventListener('thumbup', this.onGripClose);
    el.addEventListener('thumbdown', this.onGripOpen);
    el.addEventListener('pointup', this.onGripClose);
    el.addEventListener('pointdown', this.onGripOpen);
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('hit', this.onHit);
    el.removeEventListener('gripclose', this.onGripClose);
    el.removeEventListener('gripopen', this.onGripOpen);
    el.removeEventListener('thumbup', this.onGripClose);
    el.removeEventListener('thumbdown', this.onGripOpen);
    el.removeEventListener('pointup', this.onGripClose);
    el.removeEventListener('pointdown', this.onGripOpen);
  },

  onGripClose: function (evt) {
    this.grabbing = true;
    delete this.previousPosition;
  },

  onGripOpen: function (evt) {
    var hitEl = this.hitEl;
    this.grabbing = false;
    if (!hitEl) { return; }
    hitEl.removeState(this.GRABBED_STATE);
    this.hitEl = undefined;
  },

  onHit: function (evt) {
    var hitEl = evt.detail.el;
    // If the element is already grabbed (it could be grabbed by another controller).
    // If the hand is not grabbing the element does not stick.
    // If we're already grabbing something you can't grab again.
    if (!hitEl || hitEl.is(this.GRABBED_STATE) || !this.grabbing || this.hitEl) { return; }
    hitEl.addState(this.GRABBED_STATE);
    this.hitEl = hitEl;
  },

  tick: function () {
    var hitEl = this.hitEl;
    var position;
    if (!hitEl) { return; }
    this.updateDelta();
    position = hitEl.getAttribute('position');
    hitEl.setAttribute('position', {
      x: position.x + this.deltaPosition.x,
      y: position.y + this.deltaPosition.y,
      z: position.z + this.deltaPosition.z
    });
  },

  updateDelta: function () {
    var currentPosition = this.el.getAttribute('position');
    var previousPosition = this.previousPosition || currentPosition;
    var deltaPosition = {
      x: currentPosition.x - previousPosition.x,
      y: currentPosition.y - previousPosition.y,
      z: currentPosition.z - previousPosition.z
    };
    this.previousPosition = currentPosition;
    this.deltaPosition = deltaPosition;
  }
});

/* global AFRAME, THREE */

/**
 * Implement AABB collision detection for entities with a mesh.
 * (https://en.wikipedia.org/wiki/Minimum_bounding_box#Axis-aligned_minimum_bounding_box)
 * It sets the specified state on the intersected entities.
 *
 * @property {string} objects - Selector of the entities to test for collision.
 * @property {string} state - State to set on collided entities.
 *
 */
aframe.registerComponent('aabb-collider', {
  schema: {
    objects: {default: ''},
    state: {default: 'collided'}
  },

  init: function () {
    this.els = [];
    this.collisions = [];
    this.elMax = new THREE.Vector3();
    this.elMin = new THREE.Vector3();
  },

  /**
   * Update list of entities to test for collision.
   */
  update: function () {
    var data = this.data;
    var objectEls;

    // Push entities into list of els to intersect.
    if (data.objects) {
      objectEls = this.el.sceneEl.querySelectorAll(data.objects);
    } else {
      // If objects not defined, intersect with everything.
      objectEls = this.el.sceneEl.children;
    }
    // Convert from NodeList to Array
    this.els = Array.prototype.slice.call(objectEls);
  },

  tick: (function () {
    var boundingBox = new THREE.Box3();
    return function () {
      var collisions = [];
      var el = this.el;
      var mesh = el.getObject3D('mesh');
      var self = this;
      // No mesh, no collisions
      if (!mesh) { return; }
      // Update the bounding box to account for rotations and
      // position changes.
      updateBoundingBox();
      // Update collisions.
      this.els.forEach(intersect);
      // Emit events.
      collisions.forEach(handleHit);
      // No collisions.
      if (collisions.length === 0) { self.el.emit('hit', {el: null}); }
      // Updated the state of the elements that are not intersected anymore.
      this.collisions.filter(function (el) {
        return collisions.indexOf(el) === -1;
      }).forEach(function removeState (el) {
        el.removeState(self.data.state);
      });
      // Store new collisions
      this.collisions = collisions;

      // AABB collision detection
      function intersect (el) {
        var intersected;
        var mesh = el.getObject3D('mesh');
        var elMin;
        var elMax;
        if (!mesh) { return; }
        boundingBox.setFromObject(mesh);
        elMin = boundingBox.min;
        elMax = boundingBox.max;
        // Bounding boxes are always aligned with the world coordinate system.
        // The collision test checks for the conditions where cubes intersect.
        // It's an extension to 3 dimensions of this approach (with the condition negated)
        // https://www.youtube.com/watch?v=ghqD3e37R7E
        intersected = (self.elMin.x <= elMax.x && self.elMax.x >= elMin.x) &&
                      (self.elMin.y <= elMax.y && self.elMax.y >= elMin.y) &&
                      (self.elMin.z <= elMax.z && self.elMax.z >= elMin.z);
        if (!intersected) { return; }
        collisions.push(el);
      }

      function handleHit (hitEl) {
        hitEl.emit('hit');
        hitEl.addState(self.data.state);
        self.el.emit('hit', {el: hitEl});
      }

      function updateBoundingBox () {
        boundingBox.setFromObject(mesh);
        self.elMin.copy(boundingBox.min);
        self.elMax.copy(boundingBox.max);
      }
    };
  })()
});


class Vr extends Component {
  constructor(){
    super()
    this.state = {

    }
  }
  render(){
    return(
      <div>
        <a-scene>
          <a-entity hand-controls="left" aabb-collider="objects: .cube;" grab></a-entity>
          <a-entity position="0 0 -0.5">
            <a-entity class="cube" mixin="cube" position="0.30 1.65 0"></a-entity>
          </a-entity>

          <a-sphere position="2 1.25 -5" radius="10.25" color="#EF2D5E">
          </a-sphere>
          <a-sphere grab position="3 1.25 -5" radius="10.25" color="#EF2D5E">
          </a-sphere>
          <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E">
          </a-sphere>
          <a-box position="-1 0.5 -3" rotation="0 45 0" width="1" height="1" depth="1" color="#4CC3D9"></a-box>
          <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFc65D"></a-cylinder>
          <a-plane position="0 0 -4" rotation="-90 0 0" width="4"  height="4" color="#7BC8A4"></a-plane>
          <a-sky color="#ECECEC"></a-sky>
        </a-scene>

      </div>
    )
  }
}

export default Vr;

