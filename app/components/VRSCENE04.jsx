import React, { Component } from 'react'
import '../binarymanager.js'
import 'aframe-firebase-component'
import './aframe/components/follow'
import './aframe/components/random-position';
import { Scene } from 'aframe-react';
import config from '../config'
import axios from 'axios';

function simpleStringify (object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return JSON.stringify(simpleObject); // returns cleaned up JSON
};

function netLog(...input){
  let joinedInput = input.join(' , ')
  console.log(joinedInput)

  axios.post('/api/logs', {message: joinedInput } )
}

let isVR = false;

let aframeConfig = AFRAME.utils.styleParser.stringify(config);

netLog("AFRAME COMPONENTS", Object.keys(AFRAME.components))

netLog("BInary Manager", BinaryManager)

AFRAME.registerComponent('auto-enter-vr2', {
  init: function () {
    this.el.enterVR();
  }
});


//////////////////////////////////////////////
//Register Brushes
//////////////////////////////////////////////
var VERSION = 1;

AFRAME.BRUSHES = {};

AFRAME.registerBrush = function (name, definition, options) {
  var proto = {};

  // Format definition object to prototype object.
  Object.keys(definition).forEach(function (key) {
    proto[key] = {
      value: definition[key],
      writable: true
    };
  });

  if (AFRAME.BRUSHES[name]) {
    throw new Error('The brush `' + name + '` has been already registered. ' +
                    'Check that you are not loading two versions of the same brush ' +
                    'or two different brushes of the same name.');
  }

  var BrushInterface = function () {};

  var defaultOptions = {
    spacing: 0,
    maxPoints: 0
  };

  BrushInterface.prototype = {
    options: Object.assign(defaultOptions, options),
    reset: function () {},
    tick: function (timeoffset, delta) {},
    addPoint: function (position, orientation, pointerPosition, pressure, timestamp) {},
    getBinary: function (system) {
      // Color = 3*4 = 12
      // NumPoints   =  4
      // Brush index =  1
      // ----------- = 21
      // [Point] = vector3 + quat + pressure + timestamp = (3+4+1+1)*4 = 36

      var bufferSize = 21 + (36 * this.data.points.length);
      var binaryManager = new BinaryManager(new ArrayBuffer(bufferSize));
      binaryManager.writeUint8(system.getUsedBrushes().indexOf(this.brushName));  // brush index
      binaryManager.writeColor(this.data.color);    // color
      binaryManager.writeFloat32(this.data.size);   // brush size

      // Number of points
      binaryManager.writeUint32(this.data.points.length);

      // Points
      for (var i = 0; i < this.data.points.length; i++) {
        var point = this.data.points[i];
        binaryManager.writeFloat32Array(point.position.toArray());
        binaryManager.writeFloat32Array(point.orientation.toArray());
        binaryManager.writeFloat32(point.pressure);
        binaryManager.writeUint32(point.timestamp);
      }
      return binaryManager.getDataView();
    }
  };

  function wrapInit (initMethod) {
    return function init (color, brushSize) {
      this.object3D = new THREE.Object3D();
      this.data = {
        points: [],
        size: brushSize,
        prevPoint: null,
        numPoints: 0,
        color: color.clone()
      };
      initMethod.call(this, color, brushSize);
    };
  }

  function wrapAddPoint (addPointMethod) {
    return function addPoint (position, orientation, pointerPosition, pressure, timestamp) {
      if ((this.data.prevPoint && this.data.prevPoint.distanceTo(position) <= this.options.spacing) ||
          this.options.maxPoints !== 0 && this.data.numPoints >= this.options.maxPoints) {
        return;
      }
      if (addPointMethod.call(this, position, orientation, pointerPosition, pressure, timestamp)) {
        this.data.numPoints++;
        this.data.points.push({
          'position': position.clone(),
          'orientation': orientation.clone(),
          'pressure': pressure,
          'timestamp': timestamp
        });

        this.data.prevPoint = position.clone();
      }
    };
  }

  var NewBrush = function () {};
  NewBrush.prototype = Object.create(BrushInterface.prototype, proto);
  NewBrush.prototype.brushName = name;
  NewBrush.prototype.constructor = NewBrush;
  NewBrush.prototype.init = wrapInit(NewBrush.prototype.init);
  NewBrush.prototype.addPoint = wrapAddPoint(NewBrush.prototype.addPoint);
  AFRAME.BRUSHES[name] = NewBrush;

  // console.log('New brush registered `' + name + '`');
  NewBrush.used = false; // Used to know which brushes have been used on the drawing
  return NewBrush;
};

AFRAME.registerSystem('brush', {
  schema: {},
  brushes: {},
  strokes: [],
  getUsedBrushes: function () {
    return Object.keys(AFRAME.BRUSHES)
      .filter(function (name) { return AFRAME.BRUSHES[name].used; });
  },
  getBrushByName: function (name) {
    return AFRAME.BRUSHES[name];
  },
  undo: function () {
    var stroke = this.strokes.pop();
    if (stroke) {
      var entity = stroke.entity;
      entity.emit('stroke-removed', {entity: entity});
      entity.parentNode.removeChild(entity);
    }
  },
  clear: function () {
    // Remove all the stroke entities
    for (var i = 0; i < this.strokes.length; i++) {
      var entity = this.strokes[i].entity;
      entity.parentNode.removeChild(entity);
    }

    // Reset the used brushes
    Object.keys(AFRAME.BRUSHES).forEach(function (name) {
      AFRAME.BRUSHES[name].used = false;
    });

    this.strokes = [];
  },
  init: function () {
    this.version = VERSION;
    this.clear();
  },
  tick: function (time, delta) {
    if (!this.strokes.length) { return; }
    for (var i = 0; i < this.strokes.length; i++) {
      this.strokes[i].tick(time, delta);
    }
  },
  generateRandomStrokes: function (numStrokes) {
    function randNeg () { return 2 * Math.random() - 1; }

    for (var l = 0; l < numStrokes; l++) {
      var brushName = 'flat';
      var color = new THREE.Color(Math.random(), Math.random(), Math.random());
      var size = Math.random() * 0.1;
      var numPoints = parseInt(Math.random() * 500);

      var stroke = this.addNewStroke(brushName, color, size);

      var position = new THREE.Vector3(randNeg(), randNeg(), randNeg());
      var aux = new THREE.Vector3();
      var orientation = new THREE.Quaternion();

      var pressure = 0.2;
      for (var i = 0; i < numPoints; i++) {
        aux.set(randNeg(), randNeg(), randNeg());
        aux.multiplyScalar(randNeg() / 20);
        orientation.setFromUnitVectors(position.clone().normalize(), aux.clone().normalize());
        position = position.add(aux);
        var timestamp = 0;

        var pointerPosition = this.getPointerPosition(position, orientation);
        stroke.addPoint(position, orientation, pointerPosition, pressure, timestamp);
      }
    }
  },
  addNewStroke: function (brushName, color, size) {
    var Brush = this.getBrushByName(brushName);
    if (!Brush) {
      var newBrushName = Object.keys(AFRAME.BRUSHES)[0];
      Brush = AFRAME.BRUSHES[newBrushName];
      console.warn('Invalid brush name: `' + brushName + '` using `' + newBrushName + '`');
    }

    Brush.used = true;
    var stroke = new Brush();
    stroke.brush = Brush;
    stroke.init(color, size);
    this.strokes.push(stroke);

    var entity = document.createElement('a-entity');
    document.querySelector('a-scene').appendChild(entity);
    entity.setObject3D('mesh', stroke.object3D);
    stroke.entity = entity;

    return stroke;
  },
  getBinary: function () {
    var dataViews = [];
    var MAGIC = 'apainter';

    // Used brushes
    var usedBrushes = this.getUsedBrushes();

    // MAGIC(8) + version (2) + usedBrushesNum(2) + usedBrushesStrings(*)
    var bufferSize = MAGIC.length + usedBrushes.join(' ').length + 9;
    var binaryManager = new BinaryManager(new ArrayBuffer(bufferSize));

    // Header magic and version
    binaryManager.writeString(MAGIC);
    binaryManager.writeUint16(VERSION);

    binaryManager.writeUint8(usedBrushes.length);
    for (var i = 0; i < usedBrushes.length; i++) {
      binaryManager.writeString(usedBrushes[i]);
    }

    // Number of strokes
    binaryManager.writeUint32(this.strokes.length);
    dataViews.push(binaryManager.getDataView());

    // Strokes
    for (i = 0; i < this.strokes.length; i++) {
      dataViews.push(this.strokes[i].getBinary(this));
    }
    return dataViews;
  },
  getPointerPosition: (function () {
    var pointerPosition = new THREE.Vector3();
    var offset = new THREE.Vector3(0, 0.7, 1);
    return function getPointerPosition (position, orientation) {
      var pointer = offset
        .clone()
        .applyQuaternion(orientation)
        .normalize()
        .multiplyScalar(-0.03);
      pointerPosition.copy(position).add(pointer);
      return pointerPosition;
    };
  })(),
  loadBinary: function (buffer) {
    var binaryManager = new BinaryManager(buffer);
    var magic = binaryManager.readString();
    if (magic !== 'apainter') {
      console.error('Invalid `magic` header');
      return;
    }

    var version = binaryManager.readUint16();
    if (version !== VERSION) {
      console.error('Invalid version: ', version, '(Expected: ' + VERSION + ')');
    }

    var numUsedBrushes = binaryManager.readUint8();
    var usedBrushes = [];
    for (var b = 0; b < numUsedBrushes; b++) {
      usedBrushes.push(binaryManager.readString());
    }

    var numStrokes = binaryManager.readUint32();

    for (var l = 0; l < numStrokes; l++) {
      var brushIndex = binaryManager.readUint8();
      var color = binaryManager.readColor();
      var size = binaryManager.readFloat();
      var numPoints = binaryManager.readUint32();

      var stroke = this.addNewStroke(usedBrushes[brushIndex], color, size);

      for (var i = 0; i < numPoints; i++) {
        var position = binaryManager.readVector3();
        var orientation = binaryManager.readQuaternion();
        var pressure = binaryManager.readFloat();
        var timestamp = binaryManager.readUint32();

        var pointerPosition = this.getPointerPosition(position, orientation);
        stroke.addPoint(position, orientation, pointerPosition, pressure, timestamp);
      }
    }
  },
  loadFromUrl: function (url) {
    var loader = new THREE.XHRLoader(this.manager);
    loader.crossOrigin = 'anonymous';
    loader.setResponseType('arraybuffer');

    var self = this;
    loader.load(url, function (buffer) {
      self.loadBinary(buffer);
    });
  }
});

AFRAME.registerComponent('brush', {
  schema: {
    color: {type: 'color', default: '#ef2d5e'},
    size: {default: 0.01, min: 0.0, max: 0.3},
    brush: {default: 'flat'},
    enabled: { default: true }
  },
  init: function () {
    netLog("this el", simpleStringify(this.el))
    var data = this.data;
    this.color = new THREE.Color(data.color);

    this.el.emit('brushcolor-changed', {color: this.color});
    this.el.emit('brushsize-changed', {brushSize: data.size});

    this.active = false;
    this.obj = this.el.object3D;

    this.currentStroke = null;
    this.strokeEntities = [];

    this.sizeModifier = 0.0;
    this.textures = {};
    this.currentMap = 0;

    this.model = this.el.getObject3D('mesh');
    this.drawing = false;

    var self = this;

    this.el.addEventListener('axismove', function (evt) {
      netLog("axismove", simpleStringify(evt) )
      if (evt.detail.axis[0] === 0 && evt.detail.axis[1] === 0) {
        return;
      }
      var size = (evt.detail.axis[1] + 1) / 2 * self.schema.size.max;
      self.el.setAttribute('brush', 'size', size);
    });

    // this.el.addEventListener('buttondown', function (evt) {
    //   netLog("buttondown pushed", el )
    //   if (!self.data.enabled) { return; }
    //   // Grip
    //   if (evt.detail.id === 2) {
    //     self.system.undo();
    //   }
    // });

    this.el.addEventListener('buttondown', function (evt) {
      netLog("buttondown pushed", simpleStringify(evt) )
      netLog("buttondown pushed-self-data", simpleStringify(self.data) )
      // this.el.scene.emit('pushedbutton')
      netLog("About to check data enabled")
      // if (!self.data.enabled) { netLog("return from data enabled" ); return; }
      // Trigger
      // if (evt.detail.id === 1) {
        // var value = evt.detail.state.value;
        var value = 1;
        self.sizeModifier = value;
        netLog("BEFORE VALUE CHECK")
        // if (value > 0.1) {
          if (!self.active) {
            netLog("BEFORE RUNNING START NEWSTROKE!!!")
            self.startNewStroke();
            self.active = true;
          }
        // } else {
          if (self.active) {
            self.previousEntity = self.currentEntity;
            self.currentStroke = null;
          }
          // self.active = false;
        // }
      // }
    });
  },
  update: function (oldData) {
    var data = this.data;
    if (oldData.color !== data.color) {
      this.color.set(data.color);
      this.el.emit('brushcolor-changed', {color: this.color});
    }
    if (oldData.size !== data.size) {
      this.el.emit('brushsize-changed', {size: data.size});
    }
  },
  tick: (function () {
    var position = new THREE.Vector3();
    var rotation = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    return function tick (time, delta) {
      if (this.currentStroke && this.active) {
        this.obj.matrixWorld.decompose(position, rotation, scale);
        var pointerPosition = this.system.getPointerPosition(position, rotation);
        this.currentStroke.addPoint(position, rotation, pointerPosition, this.sizeModifier, time);
      }
    };
  })(),
  startNewStroke: function () {
    netLog("IN NEW STROKE*********************");
    netLog("data info", simpleStringify(this.data));
    netLog("This.system", simpleStringify(this.system));
    netLog("addNewStroke", simpleStringify(this.system.addNewStroke));
    this.currentStroke = this.system.addNewStroke(this.data.brush, this.color, this.data.size);
    netLog("About to emit", simpleStringify({entity: this.el, stroke: this.currentStroke}));
    this.el.emit('stroke-started', {entity: this.el, stroke: this.currentStroke});
  }
});

(function () {
  var line = {

    init: function (color, brushSize) {
      this.idx = 0;
      this.geometry = new THREE.BufferGeometry();
      this.vertices = new Float32Array(this.options.maxPoints * 3 * 3);
      this.normals = new Float32Array(this.options.maxPoints * 3 * 3);
      this.uvs = new Float32Array(this.options.maxPoints * 2 * 2);

      this.geometry.setDrawRange(0, 0);
      this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));
      this.geometry.addAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setDynamic(true));
      this.geometry.addAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setDynamic(true));

      var mesh = new THREE.Mesh(this.geometry, this.getMaterial());
      mesh.drawMode = THREE.TriangleStripDrawMode;

      mesh.frustumCulled = false;
      mesh.vertices = this.vertices;

      this.object3D.add(mesh);
    },

    getMaterial: function () {
      var map = this.materialOptions.map;
      var type = this.materialOptions.type;

      var defaultOptions = {};
      var defaultTextureOptions = {};
      if (map) {
        defaultTextureOptions = {
          map: map,
          transparent: true,
          alphaTest: 0.5
        };
      }

      if (type === 'shaded') {
        defaultOptions = {
          color: this.data.color,
          roughness: 0.75,
          metalness: 0.25,
          side: THREE.DoubleSide
        };
      } else {
        defaultOptions = {
          color: this.data.color,
          side: THREE.DoubleSide
        };
      }

      var options = Object.assign(defaultOptions, defaultTextureOptions, this.materialOptions);
      delete options.type;

      if (type === 'shaded') {
        return new THREE.MeshStandardMaterial(options);
      } else {
        return new THREE.MeshBasicMaterial(options);
      }
    },
    addPoint: function (position, orientation, pointerPosition, pressure, timestamp) {
      var uv = 0;
      for (i = 0; i < this.data.numPoints; i++) {
        this.uvs[ uv++ ] = i / (this.data.numPoints - 1);
        this.uvs[ uv++ ] = 0;

        this.uvs[ uv++ ] = i / (this.data.numPoints - 1);
        this.uvs[ uv++ ] = 1;
      }

      var direction = new THREE.Vector3();
      direction.set(1, 0, 0);
      direction.applyQuaternion(orientation);
      direction.normalize();

      var posA = pointerPosition.clone();
      var posB = pointerPosition.clone();
      var brushSize = this.data.size * pressure;
      posA.add(direction.clone().multiplyScalar(brushSize / 2));
      posB.add(direction.clone().multiplyScalar(-brushSize / 2));

      this.vertices[ this.idx++ ] = posA.x;
      this.vertices[ this.idx++ ] = posA.y;
      this.vertices[ this.idx++ ] = posA.z;

      this.vertices[ this.idx++ ] = posB.x;
      this.vertices[ this.idx++ ] = posB.y;
      this.vertices[ this.idx++ ] = posB.z;

      this.computeVertexNormals();
      this.geometry.attributes.normal.needsUpdate = true;
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.uv.needsUpdate = true;

      this.geometry.setDrawRange(0, this.data.numPoints * 2);

      return true;
    },

    computeVertexNormals: function () {
      var pA = new THREE.Vector3();
      var pB = new THREE.Vector3();
      var pC = new THREE.Vector3();
      var cb = new THREE.Vector3();
      var ab = new THREE.Vector3();

      for (var i = 0, il = this.idx; i < il; i++) {
        this.normals[ i ] = 0;
      }

      var pair = true;
      for (i = 0, il = this.idx; i < il; i += 3) {
        if (pair) {
          pA.fromArray(this.vertices, i);
          pB.fromArray(this.vertices, i + 3);
          pC.fromArray(this.vertices, i + 6);
        } else {
          pA.fromArray(this.vertices, i + 3);
          pB.fromArray(this.vertices, i);
          pC.fromArray(this.vertices, i + 6);
        }
        pair = !pair;

        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();

        this.normals[ i ] += cb.x;
        this.normals[ i + 1 ] += cb.y;
        this.normals[ i + 2 ] += cb.z;

        this.normals[ i + 3 ] += cb.x;
        this.normals[ i + 4 ] += cb.y;
        this.normals[ i + 5 ] += cb.z;

        this.normals[ i + 6 ] += cb.x;
        this.normals[ i + 7 ] += cb.y;
        this.normals[ i + 8 ] += cb.z;
      }

      /*
      first and last vertice (0 and 8) belongs just to one triangle
      second and penultimate (1 and 7) belongs to two triangles
      the rest of the vertices belongs to three triangles
        1_____3_____5_____7
        /\    /\    /\    /\
       /  \  /  \  /  \  /  \
      /____\/____\/____\/____\
      0    2     4     6     8
      */

      // Vertices that are shared across three triangles
      for (i = 2 * 3, il = this.idx - 2 * 3; i < il; i++) {
        this.normals[ i ] = this.normals[ i ] / 3;
      }

      // Second and penultimate triangle, that shares just two triangles
      this.normals[ 3 ] = this.normals[ 3 ] / 2;
      this.normals[ 3 + 1 ] = this.normals[ 3 + 1 ] / 2;
      this.normals[ 3 + 2 ] = this.normals[ 3 * 1 + 2 ] / 2;

      this.normals[ this.idx - 2 * 3 ] = this.normals[ this.idx - 2 * 3 ] / 2;
      this.normals[ this.idx - 2 * 3 + 1 ] = this.normals[ this.idx - 2 * 3 + 1 ] / 2;
      this.normals[ this.idx - 2 * 3 + 2 ] = this.normals[ this.idx - 2 * 3 + 2 ] / 2;

      this.geometry.normalizeNormals();
    }
  };

  var lines = [
    {
      name: 'flat',
      materialOptions: {
        type: 'flat'
      },
      thumbnail: 'brushes/thumb_flat.gif'
    },
    {
      name: 'smooth',
      materialOptions: {
        type: 'shaded'
      },
      thumbnail: 'brushes/thumb_smooth.gif'
    },
    {
      name: 'squared-textured',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/squared_textured.png'
      },
      thumbnail: 'brushes/thumb_squared_textured.gif'
    },
    {
      name: 'line-gradient',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/line_gradient.png'
      },
      thumbnail: 'brushes/thumb_line_gradient.gif'
    },
    {
      name: 'silky-flat',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/silky_flat.png'
      },
      thumbnail: 'brushes/thumb_silky_flat.gif'
    },
    {
      name: 'silky-textured',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/silky_textured.png'
      },
      thumbnail: 'brushes/thumb_silky_textured.gif'
    },
    {
      name: 'lines1',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/lines1.png'
      },
      thumbnail: 'brushes/thumb_lines1.gif'
    },
    {
      name: 'lines2',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/lines2.png'
      },
      thumbnail: 'brushes/thumb_lines2.gif'
    },
    {
      name: 'lines3',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/lines3.png'
      },
      thumbnail: 'brushes/thumb_lines3.gif'
    },
    {
      name: 'lines4',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/lines4.png'
      },
      thumbnail: 'brushes/thumb_lines4.gif'
    },
    {
      name: 'lines5',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/lines5.png'
      },
      thumbnail: 'brushes/thumb_lines5.gif'
    },
    {
      name: 'line-grunge1',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/line_grunge1.png'
      },
      thumbnail: 'brushes/thumb_line_grunge1.gif'
    },
    {
      name: 'line-grunge2',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/line_grunge2.png'
      },
      thumbnail: 'brushes/thumb_line_grunge2.gif'
    },
    {
      name: 'line-grunge3',
      materialOptions: {
        type: 'textured',
        textureSrc: 'brushes/line_grunge3.png'
      },
      thumbnail: 'brushes/thumb_line_grunge3.gif'
    }
  ];
  var lines = [];

  var textureLoader = new THREE.TextureLoader();

  for (var i = 0; i < lines.length; i++) {
    var definition = lines[i];
    if (definition.materialOptions.textureSrc) {
      definition.materialOptions.map = textureLoader.load(definition.materialOptions.textureSrc);
      delete definition.materialOptions.textureSrc;
    }
    AFRAME.registerBrush(definition.name, Object.assign({}, line, {materialOptions: definition.materialOptions}), {thumbnail: definition.thumbnail, maxPoints: 3000});
  }
})();
  /* globals AFRAME THREE */
AFRAME.registerComponent('paint-controls', {
  dependencies: ['tracked-controls', 'brush'],

  schema: {
    hand: {default: 'left'}
  },

  init: function () {
    var el = this.el;
    var self = this;
    // var highLightTextureUrl = 'assets/images/controller-pressed.png';
    // el.sceneEl.systems.material.loadTexture(highLightTextureUrl, {src: highLightTextureUrl}, createTexture);
    // el.setAttribute('json-model', {src: 'assets/models/controller.json'});
    // this.onButtonChanged = this.onButtonChanged.bind(this);
    // this.onButtonDown = function (evt) { self.onButtonEvent(evt.detail.id, 'down'); };
    // this.onButtonUp = function (evt) { self.onButtonEvent(evt.detail.id, 'up'); };
    // this.onModelLoaded = this.onModelLoaded.bind(this);
    // function createTexture (texture) {
    //   var material = self.highLightMaterial = new THREE.MeshBasicMaterial();
    //   material.map = texture;
    //   material.needsUpdate = true;
    // }
    el.addEventListener('brushsize-changed', function (evt) { self.changeBrushSize(evt.detail.size); });
    el.addEventListener('brushcolor-changed', function (evt) { self.changeBrushColor(evt.detail.color); });

    this.numberStrokes = 0;

    document.addEventListener('stroke-started', function (event) {
      netLog("stroke-started Listener", simpleStringify(event) )
      if (event.detail.entity.components['paint-controls'] !== self) { return; }

      self.numberStrokes++;

      // 3 Strokes to hide
      if (self.numberStrokes === 3) {
        var object = { alpha: 1.0 };
        var tween = new AFRAME.TWEEN.Tween(object)
          .to({alpha: 0.0}, 4000)
          .onComplete(function () {
            self.buttonMeshes.tooltips.forEach(function (tooltip) {
              tooltip.visible = false;
            });
          })
          .delay(2000)
          .onUpdate(function () {
            self.buttonMeshes.tooltips[0].material.opacity = object.alpha;
          });
        tween.start();
      }
    });
  },

  changeBrushColor: function (color) {
    this.buttonMeshes.colorTip.material.color.copy(color);
    this.buttonMeshes.sizeHint.material.color.copy(color);
  },

  changeBrushSize: function (size) {
    var scale = size / 2 * 10;
    this.buttonMeshes.sizeHint.scale.set(scale, scale, 1);
  },

  // buttonId
  // 0 - trackpad
  // 1 - trigger ( intensity value from 0.5 to 1 )
  // 2 - grip
  // 3 - menu ( dispatch but better for menu options )
  // 4 - system ( never dispatched on this layer )
  mapping: {
    axis0: 'trackpad',
    axis1: 'trackpad',
    button0: 'trackpad',
    button1: 'trigger',
    button2: 'grip',
    button3: 'menu',
    button4: 'system'
  },

  update: function () {
    var data = this.data;
    var el = this.el;
    // handId: 0 - right, 1 - left
    var controller = data.hand === 'right' ? 0 : 1;
    // in 0.4.0 the id is no longer 'OpenVR Gamepad' by default
    el.setAttribute('tracked-controls', 'id', 'OpenVR Gamepad');
    el.setAttribute('tracked-controls', 'controller', controller);
  },

  play: function () {
    var el = this.el;
    el.addEventListener('buttonchanged', this.onButtonChanged);
    el.addEventListener('buttondown', this.onButtonDown);
    el.addEventListener('buttonup', this.onButtonUp);
    el.addEventListener('model-loaded', this.onModelLoaded);
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('buttonchanged', this.onButtonChanged);
    el.removeEventListener('buttondown', this.onButtonDown);
    el.removeEventListener('buttonup', this.onButtonUp);
    el.removeEventListener('model-loaded', this.onModelLoaded);
  },

  onButtonChanged: function (evt) {
    var button = this.mapping['button' + evt.detail.id];
    var value;
    if (button !== 'trigger' || !this.buttonMeshes) { return; }
    value = evt.detail.state.value;
    this.buttonMeshes.trigger.rotation.x = -value * (Math.PI / 12);
    this.el.emit(button + 'changed', {value: value});
  },

  onModelLoaded: function (evt) {
    var controllerObject3D = evt.detail.model;
    var buttonMeshes;
    if (evt.detail.target !== this.el) { return; }
    buttonMeshes = this.buttonMeshes = {};
    buttonMeshes.grip = {
      left: controllerObject3D.getObjectByName('leftgrip'),
      right: controllerObject3D.getObjectByName('rightgrip')
    };
    buttonMeshes.menu = controllerObject3D.getObjectByName('menubutton');
    buttonMeshes.system = controllerObject3D.getObjectByName('systembutton');
    buttonMeshes.trackpad = controllerObject3D.getObjectByName('touchpad');
    buttonMeshes.trigger = controllerObject3D.getObjectByName('trigger');
    buttonMeshes.sizeHint = controllerObject3D.getObjectByName('sizehint');
    buttonMeshes.colorTip = controllerObject3D.getObjectByName('tip');
    buttonMeshes.tooltips = [
      controllerObject3D.getObjectByName('msg_leftgrip'),
      controllerObject3D.getObjectByName('msg_rightgrip'),
      controllerObject3D.getObjectByName('msg_menu'),
      controllerObject3D.getObjectByName('msg_touchpad'),
      controllerObject3D.getObjectByName('msg_trigger')
    ];
    this.changeBrushSize(this.el.components.brush.data.size);
    this.changeBrushColor(this.el.components.brush.color);
  },

  onButtonEvent: function (id, evtName) {
    var buttonName = this.mapping['button' + id];
    this.el.emit(buttonName + evtName);
    this.updateModel(buttonName, evtName);
  },

  updateModel: function (buttonName, state) {
    var material = state === 'up' ? this.material : this.highLightMaterial;
    var buttonMeshes = this.buttonMeshes;
    var button = buttonMeshes && buttonMeshes[buttonName];
    if (state === 'down' && button && !this.material) {
      material = this.material = button.material;
    }
    if (!material) { return; }
    if (buttonName === 'grip') {
      buttonMeshes.grip.left.material = material;
      buttonMeshes.grip.right.material = material;
      return;
    }
    if (!button) { return; }
    button.material = material;
  }
});


class VRScene04 extends Component {
  componentDidMount(){

    netLog("AFRAME SYSTEMS", simpleStringify( AFRAME.systems ))

    const box1 = document.getElementById('box1')
    const box2 = document.getElementById('box2')
    const remote = document.getElementById('remote')


    box2.addEventListener('raycaster-intersected', function(){
      // box2.setAttribute('material', {color: "pink"})
      // document.location.reload();
    })
    box1.addEventListener('buttondown', function(){
      netLog("box1 button down pressed");
      netLog("box1 button down pressed");
      box1.setAttribute('material', {color: "green"})
      // document.location.reload();
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
          <a-camera id="camera">
          </a-camera>
          <a-entity position="-0.2 2.0 0">
            <a-entity id="remote"  daydream-controller brush paint-controls raycaster="objects: .selectable">
              <a-cone id="ray" color="cyan" position="0 0 -2" rotation="-90 0 0" radius-bottom="0.005" radius-top="0.001" height="4"></a-cone>
              <a-box id="position-guide" visible="false" position="0 0 -2"></a-box>
            </a-entity>
          </a-entity>
          <a-sphere position="0 0 0" material="color: red; shader:flat" radius="15"></a-sphere>
          <a-box id="box1" scale="10 4 4" class="selectable" material="color:orange; shader: flat" position="0 2 -4"></a-box>
          <a-box id="box2" class="selectable" scale="10 4 4" material="color:green; shader: flat" position="0 2 10"></a-box>

          <a-sky color="blue"></a-sky>
        </a-scene>
      </div>
    );
  }
}



export default VRScene04;


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
