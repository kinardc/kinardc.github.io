/*
triangle.js
Erik Fredericks, c/o Ed Angel

This file does the actual drawing of the triangle
*/

// Global variables we'll need
var gl;
var points;

KEYCODE = {
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40
}

POSITION = {
  x: 0.0, y: 0.0,
  location: { x: undefined, y: undefined },
  direction: { x: 1.0, y: 1.0 }
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// This function executes our WebGL code AFTER the window is loaded.
// Meaning, that we wait for our canvas element to exist.
window.onload = function init() {
  // Grab the canvas object and initialize it
  var canvas = document.getElementById('gl-canvas');
  gl = WebGLUtils.setupWebGL(canvas);

  // Error checking
  if (!gl) { alert('WebGL unavailable'); }

  // triangle vertices
  var vertices = [
    vec2(-0.25, -0.25),
    vec2(0, 0.25),
    vec2(0.25, -0.25)
  ];

  // configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  // load shaders and initialize attribute buffers
  var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  // linking position variables to shader attributes
  POSITION.location.x = gl.getUniformLocation(program, "x");
  POSITION.location.y = gl.getUniformLocation(program, "y");

  // load data into GPU
  var bufferID = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  // set its position and render it
  var vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  render();
};

// Render whatever is in our gl variable
function render() {
  POSITION.x += 0.05 * POSITION.direction.x;
  POSITION.y += 0.1 * POSITION.direction.x;

  // x and y exist within range [-1, 1]
  if (POSITION.y > 0.9) {   // top hit -- reverse y but keep x
    POSITION.y = 0.9;
    POSITION.direction.y *= -1.0
  }
  if (POSITION.x > 0.9) {   // right hit -- reverse x but keep y
    POSITION.x = 0.9;
    POSITION.direction.x *= -1.0
  }
  if (POSITION.y < -0.9) {  // bottom hit -- reverse y but keep x
    POSITION.y = -0.9;
    POSITION.direction.y *= -1.0
  }
  if (POSITION.x < -0.9) {  // left hit -- reverse x but keep y
    POSITION.x = -0.9;
    POSITION.direction.x *= -1.0
  }

  // send x,y to gl
  gl.uniform1f(POSITION.location.x, POSITION.x);
  gl.uniform1f(POSITION.location.y, POSITION.y);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.requestAnimationFrame(render);
}
