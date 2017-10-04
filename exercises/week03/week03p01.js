// Initialize WebGL
function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

// Creates a program from a vertex + fragment shader pair
function initShaders2() {
    gl.useProgram( program );
    
    // Vertex position data
    program.vertexPositionAttribute = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    // Vertex color data
    program.vertexColorAttribute = gl.getAttribLocation(program, "color");
    gl.enableVertexAttribArray(program.vertexColorAttribute);

    // Update uniform variables
    // this variables can be accessed from both the vertex and fragment shader
    program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
}

//Initialize VBOs, IBOs and color
function initBuffers() {
    //Vertex Buffer Object
    cubeVertexPositionBuffer = gl.createBuffer();

    //Bind buffer to ARRAY_BUFFER
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

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
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

    //Color
    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);

    colors = [
        [1.0, 1.0, 1.0, 1.0], // Front face
        [1.0, 1.0, 1.0, 1.0], // Back face
        [1.0, 1.0, 1.0, 1.0], // Top face
        [1.0, 1.0, 1.0, 1.0], // Bottom face
        [1.0, 1.0, 1.0, 1.0], // Right face
        [1.0, 1.0, 1.0, 1.0]  // Left face
    ];

    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        //assign colors for each vertex of each face based on the packed representation above
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);

    //every color has 4 values: red, green, blue and alpha (transparency: use 1.0 (opaque) for this demo)
    cubeVertexColorBuffer.itemSize = 4;

    //24 color values (we have 24 vertices to color...)
    cubeVertexColorBuffer.numItems = 24;

    //Index Buffer Object
    //it joins sets of vertices into faces
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

    var cubeVertexIndices = [
    //this numbers are positions in the VBO array above
        0, 1, 2,      1, 2, 3,    // Front face
        4, 5, 6,      5, 6, 7,    // Back face
        8, 9, 10,     9, 10, 11,  // Top face
        12, 13, 14,   13, 14, 15, // Bottom face
        16, 17, 18,   17, 18, 19, // Right face
        20, 21, 22,   21, 22, 23  // Left face
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

    //we have one item - the cube
    cubeVertexIndexBuffer.itemSize = 1;

    //we have 36 indices (6 faces, every face has 2 triangles, each triangle 3 vertices: 2x3x6=36)
    cubeVertexIndexBuffer.numItems = 36;
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

//Sets + Updates matrix uniforms
function setMatrixUniforms() {
    gl.uniformMatrix4fv(program.pMatrixUniform, false, flatten(pMatrix));
    gl.uniformMatrix4fv(program.mvMatrixUniform, false, flatten(mvMatrix));
}

function render() {
    // the projection matrix (pMatrix) is set
    // 45 degrees Field-Of-View
    // aspect ratio gl.viewportWidth / gl.viewportHeight
    // near plane: 0.1 , far plane: 100
    // pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    pMatrix = ortho(-5, 5, -5, 5, 0.1, 100.0);

    // the modelview Matrix is initialized with the Identity Matrix
    mvMatrix = mat4();

    // the ModelView matrix gets a global transformation ("camera" retracts 8 units)
    // otherwise the "camera" will be inside the rotating cube
    // z-axis points out of the screen. we translate -8 which is the inverse transform
    // in essence we move the world -8 units to have the camera 8 units forward.
    // REMEMBER there is no actual camera in WebGL
    mvMatrix = translate([0.0, 0.0, -8.0]);

    //a rotation connected with animation parameters
    mvMatrix = mult(mvMatrix, rotate(15, [1, 1, 0]));

    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    // we bind the buffer for the cube vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // we bind the buffer for the cube colors
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    gl.vertexAttribPointer(program.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // we bind the buffer for the cube vertex indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    /********************************************************************/

    // we update the uniforms for the shaders
    setMatrixUniforms();

    // we call the Draw Call of WebGL to draw the cube
    // Triangles mode
    gl.drawElements(gl.LINES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function tick() {
    degree += 0.50;
    initViewport()
    render();
    requestAnimFrame(tick);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    initGL();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    initShaders2();
    initBuffers();

    //ModelView and Projection matrices
	//mat4 comes from the external library
    mvMatrix = [];
    pMatrix = [];

    degree = 0;
    tick();
}