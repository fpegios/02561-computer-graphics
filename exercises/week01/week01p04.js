function bindBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
    
function shaderToBuffer() {
    /*======== Associating shaders to buffer objects ========*/
    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Bind index buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
    
    // Get the attribute location
    vPosition = gl.getAttribLocation( program, "vPosition" );
    
    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // Enable the attribute
    gl.enableVertexAttribArray(vPosition);

    // bind the color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    
    // get the attribute location
    color = gl.getAttribLocation(program, "color");

    // point attribute to the color buffer object
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false,0,0) ;

    // enable the color attribute
    gl.enableVertexAttribArray(color)
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
    
    // Increase angle to rotate the square
    theta += 0.01;
    
    // Send theta to thetaLoc (thus to the Shader)
    gl.uniform1f(thetaLoc, theta);

    // Draw the triangle
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
    
    // requestAnimFrame method tells the browser that you wish to perform 
    // an animation and requests that the browser call a specified function 
    // to update an animation before the next repaint
    requestAnimFrame(render);
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
        -0.50,  0.50, 0.00,
         0.50,  0.50, 0.00,
         0.50, -0.50, 0.00,
        -0.50, -0.50, 0.00
    ];

    colors = [
        1, 1, 1, 
        1, 1, 1, 
        1, 1, 1,
        1, 1, 1
    ];

    indices = [
        0, 1, 2,
        0, 2, 3
    ];

    theta = 0.0;

    // Create an empty buffer object to store the vertex buffer
    vertex_buffer = gl.createBuffer();
    // Create an empty buffer object and store Index data
    index_Buffer = gl.createBuffer();
    // Create an empty buffer object and store color data
    color_buffer = gl.createBuffer ();
    
    /*========================= Shaders ========================*/
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // make the necessary correspondence of thetaLoc with theta
    thetaLoc = gl.getUniformLocation( program, "theta" );

    bindBuffer();
    shaderToBuffer();
    render(); 
}