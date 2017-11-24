cubemap = [
    'textures/cm_left.png',     // POSITIVE_X
    'textures/cm_right.png',    // NEGATIVE_X
    'textures/cm_top.png',      // POSITIVE_Y
    'textures/cm_bottom.png',   // NEGATIVE_Y
    'textures/cm_back.png',     // POSITIVE_Z
    'textures/cm_front.png'     // NEGATIVE_Z
];
images = new Array(cubemap.length);
loadCount = 0;

function onImageLoad() {
    loadCount += 1;
    if (loadCount === cubemap.length) {
        WebGLStart();
    }
}

for (var i = 0; i < cubemap.length; i++) {
    images[i] = document.createElement('img');
    images[i].onload = onImageLoad;
    images[i].src = cubemap[i];
}

function initGL() {
    gl = WebGLUtils.setupWebGL(canvas, { alpha: false });
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {    
    at = vec3(0, 0, 0);
    eye = vec3(0, 0, 4);
    up = vec3(0, 1, 0);

    fovy = 65;
    aspect = canvas.width / canvas.height;
    near = 0.1;
    far = 30;

    viewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    backgroundQuad = [
        vec3(-1.0, -1.0, 0.999),
        vec3( 1.0, -1.0, 0.999),
        vec3( 1.0,  1.0, 0.999),
        vec3(-1.0, -1.0, 0.999),
        vec3( 1.0,  1.0, 0.999),
        vec3(-1.0,  1.0, 0.999)
    ];

    tetrahedron = generateTetrahedron(4);

    positions = [].concat(backgroundQuad, tetrahedron);
}

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    initGL();
    initVariables();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    initViewport();

    // Setup shader and buffer data
    gl.useProgram(program);
    programInfo = {
        a_position: {
            location: gl.getAttribLocation(program, 'a_position'),
            buffer: gl.createBuffer()
        },
        u_mvp: gl.getUniformLocation(program, 'u_mvp'),
        u_mtex: gl.getUniformLocation(program, 'u_mtex'),
        u_texture: gl.getUniformLocation(program, 'u_texture')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    cubeTexture = createCubeTexture(gl, images);

    requestAnimationFrame(function render() {
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // DRAW PLANE
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
        gl.enableVertexAttribArray(programInfo.a_position.location);
        gl.vertexAttribPointer(programInfo.a_position.location, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(programInfo.u_mvp, false, flatten(mat4()));
        gl.uniformMatrix4fv(programInfo.u_mtex, false, flatten(mult(inverse4(viewMatrix), inverse4(projectionMatrix))));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.uniformMatrix4fv(programInfo.u_mvp, false, flatten(mult(projectionMatrix, viewMatrix)));
        gl.uniformMatrix4fv(programInfo.u_mtex, false, flatten(mat4()));
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        requestAnimationFrame(render);
    })
}

function createCubeTexture(gl, images) {
    var cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    var faces = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    
    for (var i = 0; i < faces.length; i++) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(faces[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    }
    
    return cubeTexture;
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

function createRMatrix(v, p) {
    return mat4(
        1-2*v[0]*v[0],  -2*v[0]*v[1],   -2*v[0]*v[2],   2*(dot(p, v))*v[0] ,
        -2*v[0]*v[1],   1-2*v[1]*v[1],  -2*v[1]*v[2],   2*(dot(p, v))*v[1] ,
        -2*v[0]*v[2],   -2*v[1]*v[2],   1-2*v[2]*v[2],  2*(dot(p, v))*v[2] ,
        0,              0,              0,              1
    );
}