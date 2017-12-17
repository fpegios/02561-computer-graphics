function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {
    degree = 0;
    ballZ = 5;
    mvMatrix = [];
    pMatrix = [];

    // sphere
    index = 0;
    numTimesToSubdivide = 6;
    pointsArray = [];

    // goalPost
    goalPostZ = -90;
    goalPostWidth = 65;
    crossbarScaleWidth = 1.25;
    crossbarScaleHeight = 15;

    white = [1.0, 1.0, 1.0, 1.0];
    red =   [1.0, 0.0, 0.0, 1.0];
    blue =  [0.0, 0.0, 1.0, 1.0];
    green = [0.0, 1.0, 0.0, 1.0];
    black = [0.0, 0.0, 0.0, 1.0];
}



function initCubeBuffer() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom fac1
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face1
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    //every item has 3 coordinates (x,y,z)
    cubeVertexPositionBuffer.itemSize = 3;
    //we have 24 vertices
    cubeVertexPositionBuffer.numItems = 24;
    //Index Buffer Object
    //it joins sets of vertices into faces
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

    var cubeVertexIndices = [
    //this numbers are positions in the VBO array above
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

    //we have one item - the cube
    cubeVertexIndexBuffer.itemSize = 1;
    //we have 36 indices (6 faces, every face has 2 triangles, each triangle 3 vertices: 2x3x6=36)
    cubeVertexIndexBuffer.numItems = 36;
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

function initSphereBuffer() {
    va = vec4(0.0, 0.0, -1.0, 1);
    vb = vec4(0.0, 0.942809, 0.333333, 1);
    vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    vd = vec4(0.816497, -0.471405, 0.333333, 1);
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    sphereVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
}

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function setMatrixUniforms(i, color) {
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix[i]));
    gl.uniform4fv(colorLoc, color);
}

function drawGoalPost(camera) {
    

    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(vPosition, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    /********************************************************************/

    // draw the three parts of a goalpost (left, right, top)
    mvMatrix[0] = camera;
    mvMatrix[0] = mult(mvMatrix[0], translate([-goalPostWidth / 2, 0, goalPostZ]));
    mvMatrix[0] = mult(mvMatrix[0], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    mvMatrix[0] = mult(mvMatrix[0], rotate(0, [1, 1, 1]));
    setMatrixUniforms(0, white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[1] = camera;
    mvMatrix[1] = mult(mvMatrix[1], translate([goalPostWidth / 2, 0, goalPostZ]));
    mvMatrix[1] = mult(mvMatrix[1], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    mvMatrix[1] = mult(mvMatrix[1], rotate(0, [1, 1, 1]));
    setMatrixUniforms(1, white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[2] = camera;
    mvMatrix[2] = mult(mvMatrix[2], translate([0, crossbarScaleHeight - 1.25, goalPostZ]));
    mvMatrix[2] = mult(mvMatrix[2], scalem([goalPostWidth / 2, crossbarScaleWidth, 0.25]));
    mvMatrix[2] = mult(mvMatrix[2], rotate(0, [1, 1, 1]));
    setMatrixUniforms(2, white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawBall(camera) {
    mvMatrix[3] = camera;
    mvMatrix[3] = mult(mvMatrix[3], translate([0, 0, ballZ]));
    mvMatrix[3] = mult(mvMatrix[3], scalem([0.75, 0.75, 0.75]));

    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    /************************************************/

    setMatrixUniforms(3, white);
    for( var i = 0; i < index; i += 3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );  
    }
}

function render() {
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 150.0);
    var camera = translate([0.0, -5.0, -20.0]);
    
    drawBall(camera);
    drawGoalPost(camera);    
}

function tick() {
    if (ballZ >= goalPostZ) {
        // ballZ -= 0.5;
    } else {
        // alert("GOAL!");
    }
    
    initViewport()
    render();
    requestAnimFrame(tick);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );
    initGL();
    initVariables();
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    vPosition = gl.getAttribLocation( program, "vPosition");

    // make the necessary correspondence
    pMatrixLoc = gl.getUniformLocation(program, "uPMatrix");
    mvMatrixLoc = gl.getUniformLocation(program, "uMVMatrix");
    colorLoc = gl.getUniformLocation( program, "color" );

    initSphereBuffer();
    initCubeBuffer();
    
    tick();
}