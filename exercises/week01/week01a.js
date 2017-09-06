

function initGL() {
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn’t available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initShaders() {
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram(program);
}sd

function initBuffers() {
    var cubePositionBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    // every item has 3 coordinates (x,y,z)
    cubePositionBuffer.itemSize = 3;
    // we have 4 vertices
    cubePositionBuffer.numItems = 4;

    var cubeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    colors = [
        [0.0, 0.0, 0.0, 1.0] // Front face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        // assign colors for each vertex of each face based on the packed representation above
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    // every color has 4 values: red, green, blue and alpha (transparency: use 1.0 (opaque) for this demo)
    cubeColorBuffer.itemSize = 4;
    // 4 color values (we have 24 vertices to color...)
    cubeColorBuffer.numItems = 4;
}

function render() {

    // Get the storage location of attribute variable
    var vPosition = gl.getAttribLocation(gl.program, 'vPosition');
    if (vPosition < 0) {
        console.log('Failed to get the storage location of vPosition');
    return;
    
    // Pass vertex position to attribute variable
    gl.vertexAttrib3f(vPosition, 0.0, 0.0, 0.0);
    // Background Color: Color assigned for all pixels with no corresponding fragments
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    //Enable z-buffer for depth sorting
    gl.enable(gl.DEPTH_TEST);
    // Draw a point
    gl.drawArrays(gl.POINTS, 0, 1);

}

function tick() {
    requestAnimFrame(tick);
    render();
}

function webGLStart() {
    canvas = document.getElementById("gl-canvas");

    // Init functions
    initGL(canvas);
    initBuffers();

    

    // the first tick of our application
    tick();
}

