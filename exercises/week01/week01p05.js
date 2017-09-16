function bindBuffer() {
    // Create a vertex for each degree [0, 360)
    for (var i = 0.0; i < 360; i++) {

        // Convert the degrees to radians
        var j = radians(i);

        // Create a temporary vertex for the current degree
        var tempVertex = [
            Math.sin(j) / 2, Math.cos(j) / 2, 0.0
        ];

        // Create temporary color array for the current vertex
        var tempColor = [
            1, 1, 1
        ];
        
        // Concatenate vertex and color buffer to vertices and colors
        vertices = vertices.concat(tempVertex);
        colors = colors.concat(tempColor);
    }

    // Create an empty buffer object to store the vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create an empty buffer object and store color data
    color_buffer = gl.createBuffer ();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
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

    // bind the color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    
    // get the attribute location
    color = gl.getAttribLocation(program, "color");

    // point attribute to the color buffer object
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false,0,0) ;

    // enable the color attribute
    gl.enableVertexAttribArray(color);
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
    theta += 0.05;
    
    // Send theta to thetaLoc (thus to the Shader)
    gl.uniform1f(thetaLoc, theta);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);
    
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
    theta = 0.0;
    vertices = [];
    colors = [];

    // Create an empty buffer object to store the vertex buffer
    vertex_buffer = gl.createBuffer();

    /*========================= Shaders ========================*/
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // make the necessary correspondence of thetaLoc with theta
    thetaLoc = gl.getUniformLocation( program, "theta" );

    bindBuffer();
    shaderToBuffer();
    render();
}