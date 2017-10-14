// Initialize WebGL
function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {
    g_objDoc = null;      // The information of OBJ file
    g_drawingInfo = null; // The information for drawing 3D model
    degree = 0;

    // Coordinate transformation matrix
    g_projectionMatrix = mat4();
    g_viewMatrix = mat4();
    g_modelMatrix = mat4();    
    g_normalMatrix = mat4();
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    initGL();
    initVariables();
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );

    // Set the clear color and enable the depth test
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram( program );
    // Get the storage locations of attribute and uniform variables
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
    program.u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
    program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, program);
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }
    
    // Start reading the OBJ file
    readOBJFile('/objects/teapot.obj', gl, model, 60, true);

    // Calculate Projection and Model View Matrix
    g_projectionMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    g_viewMatrix = translate([0.0, 0.0, -5.0]);

    var tick = function() {   // Start drawing
        degree++;
        draw(gl, gl.program, degree, g_projectionMatrix, g_viewMatrix, model);
        requestAnimationFrame(tick, canvas);
      };
    tick();
}

// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    console.log(model);
    return drawingInfo;
}

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      g_objDoc = null; g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    g_objDoc = objDoc;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
  
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
      }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

    return buffer;
}

// Create an buffer object and perform an initial configuration
function initVertexBuffers(gl, program) {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT); 
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { 
        return null; 
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function draw(gl, program, degree, g_projectionMatrix, g_viewMatrix, model) {
    if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        g_objDoc = null;
    }
    if (!g_drawingInfo) return;   // ãƒ¢ãƒ‡ãƒ«ã‚’èª­ã¿è¾¼ã¿æ¸ˆã¿ã‹åˆ¤å®š

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    g_modelMatrix = mult(g_modelMatrix, rotate(degree, [1, 1, 1]));

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix = inverse(g_modelMatrix);
    g_normalMatrix = transpose(g_normalMatrix);
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix);

    //pass it to u_PMatrix and u_MVMatrix
    
    gl.uniformMatrix4fv(program.u_ProjectionMatrix, false, flatten(g_projectionMatrix));
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, flatten(g_viewMatrix));
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, flatten(g_modelMatrix));

    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}