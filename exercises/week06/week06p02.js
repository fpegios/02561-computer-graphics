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
    far = 30.0;
    fovy = 90.0;
    aspect = canvas.width / canvas.height;

    at = vec3(0, -1, -11);
    eye = vec3(0, 2, 2);
    up = vec3(0, 1, 0);

    checkboardRows = 8;
    checkboardColumns = 8;

    pointsArray = [];
    colorsArray = [];
    texCoordsArray = [];
    
    vertices = [
        vec4( -4.0, -1.0,  -1.0, 1.0 ),
        vec4(  4.0, -1.0,  -1.0, 1.0 ),
        vec4(  4.0, -1.0, -21.0, 1.0 ),
        vec4( -4.0, -1.0, -21.0, 1.0 ),
    ]; 
    
    numVertices  = 6;

    vertexColors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

    texCoord = [
        vec2(-1.5, 0.0),
        vec2( 2.5, 0.0),
        vec2( 2.5, 10.0),
        vec2(-1.5, 10.0)
    ];
}

function createCheckerboardTexture(rows, columns) {
    texSize = rows * columns;
    image1 = new Uint8Array(4 * texSize * texSize);
    for ( i = 0; i < texSize; i++ ) {
        for ( j = 0; j < texSize; j++ ) {
            patchx = Math.floor(i / (texSize / rows));
            patchy = Math.floor(j/( texSize / columns));
            if(patchx%2 ^ patchy%2) {
                c = 255;
            } else {
                c = 0;
            }
            image1[ 4 * i * texSize + 4 * j] = c;
            image1[ 4 * i * texSize + 4 * j + 1] = c;
            image1[ 4 * i * texSize + 4 * j + 2] = c;
            image1[ 4 * i * texSize + 4 * j + 3] = 255;
        }
    }
}

function quad(a, b, c, d) {
    
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
}

function configureTexture(image) {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
};

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function tick() {
    initViewport()
    render();
    requestAnimFrame(tick);
}

function render() {    
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );

    initGL();
    initVariables();
    createCheckerboardTexture(checkboardRows, checkboardColumns);
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    quad( 1, 0, 3, 2 );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(image1);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    document.getElementById("zFarSlider").onchange = function(event) {
        far = event.target.value;
    };
    document.getElementById("zNearSlider").onchange = function(event) {
        near = event.target.value;
    };
    document.getElementById("aspectSlider").onchange = function(event) {
        aspect = event.target.value;
    };
    document.getElementById("fovSlider").onchange = function(event) {
        fovy = event.target.value;
    };

    document.getElementById("Texture Style").onclick = function( event) {
        switch(event.target.index) {
            case 0:
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    
                break;
            case 1:
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MΙΝ_FILTER, gl.LINEAR );
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
                break;
            case 2:
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST );
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST );
                break;
            case 3:
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR );
                break;
        };
    };

    document.getElementById("Wrapping Mode").onclick = function( event) {
        switch(event.target.index) {
            case 0:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
            case 1:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                break;
        };
    };

    tick();
}