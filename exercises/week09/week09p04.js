groundImage = document.createElement('img');
groundImage.src = 'xamp23.png';
groundImage.onload = WebGLStart;

function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    
    return xhr.status == okStatus ? xhr.responseText : null;
};

function initGL() {
    gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {    
    at = vec3(0, 0, -3);
    eye = vec3(0, 0, 1);
    up = vec3(0, 1, 0);

    fovy = 65;
    aspect = canvas.width / canvas.height;
    near = 0.1;
    far = 30;

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
        ],
        normals: [
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0),
            vec3(0, 1, 0)
        ]
    };

    viewMatrix = lookAt(eye, at, up);
    aboveViewMatrix = lookAt(vec3(1, 6, -3), at, up);
    depthViewMatrix = lookAt(light, at, up);

    projectionMatrix = perspective(fovy, aspect, near, far);
    shadowProjectionMatrix = mat4();

    shadowProjectionMatrix[3][3] = 0;
    shadowProjectionMatrix[3][1] = -1/light[1];
    
    teapotFile = loadFileAJAX('teapot.obj');
    teapot = new OBJDoc('teapot.obj');
    teapot.parse(teapotFile, 0.25, false);

    positions = [].concat(floor.positions);
    textureCoords = [].concat(floor.textureCoords);
    normals = new Array(6).fill(vec3(0, 0, 0));

    positions = [].concat(floor.positions);
    textureCoords = [].concat(floor.textureCoords);
    normals = new Array(6).fill(vec3(0, 0, 0));

    for (var i = 0; i < teapot.objects[0].faces.length; i++) {
        face = teapot.objects[0].faces[i];
        for (var j = 0; j < 3; j++) {
            vertex = teapot.vertices[face.vIndices[j]];
            normal = teapot.normals[face.nIndices[j]];
            positions.push(vec3(vertex.x, vertex.y, vertex.z));
            normals.push(vec3(normal.x, normal.y, normal.z));
            textureCoords.push(vec3(0, 0, 0));
        }
    }
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
    phongProgram = initShaders( gl, "phong-vertex-shader", "phong-fragment-shader" );
    depthProgram = initShaders( gl, "depth-vertex-shader", "depth-fragment-shader" );
    initViewport();

    depthTextureExt = gl.getExtension("WEBKIT_WEBGL_depth_texture") || gl.getExtension("WEBGL_depth_texture");
    size = Math.pow(2,9);

    // Create a color texture
    colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create the depth texture
    gl.activeTexture(gl.TEXTURE3);
    depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Setup shader and buffer data
    gl.useProgram(program);
    programInfo = {
        a_position: {
            location: gl.getAttribLocation(program, 'a_position'),
            buffer: gl.createBuffer()
        },
        a_textureCoords: {
            location: gl.getAttribLocation(program, 'a_textureCoords'),
            buffer: gl.createBuffer()
        },
        u_modelView: gl.getUniformLocation(program, 'u_modelView'),
        u_projection: gl.getUniformLocation(program, 'u_projection'),
        u_texture: gl.getUniformLocation(program, 'u_texture'),
        u_shadow: gl.getUniformLocation(program, 'u_shadow'),
        u_depthMVP: gl.getUniformLocation(program, 'u_depthMVP')
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);

    // SETUP AND BUFFER PHONG SHADER    
    gl.useProgram(phongProgram);
    phongInfo = {
        a_position_model: {
            location: gl.getAttribLocation(phongProgram, 'a_position_model'),
            buffer: gl.createBuffer()
        },
        a_normal_model: {
            location: gl.getAttribLocation(phongProgram, 'a_normal_model'),
            buffer: gl.createBuffer()
        },
        u_modelView: gl.getUniformLocation(phongProgram, 'u_modelView'),
        u_projection: gl.getUniformLocation(phongProgram, 'u_projection'),
        u_normal: gl.getUniformLocation(phongProgram, 'u_normal'),
        u_light_world: gl.getUniformLocation(phongProgram, 'u_light_world')
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
    gl.uniformMatrix4fv(phongInfo.u_projection, false, flatten(projectionMatrix));

    // SETUP AND BUFFER DEPTH SHADER 
    gl.useProgram(depthProgram);

    depthInfo = {
        a_position: {
            location: gl.getAttribLocation(depthProgram, 'a_position'),
            buffer: gl.createBuffer()
        },
        u_modelView: gl.getUniformLocation(depthProgram, 'u_modelView'),
        u_projection: gl.getUniformLocation(depthProgram, 'u_projection')
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, depthInfo.a_position.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    createTextures(gl, groundImage);
    gl.useProgram(program);
    gl.uniformMatrix4fv(programInfo.u_projection, false, flatten(projectionMatrix));

    p = floor.positions[0];
    v = normalize(cross(subtract(floor.positions[1], floor.positions[0]), subtract(floor.positions[2], floor.positions[0])));
    R = createRMatrix(v, p);
    obliqueProjectionMatrix = modifyProjectionMatrix(vec4(v[0], v[1], v[2], 1), projectionMatrix);
    console.log(obliqueProjectionMatrix);
    
    moveTeapot = true;
    moveLight = true;
    phi = 0;
    theta = 0;

    document.getElementById("toggle-teapot").onclick = function(){
        moveTeapot = !moveTeapot;
    };

    document.getElementById("toggle-light").onclick = function(){
        moveLight = !moveLight;
    };

    requestAnimationFrame(function render() {
        phi += moveTeapot ? 0.02 : 0;
        theta += moveLight ? 0.01 : 0;
        
        light[0] = Math.sin(theta) * 2;
        light[2] = Math.cos(theta) * 2 - 2;
        
        depthViewMatrix = lookAt(light, at, up);
        
        var t = Math.sin(phi)*0.5 + 0.5;
        var teapotModelMatrix = translate(0, t * (-1.8), -3);
        var teapotModelViewMatrix = mult(viewMatrix, teapotModelMatrix);
        
        var shadowMatrix = mult(viewMatrix, translate(light[0], light[1] - 1.001, light[2]));
        shadowMatrix = mult(shadowMatrix, shadowProjectionMatrix);
        shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 1.001), -light[2]));
        shadowMatrix = mult(shadowMatrix, teapotModelMatrix);
        
        // DRAW INTO DEPTH TEXTURE
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, size, size);
        gl.colorMask(false, false, false, false);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(depthProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, depthInfo.a_position.buffer);
        gl.enableVertexAttribArray(depthInfo.a_position.location);
        gl.vertexAttribPointer(depthInfo.a_position.location, 3, gl.FLOAT, false, 0, 0);    

        gl.uniformMatrix4fv(depthInfo.u_projection, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(depthInfo.u_modelView, false, flatten(mult(depthViewMatrix, teapotModelMatrix)));
        
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.colorMask(true, true, true, true);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // DRAW TEAPOT
        gl.useProgram(phongProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
        gl.enableVertexAttribArray(phongInfo.a_position_model.location);
        gl.vertexAttribPointer(phongInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
        gl.enableVertexAttribArray(phongInfo.a_normal_model.location);
        gl.vertexAttribPointer(phongInfo.a_normal_model.location, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(phongInfo.u_normal, false, flatten(transpose(inverse4(teapotModelViewMatrix))));
        
        gl.uniformMatrix4fv(phongInfo.u_modelView, false, flatten(teapotModelViewMatrix));
        gl.uniform3fv(phongInfo.u_light_world, flatten(light));
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        // stencil
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc( gl.ALWAYS, 1, 0xFF );
        gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE );
        gl.stencilMask( 0xFF );
        gl.depthMask( false );
        gl.colorMask(false, false, false, false);
        gl.clear( gl.STENCIL_BUFFER_BIT );

        // DRAW PLANE IN STENCIL
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
        gl.enableVertexAttribArray(programInfo.a_position.location);
        gl.vertexAttribPointer(programInfo.a_position.location, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
        gl.enableVertexAttribArray(programInfo.a_textureCoords.location);
        gl.vertexAttribPointer(programInfo.a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);    
         
        gl.uniformMatrix4fv(programInfo.u_modelView, false, flatten(viewMatrix));
        gl.uniform1i(programInfo.u_texture, 0);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(programInfo.u_shadow, 3);
        gl.uniformMatrix4fv(programInfo.u_depthMVP, false, flatten(mult(projectionMatrix, depthViewMatrix)));
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // DRAW REFLECTED TEAPOT
        gl.stencilFunc( gl.EQUAL, 1, 0xFF );
        gl.stencilMask( 0x00 );
        gl.depthMask( true );
        gl.colorMask(true, true, true, true);
        
        gl.useProgram(phongProgram);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_position_model.buffer);
        gl.enableVertexAttribArray(phongInfo.a_position_model.location);
        gl.vertexAttribPointer(phongInfo.a_position_model.location, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, phongInfo.a_normal_model.buffer);
        gl.enableVertexAttribArray(phongInfo.a_normal_model.location);
        gl.vertexAttribPointer(phongInfo.a_normal_model.location, 3, gl.FLOAT, false, 0, 0);
    
        gl.uniformMatrix4fv(phongInfo.u_modelView, false, flatten(mult(mult(viewMatrix, R), teapotModelMatrix)));
        gl.uniformMatrix4fv(phongInfo.u_projection, false, flatten(obliqueProjectionMatrix));
        lightR4 = matrixVectorMult(R, vec4(light[0], light[1], light[2], 1));
        lightR = vec3(lightR4[0], lightR4[1], lightR4[2]);
    
        gl.uniform3fv(phongInfo.u_light_world, flatten(lightR));
        gl.drawArrays(gl.TRIANGLES, 6, positions.length - 6);
        
        gl.disable(gl.STENCIL_TEST);

        // DRAW PLANE
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_position.buffer);
        gl.enableVertexAttribArray(programInfo.a_position.location);
        gl.vertexAttribPointer(programInfo.a_position.location, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.a_textureCoords.buffer);
        gl.enableVertexAttribArray(programInfo.a_textureCoords.location);
        gl.vertexAttribPointer(programInfo.a_textureCoords.location, 2, gl.FLOAT, false, 0, 0);  

        gl.uniformMatrix4fv(programInfo.u_modelView, false, flatten(viewMatrix));
        gl.uniform1i(programInfo.u_texture, 0);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(programInfo.u_shadow, 3);
        gl.uniformMatrix4fv(programInfo.u_depthMVP, false, flatten(mult(projectionMatrix, depthViewMatrix)));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        requestAnimationFrame(render);
    })
}

function modifyProjectionMatrix(clipplane, projection) {
	var oblique = mult(mat4(), projection);
	var q = vec4((sign(clipplane[0]) + projection[0][2])/projection[0][0], 
			(sign(clipplane[1]) + projection[1][2])/projection[1][1], 
			-1.0, 
			(1.0 + projection[2][2])/projection[2][3]);
	var s = 2.0/dot(clipplane, q);
	oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s,
			clipplane[2]*s + 1.0, clipplane[3]*s);
	return oblique;
}

function sign(x) { 
    return x > 0.0 ? 1.0 : (x < 0.0 ? -1.0 : 0.0); 
}

function createTextures(gl, groundImage) {
    gl.activeTexture(gl.TEXTURE0);
    var groundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, groundImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.activeTexture(gl.TEXTURE1);
    var redTexture = gl.createTexture();
    var redImage = new Uint8Array([255, 0, 0]);
    gl.bindTexture(gl.TEXTURE_2D, redTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, redImage);

    gl.activeTexture(gl.TEXTURE2);
    var blackTexture = gl.createTexture();
    var blackImage = new Uint8Array([0, 0, 0, 200]);
    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackImage);
}

function createRMatrix(v, p) {
    return mat4(
        1-2*v[0]*v[0],  -2*v[0]*v[1],   -2*v[0]*v[2],   2*(dot(p, v))*v[0] ,
        -2*v[0]*v[1],   1-2*v[1]*v[1],  -2*v[1]*v[2],   2*(dot(p, v))*v[1] ,
        -2*v[0]*v[2],   -2*v[1]*v[2],   1-2*v[2]*v[2],  2*(dot(p, v))*v[2] ,
        0,              0,              0,              1
    );
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