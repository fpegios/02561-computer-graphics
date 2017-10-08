"use strict";

var canvas;
var gl;

var numTimesToSubdivide = 0;

var index = 0;

var pointsArray = [];


var near = -10;
var far = 10;
var radius = 6.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var program;
var va;
var vb;
var vc;
var vd;
var vBuffer;
var vPosition;

function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initViewport() {
    // Clear the canvas
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    
    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // the frame and depth buffers get cleaned (the depth buffer is used for sorting fragments)
    // without the depth buffer WebGL does not know which fragment is visible for a given pixel
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    index += 3;
}

function divideTriangle(a, b, c, count) {
   if ( count > 0 ) {

       var ab = normalize(mix( a, b, 0.5), true);
       var ac = normalize(mix( a, c, 0.5), true);
       var bc = normalize(mix( b, c, 0.5), true);

       divideTriangle( a, ab, ac, count - 1 );
       divideTriangle( ab, b, bc, count - 1 );
       divideTriangle( bc, c, ac, count - 1 );
       divideTriangle( ab, bc, ac, count - 1 );
   }
   else { // draw tetrahedron at end of recursion
       triangle( a, b, c );
   }
}

function tetrahedron(a, b, c, d, n) {
   divideTriangle(a, b, c, n);
   divideTriangle(d, c, b, n);
   divideTriangle(a, d, b, n);
   divideTriangle(a, c, d, n);
}

function initBuffers() {
    va = vec4(0.0, 0.0, -1.0, 1);
    vb = vec4(0.0, 0.942809, 0.333333, 1);
    vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
}

function render() {
    // the projection matrix (pMatrix) is set
    // 45 degrees Field-Of-View
    // aspect ratio gl.viewportWidth / gl.viewportHeight
    // near plane: 0.1 , far plane: 100
    projectionMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    modelViewMatrix = translate([0.0, 0.0, -5.0]);
    setMatrixUniforms();

    for( var i = 0; i < index; i += 3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );  
    }
}

function tick() {
    initViewport()
    render();
    requestAnimFrame(tick);
}

function WebGLStart() {
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );
    initGL();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    initBuffers();
    
    tick();
    document.getElementById("Button4").onclick = function(){
        numTimesToSubdivide++;
        index = 0;
        pointsArray = [];
        initBuffers();
    };
    document.getElementById("Button5").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        pointsArray = [];
        initBuffers();
    };
}