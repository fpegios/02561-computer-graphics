groundImage = document.createElement('img');
groundImage.src = 'xamp23.png';
groundImage.onload = WebGLStart;

function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {    
    near = 0.1;
    far = 30;
    fovy = 45;
    aspect = canvas.width / canvas.height;

    at = vec3(0, 0, -3);
    eye = vec3(6, 6, 0);
    up = vec3(0, 1, 0);

    light = vec3(0.0, 2.0, -2.0);

    floor = {
        positions: [
            vec3(-2, -1, -1),
            vec3(2, -1, -1),
            vec3(2, -1, -5),
            vec3(-2, -1, -1),
            vec3(2, -1, -5),
            vec3(-2, -1, -5)
        ],
        textureCoords: [
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 0),
            vec2(1, 1),
            vec2(0, 1)
        ]
    };

    floating = {
        positions: [
            vec3(0.25, -0.5, -1.25),
            vec3(0.75, -0.5, -1.25),
            vec3(0.75, -0.5, -1.75),
            vec3(0.25, -0.5, -1.25),
            vec3(0.75, -0.5, -1.75),
            vec3(0.25, -0.5, -1.75)
        ],
        textureCoords: new Array(6).fill(0, 0, 6)
    };

    wall = {
        positions: [
            vec3(-1, 0, -2.5),
            vec3(-1, -1, -2.5),
            vec3(-1, -1, -3),
            vec3(-1, 0, -2.5),
            vec3(-1, 0, -3),
            vec3(-1, -1, -3)
        ],
        textureCoords: new Array(6).fill(0, 0, 6)
    };

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    shadowProjectionMatrix = mat4();
    shadowProjectionMatrix[3][3] = 0;
    shadowProjectionMatrix[3][1] = -1 / light[1];

    positions = [].concat(floor.positions, floating.positions, wall.positions);
    textureCoords = [].concat(floor.textureCoords, floating.textureCoords, wall.textureCoords);
}

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    initGL();
    initVariables();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    initViewport();

    u_modelView = gl.getUniformLocation(program, 'u_modelView');
    u_projection = gl.getUniformLocation(program, 'u_projection');
    u_texture = gl.getUniformLocation(program, 'u_texture');

    a_position = {
        location: gl.getAttribLocation(program, 'a_position'),
        buffer: gl.createBuffer()
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position.location);
    gl.vertexAttribPointer(a_position.location, 3, gl.FLOAT, false, 0, 0);

    a_textureCoords = {
        location: gl.getAttribLocation(program, 'a_textureCoords'),
        buffer: gl.createBuffer()
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, a_textureCoords.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_textureCoords.location);
    gl.vertexAttribPointer(a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    groundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, groundImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.activeTexture(gl.TEXTURE1);
    redTexture = gl.createTexture();
    redImage = new Uint8Array([255, 0, 0]);
    gl.bindTexture(gl.TEXTURE_2D, redTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, redImage);

    gl.activeTexture(gl.TEXTURE2);
    blackTexture = gl.createTexture();
    blackImage = new Uint8Array([0, 0, 0]);
    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, blackImage);

    gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));

    theta = 0;
    previousTime = null;

    requestAnimationFrame(function render(currentTime) {
        if (previousTime === null) {
            previousTime = currentTime;
        }
        
        delta = currentTime - previousTime;
        previousTime = currentTime;
        theta += 0.01;
        
        rotationMatrix = rotateY(10);
        light[0] = Math.sin(theta)*2;
        light[2] = Math.cos(theta)*2 - 2;

        shadowMatrix = mult(modelViewMatrix, translate(light[0], light[1] - 1.001, light[2]));
        shadowMatrix = mult(shadowMatrix, shadowProjectionMatrix);
        shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 1.001), -light[2]));
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(u_modelView, false, flatten(modelViewMatrix));
        
        gl.uniform1i(u_texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.depthFunc(gl.GREATER);
        gl.uniformMatrix4fv(u_modelView, false, flatten(shadowMatrix));
        gl.uniform1i(u_texture, 2);
        gl.drawArrays(gl.TRIANGLES, 6, 6*2);
        
        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(u_modelView, false, flatten(modelViewMatrix));
        
        gl.uniform1i(u_texture, 1);
        gl.drawArrays(gl.TRIANGLES, 6, 6*2);
        
        requestAnimationFrame(render);
    })
}