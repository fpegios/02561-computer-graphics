earthImage = document.createElement('img');
earthImage.crossorigin = 'anonymous';
earthImage.onload = WebGLStart;
earthImage.src = 'earth.jpg';

function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);

    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function generateTetrahedron (subdivs) {
    var a = vec3(0.0, 0.0, -1.0);
    var b = vec3(0.0, 0.942809, 0.333333);
    var c = vec3(-0.816497, -0.471405, 0.333333);
    var d = vec3(0.816497, -0.471405, 0.333333);

    var points = [];

    divideTriangle(points, subdivs, a, b, c);
    divideTriangle(points, subdivs, d, c, b);
    divideTriangle(points, subdivs, a, d, b);
    divideTriangle(points, subdivs, a, c, d);

    return points;
}

function divideTriangle (points, subdivs, a, b, c) {
    if (subdivs > 0) {
      var ab = normalize(mix(a, b, 0.5));
      var ac = normalize(mix(a, c, 0.5));
      var bc = normalize(mix(b, c, 0.5));
  
      subdivs -= 1;
      divideTriangle(points, subdivs, a, ab, ac);
      divideTriangle(points, subdivs, ab, b, bc);
      divideTriangle(points, subdivs, bc, c, ac);
      divideTriangle(points, subdivs, ab, bc, ac);
    } else {
      points.push(a);
      points.push(b);
      points.push(c);
    }
  }


  function initVariables() {
    light = vec3(0, 2, 2);
    at = vec3(0, 0, 0);
    eye = vec3(0, 1, 2);
    up = vec3(0, 1, 0);
    fovy = 65;
    aspect = canvas.width / canvas.height;
    near = 0.1;
    far = 30;
    phi = 0;

    viewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    tetrahedron = generateTetrahedron(6);

    positions = [].concat(tetrahedron);
}

function matrixVectorMult(A, x) {
    var Ax = [];
    for (var i = 0; i < x.length; i++) {
        var sum = 0;
        for (var j = 0; j < x.length; j++) {
            sum += A[j][i] * x[i];
        }
        Ax.push(sum);
    }
    // AND MY
    return Ax;
}

function setupShaderAndBuffer() {
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram(program);
    programInfo = {
        a_position_model: {
            location: gl.getAttribLocation(program, 'a_position_model'),
            buffer: gl.createBuffer()
        },
        u_mvp: gl.getUniformLocation(program, 'u_mvp'),
        u_texture: gl.getUniformLocation(program, 'u_texture'),
        u_eye_camera: gl.getUniformLocation(program, 'u_eye_camera'),
        u_light_camera: gl.getUniformLocation(program, 'u_light_camera')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, earthImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(programInfo.u_texture, 0);
    gl.uniform3fv(programInfo.u_light_camera, flatten(normalize(matrixVectorMult(projectionMatrix, light))));
}

function render() {    
    eye[0] = Math.sin(phi) * 2;
    eye[2] = Math.cos(phi) * 2;
    viewMatrix = lookAt(eye, at, up);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // enable program
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position_model.buffer);
    gl.enableVertexAttribArray(programInfo.a_position_model.location);
    gl.vertexAttribPointer(programInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(programInfo.u_eye_camera, flatten(normalize(matrixVectorMult(projectionMatrix, eye))));
    
    gl.uniformMatrix4fv(programInfo.u_mvp, false, flatten(mult(projectionMatrix, viewMatrix)));
    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
}

function tick() {
    render();
    phi += 0.01;
    requestAnimationFrame(tick);
}

function WebGLStart() {    
    canvas = document.getElementById( "gl-canvas" );
    initGL();
    initVariables();
    setupShaderAndBuffer();
    tick();
}