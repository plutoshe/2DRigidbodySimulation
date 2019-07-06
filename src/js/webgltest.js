/* eslint no-console:0 consistent-return:0 */
"use strict";

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  console.log(fragmentShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function main() {
  // Get A WebGL context
  var canvas = document.getElementById("c");
  //var gl = canvas.getContext("webgl");
  var gl = canvas.getContext("webgl", {stencil:true});
  if (!gl) {
    return;
  }

  // Get the strings for our GLSL shaders
  var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
  var fragmentShaderSource = document.getElementById("2d-fragment-shader").text;

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  console.log(fragmentShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var particleIndexAttributeLocation = gl.getAttribLocation(program, "particleIndex");
  var pointSizeUniformLocation = gl.getUniformLocation(program, "tmpParticleSize");

  // Create a buffer and put three 2d clip space points in it
  var positionBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  var positions = [
    0, 0,
    0, 1,
    1, 0,
  ];
  var positions1 = [0,0,0,0,0,0,0,0,0,0,0,0];
  var index = [0,1,2,3];
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions1), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(index), gl.STATIC_DRAW);
  
  // code above this line is initialization code.
  // code below this line is rendering code.

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);
  gl.uniform1f(pointSizeUniformLocation, 100.0);
  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);
  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  gl.enableVertexAttribArray(particleIndexAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.vertexAttribPointer(
      particleIndexAttributeLocation, 1, type, normalize, stride, offset);



  // draw
  var primitiveType = gl.points;
  var offset = 0;
  var count = 4;
  gl.clearColor(0,0,1,1);
  console.log(gl.getParameter(gl.COLOR_CLEAR_VALUE));
  gl.clear(gl.COLOR_BUFFER_BIT);
  

  //gl.enable(gl.BLEND);
  //gl.enable(gl.COLOR_TABLE);
  //gl.clearColor(0,0,0,0);

  gl.enable(gl.STENCIL_TEST);
  gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
  gl.stencilFunc(gl.EQUAL, 0, 0xff);
  gl.stencilMask(0xFF);        
  ///gl.clear(gl.STENCIL_BUFFER_BIT);
  gl.uniform1f(pointSizeUniformLocation, 600.0);
  gl.drawArrays(primitiveType, offset, count);


  gl.clearStencil(0);
  gl.clear(gl.STENCIL_BUFFER_BIT);
  gl.colorMask(true, true, true, true);
  gl.depthMask(false);
// gl.disable(gl.DEPTH_TEST);
// gl.depthFunc(gl.GL_GEQUAL);

  gl.enable(gl.STENCIL_TEST);
// gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
// gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
  gl.stencilFunc(gl.EQUAL, 1, 0xff);
// gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
  gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
// gl.stencilMask(0xFF);        
// gl.clear(gl.STENCIL_BUFFER_BIT);

  gl.uniform1f(pointSizeUniformLocation, 300.0);
 gl.drawArrays(primitiveType, offset, count);
}

main();
