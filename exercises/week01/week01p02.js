function bindBuffer() {
    // Bind appropriate array buffer to it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Pass the vertex data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    // Unbind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function shaderToBuffer() {

    /*======== Associating shaders to buffer objects ========*/

    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    
    // Get the attribute location
    vPosition = gl.getAttribLocation( program, "vPosition" );
    
    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // Enable the attribute
    gl.enableVertexAttribArray(vPosition);
}

function render() {

    /*============= Drawing the Scene ===============*/

    // Clear the canvas
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    
    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color buffer bit
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Draw the triangle
    gl.drawArrays(gl.POINTS, 0, 3);
}

function WebGLStart() {
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }

    /*========== Defining and storing the geometry =======*/
    vertices = [
        0.00, 0.00, 0.00,
        1.00, 0.00, 0.00,
        1.00, 1.00, 0.00
    ];

    // Create an empty buffer object to store the vertex buffer
    vertex_buffer = gl.createBuffer();

    /*========================= Shaders ========================*/
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    bindBuffer();
    shaderToBuffer();
    render(); 
}