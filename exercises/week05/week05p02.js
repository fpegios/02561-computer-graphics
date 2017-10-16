var gl;
var program;

var Le = vec4(1.0, 1.0, 1.0, 0.0 );
var La = vec4(0.2, 0.2, 0.2, 1.0 );
var Ld = vec4( 1.0, 1.0, 1.0, 1.0 );
var Ls = vec4( 1.0, 1.0, 1.0, 1.0 );

var ka = vec4( 0.0, 0.0, 0.0, 1.0 );
var ks = vec4( 0.0, 0.0, 0.0, 1.0 );
var a = 20.0;

function WebGLStart() { 

    // Retrieve <canvas> element
    var canvas = document.getElementById('gl-canvas');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    ambientProduct = mult(La, ka);
    specularProduct = mult(Ls, ks);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(Le) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), a );
    
    // Get the storage locations of attribute and uniform variables
    a_Position = gl.getAttribLocation(program, 'a_Position');
    a_Normal = gl.getAttribLocation(program, 'a_Normal');
    a_Color = gl.getAttribLocation(program, 'a_Color');
    u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    u_vMatrix = gl.getUniformLocation(program, 'u_vMatrix');
    u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

    if (a_Position < 0 ||  a_Normal < 0 || a_Color < 0 ||
        !u_MvpMatrix || !u_NormalMatrix) {
      console.log('attribute, uniform変数の格納場所の取得に失敗'); 
      return;
    }

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers();
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }

    // define projection and view matrices
    var projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 5000.0);
    var eye = [0.0, 500.0, 200.0];
    var at = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var viewMatrix = lookAt(eye, at, up);
    
    // calculate viewProjection Matrix
    var viewProjMatrix = mult(projectionMatrix, viewMatrix);

    // Start reading the OBJ file
    readOBJFile('/objects/teapot.obj', model, 60, true);
    
    var tick = function() {   // Start drawing
        render(viewMatrix, viewProjMatrix, model);
        requestAnimationFrame(tick);
      };
    tick();
}

// Create an buffer object and perform an initial configuration
function initVertexBuffers() {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(a_Position, 3, gl.FLOAT); 
    o.normalBuffer = createEmptyArrayBuffer(a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
  
    return buffer;
}

// Read a file
function readOBJFile(fileName, model, scale, reverse) {
    var request = new XMLHttpRequest();
  
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(request.responseText, fileName, model, scale, reverse);
      }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
}

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function onReadOBJFile(fileString, fileName, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      g_objDoc = null; 
      g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    g_objDoc = objDoc;
}

// Coordinate transformation matrix
var g_modelMatrix = mat4();
var g_mvpMatrix = mat4();
var g_normalMatrix = [];

// render function
function render(viewMatrix, viewProjMatrix, model) {
    if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(model, g_objDoc);
        g_objDoc = null;
    }

    if (!g_drawingInfo) return;   // モデルを読み込み済みか判定

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    // rotate the object
    g_modelMatrix = mult(g_modelMatrix, rotate(1, [0, 1, 0]));

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix = [
        vec3(g_modelMatrix[0][0], g_modelMatrix[0][1], g_modelMatrix[0][2]),
        vec3(g_modelMatrix[1][0], g_modelMatrix[1][1], g_modelMatrix[1][2]),
        vec3(g_modelMatrix[2][0], g_modelMatrix[2][1], g_modelMatrix[2][2])
    ];

    gl.uniformMatrix3fv(u_NormalMatrix, false, flatten(g_normalMatrix));

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix = viewProjMatrix;
    g_mvpMatrix = mult(g_mvpMatrix, g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, flatten(g_mvpMatrix));

    gl.uniformMatrix4fv(u_vMatrix, false, flatten(viewMatrix));

    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

// OBJ File has been read compreatly
function onReadComplete(model, objDoc) {
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
  
    return drawingInfo;
}