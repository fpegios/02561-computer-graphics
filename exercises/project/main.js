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
    mvMatrix = [];
    pMatrix = [];
}

function initBuffers() {
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

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function setMatrixUniforms(i) {
    gl.uniformMatrix4fv(program.pMatrixUniform, false, flatten(pMatrix));
    gl.uniformMatrix4fv(program.mvMatrixUniform, false, flatten(mvMatrix[i]));
}

function getColorBuffer(colors) {
    // init goalpost colorBuffer
    var goalPostColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, goalPostColorBuffer);
    var unpackedColors = [];
    
    for (var i in colors) {
        var color = colors[i];
        //assign colors for each vertex of each face based on the packed representation above
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    goalPostColorBuffer.itemSize = 4;
    goalPostColorBuffer.numItems = 24;

    return goalPostColorBuffer;
}

function drawGoalPost() {
    var goalPostZ = -30;
    var goalPostWidth = 35;
    var crossbarScaleWidth = 0.75;
    var crossbarScaleHeight = 8;

    var colors = [
        [1.0, 1.0, 1.0, 1.0], // Front face
        [1.0, 1.0, 1.0, 1.0], // Back face
        [1.0, 1.0, 1.0, 1.0], // Top face
        [1.0, 1.0, 1.5, 1.0], // Bottom face
        [1.0, 1.0, 1.0, 1.0], // Right face
        [1.0, 1.0, 1.0, 1.0]  // Left face
    ];

    var goalPostColorBuffer = getColorBuffer(colors);    

    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    // we bind the buffer for the cube vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, goalPostColorBuffer);
    gl.vertexAttribPointer(program.vertexColorAttribute, goalPostColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    /********************************************************************/

    // draw the three parts of a goalpost (left, right, top)
    mvMatrix[0] = translate([0.0, 0.0, -20.0]);
    mvMatrix[0] = mult(mvMatrix[0], translate([-goalPostWidth / 2, 0, goalPostZ]));
    mvMatrix[0] = mult(mvMatrix[0], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    mvMatrix[0] = mult(mvMatrix[0], rotate(0, [1, 1, 1]));
    setMatrixUniforms(0);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[1] = translate([0.0, 0.0, -20.0]);
    mvMatrix[1] = mult(mvMatrix[1], translate([goalPostWidth / 2, 0, goalPostZ]));
    mvMatrix[1] = mult(mvMatrix[1], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    mvMatrix[1] = mult(mvMatrix[1], rotate(0, [1, 1, 1]));
    setMatrixUniforms(1);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[2] = translate([0.0, 0.0, -20.0]);
    mvMatrix[2] = mult(mvMatrix[2], translate([0, crossbarScaleHeight - 0.75, goalPostZ]));
    mvMatrix[2] = mult(mvMatrix[2], scalem([goalPostWidth / 2, crossbarScaleWidth, 0.25]));
    mvMatrix[2] = mult(mvMatrix[2], rotate(0, [1, 1, 1]));
    setMatrixUniforms(2);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function render() {
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mvMatrix = mat4();
    
    drawGoalPost();
}

function tick() {
    degree++;
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
    program.vertexPositionAttribute = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);
    program.vertexColorAttribute = gl.getAttribLocation(program, "color");
    gl.enableVertexAttribArray(program.vertexColorAttribute);
    program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");

    initBuffers();
    tick();
}