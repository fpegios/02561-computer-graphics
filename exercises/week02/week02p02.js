function clearCanvas() {
    vertices = [];
    started = false;
}

function setCanvasBgClr() {
    selectedClr = {
        red: r.getValue() / 255, 
        green: g.getValue() / 255, 
        blue: b.getValue() / 255
    };
}

function setPointClr() {
    pointClr = {
        red: r.getValue() / 255, 
        green: g.getValue() / 255, 
        blue: b.getValue() / 255
    };
}

function bindBuffer() {
    /*========== Defining and storing the geometry =======*/
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

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
    gl.enableVertexAttribArray(color)
}

function render() {
    /*============= Drawing the Scene ===============*/
    // Clear the canvas
    gl.clearColor( selectedClr.red, selectedClr.green, selectedClr.blue, 1.0 );
    
    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color buffer bit
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Draw the triangle
    if (started) {
        // Send theta to thetaLoc (thus to the Shader)
        gl.drawArrays(gl.POINTS, 0, vertices.length/3);
    }

    requestAnimFrame(pipeline);
}

function pipeline() {
    if (started) {
        bindBuffer();
        shaderToBuffer();
    }
    render();
}

function WebGLStart() {
    RGBChange = function() {
        $('#RGB').css('background', 'rgb('+r.getValue()+','+g.getValue()+','+b.getValue()+')')
    };
    
    r = $('#R').slider()
        .on('slide', RGBChange)
        .data('slider');
    g = $('#G').slider()
        .on('slide', RGBChange)
        .data('slider');
    b = $('#B').slider()
        .on('slide', RGBChange)
        .data('slider'); 
    
    // Set color for sample box            
    $('#RGB').css('background', 'rgb('+r.getValue()+','+g.getValue()+','+b.getValue()+')')
            
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }

    // Init canvas bg color
    setCanvasBgClr();

    pointClr = {
        red: 0, 
        green: 0, 
        blue: 0
    };

    // Vertices to draw
    vertices = [];
    // Vertices' colors
    colors = [];
    // New clicked vertex and color
    tempVert = [];
    // New clicked color
    tempColor= [];
    // After first click
    started = false;

    // Create an empty buffer object to store the vertex buffer
    vertex_buffer = gl.createBuffer();
    // Create an empty buffer object and store color data
    color_buffer = gl.createBuffer ();

    canvas.addEventListener("click", function() {
        if (!started) {
            started =  true;
        }
        started = true;
        tempVert = vec3(
            -1 + 2 * event.clientX / canvas.width, // x
            -1 + 2 * (canvas.height - event.clientY) / canvas.height, // y
            0.00 // z
        );
        tempColor = vec3(
            pointClr.red,
            pointClr.green,
            pointClr.blue
        );

        // Insert the clicked vertex on top in order to overwrite the behind possible vertex
        vertices = tempVert.concat(vertices);
        colors = tempColor.concat(colors);
    });

    /*========================= Shaders ========================*/
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    pipeline();
}