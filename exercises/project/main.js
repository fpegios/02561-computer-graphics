function initGL() {
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
}

function initVariables() {    
    mvMatrix = [];
    pMatrix = [];
    cameraParams = {x: 0, y: -5.0, z: -20};
    gameStates = { AIMING: "AIMING", POWERING: "POWERING", AIRTIME: "AIRTIME"};
    gameState = gameStates.AIMING;

    // ball
    index = 0;
    numTimesToSubdivide = 6;
    pointsArray = [];
    ball = {x: 0, y: 0, z: 9 };

    // goalPost
    goalPostZ = -100;
    goalPostWidth = 65;
    crossbarScaleWidth = 1.25;
    crossbarScaleHeight = 15;

    // target
    target = {x: 0, y: 0, z: 0};
    targetScale = 2;
    targetRange = {minX: -25 - targetScale, maxX: 25 + targetScale, minY: 0 + targetScale , maxY: 18 + targetScale };

    // arrow
    arrowAngle = 0;
    arrowDirection = 1; // 1: right and -1: left
    arrow = {x: 0, y: 1.3, z: 9};
    arrowAngleStep = 2;
    arrowMaxDegrees = 35;

    // powerbar
    powerbarDirection = 1;
    powerbarScale = {x: 1.25, y: 0.075, z: 1};
    powerbarValue = 0.005;
    powerbarStep = 0.05;
    powerbar = {x: 0, y: -1, z: 9};
    powerbarScaleRange = {min: 0.005, max: 1.25};

    // shoot
    shoot = {
        horizontalCurve: 0, 
        horizontalStep: 0, 
        horizontalMax: 0, 
        verticalCurve: 0, 
        verticalStep: 0, 
        verticalMax: 30 ,
        distance: ball.z - goalPostZ,
        speed: 3.0 
    }; 
    
    // terrain
    terrainScale = 30;
    terrain = {
        x: 0,
        y: -2.35,
        z: -50
    }

    // score
    score = 0;
    
    // colors
    color = {
        white:        [1.0, 1.00, 1.0, 1.0],
        red:          [1.0, 0.00, 0.0, 1.0],
        orange:       [1.0, 0.35, 0.0, 1.0],
        yellow:       [1.0, 0.80, 0.0, 1.0],
        blue:         [0.0, 0.00, 1.0, 1.0],
        green:        [0.0, 1.00, 0.0, 1.0],
        black:        [0.0, 0.00, 0.0, 1.0],
        darkGreen:    [0.0, 0.39, 0.0, 1.0]
    }
    
}

function initCubeBuffer() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom fac1
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face1
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    //every item has 3 coordinates (x,y,z)
    cubeVertexPositionBuffer.itemSize = 3;
    //we have 24 vertices
    cubeVertexPositionBuffer.numItems = 24;
    //Index Buffer Object
    //it joins sets of vertices into faces
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

    var cubeVertexIndices = [
    //this numbers are positions in the VBO array above
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

    //we have one item - the cube
    cubeVertexIndexBuffer.itemSize = 1;
    //we have 36 indices (6 faces, every face has 2 triangles, each triangle 3 vertices: 2x3x6=36)
    cubeVertexIndexBuffer.numItems = 36;
}

function initSquareBuffer() {
    squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);

    squareVertices = [
        // Front face
        -2.0, -2.0,  1.0,
         2.0, -2.0,  1.0,
         2.0,  2.0,  1.0,
        -2.0,  2.0,  1.0
    ]

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

    squareVertexBuffer.itemSize = 3;
    squareVertexBuffer.numItems = 4;
    squareIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);

    var squareVertexIndices = [
        0, 1, 2,      
        0, 2, 3
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareVertexIndices), gl.STATIC_DRAW);
    
    squareIndexBuffer.itemSize = 1;
    squareIndexBuffer.numItems = 6;
}

function initArrowBuffer() {
    arrowVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, arrowVertexBuffer);

    arrowVertices = [
        // triangle
         0.00,  1.0,  1.0,
        -0.35,  0.35,  1.0,
         0.00,  0.35,  1.0,
         0.35,  0.35,  1.0,
        // main body
        -0.15,  0.35,  1.0,
         0.15,  0.35,  1.0,
        -0.15,  0.00,  1.0,
         0.15,  0.00,  1.0
    ]

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrowVertices), gl.STATIC_DRAW);

    arrowVertexBuffer.itemSize = 3;
    arrowVertexBuffer.numItems = 8;
    arrowIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrowIndexBuffer);

    var arrowVertexIndices = [
        0, 1, 2,      
        0, 2, 3,
        4, 5, 6,
        5, 6, 7
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrowVertexIndices), gl.STATIC_DRAW);
    
    arrowIndexBuffer.itemSize = 1;
    arrowIndexBuffer.numItems = 12;
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    index += 3;
}

function divideTriangle(a, b, c, count) {
   if ( count > 0 ) {

       var ab = normalize(mix( a, b, 0.5), true);
       var ac = normalize(mix( a, c, 0.5), true);
       var bc = normalize(mix( b, c, 0.5), true);

       divideTriangle( a, ab, ac, count - 1 );
       divideTriangle( ab, b, bc, count - 1 );
       divideTriangle( bc, c, ac, count - 1 );
       divideTriangle( ab, bc, ac, count - 1 );
   }
   else { // draw tetrahedron at end of recursion
       triangle( a, b, c );
   }
}

function tetrahedron(a, b, c, d, n) {
   divideTriangle(a, b, c, n);
   divideTriangle(d, c, b, n);
   divideTriangle(a, d, b, n);
   divideTriangle(a, c, d, n);
}

function initSphereBuffer() {
    va = vec4(0.0, 0.0, -1.0, 1);
    vb = vec4(0.0, 0.942809, 0.333333, 1);
    vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    vd = vec4(0.816497, -0.471405, 0.333333, 1);
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    sphereVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
}

function defineTarget() {
    target = {x: (Math.random() * (targetRange.maxX - targetRange.minX + 1)) + targetRange.minX, y: (Math.random() * (targetRange.maxY - targetRange.minY + 1)) + targetRange.minY, z: goalPostZ};
}

function initViewport() {
    gl.clearColor( 0.3921, 0.5843, 0.9294, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function setMatrixUniforms(i, color) {
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix[i]));
    gl.uniform4fv(colorLoc, color);
}

function drawBall() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    /************************************************/

    mvMatrix[3] = camera;
    mvMatrix[3] = mult(mvMatrix[3], translate([ball.x, ball.y, ball.z]));
    mvMatrix[3] = mult(mvMatrix[3], scalem([0.75, 0.75, 0.75]));

    setMatrixUniforms(3, color.white);
    for( var i = 0; i < index; i += 3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );  
    }
}

function drawGoalPost() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(vPosition, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    /********************************************************************/

    // draw the three parts of a goalpost (left, right, top)
    mvMatrix[0] = camera;
    mvMatrix[0] = mult(mvMatrix[0], translate([-goalPostWidth / 2, 12, goalPostZ]));
    mvMatrix[0] = mult(mvMatrix[0], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    setMatrixUniforms(0, color.white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[1] = camera;
    mvMatrix[1] = mult(mvMatrix[1], translate([goalPostWidth / 2, 12, goalPostZ]));
    mvMatrix[1] = mult(mvMatrix[1], scalem([crossbarScaleWidth, crossbarScaleHeight, 0.25]));
    setMatrixUniforms(1, color.white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[2] = camera;
    mvMatrix[2] = mult(mvMatrix[2], translate([0, (crossbarScaleHeight - 1.25) + 12  , goalPostZ]));
    mvMatrix[2] = mult(mvMatrix[2], scalem([goalPostWidth / 2, crossbarScaleWidth, 0.25]));
    setMatrixUniforms(2, color.white);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawTargets() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.vertexAttribPointer(vPosition, squareVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    /********************************************************************/

    mvMatrix[4] = camera;
    mvMatrix[4] = mult(mvMatrix[4], translate([target.x, target.y, target.z]));
    mvMatrix[4] = mult(mvMatrix[4], scalem([targetScale, targetScale, 1 ]));
    setMatrixUniforms(4, color.red);
    gl.drawElements(gl.TRIANGLES, squareIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawArrow() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, arrowVertexBuffer);
    gl.vertexAttribPointer(vPosition, arrowVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrowIndexBuffer);
    /********************************************************************/

    mvMatrix[5] = camera;
    mvMatrix[5] = mult(mvMatrix[5], rotate(arrowAngle, [0, 0, 1]));
    mvMatrix[5] = mult(mvMatrix[5], translate([arrow.x, arrow.y, arrow.z]));
    setMatrixUniforms(5, color.yellow);
    gl.drawElements(gl.TRIANGLES, arrowIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawPowerBar() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.vertexAttribPointer(vPosition, squareVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    /********************************************************************/
    
    mvMatrix[5] = camera;
    mvMatrix[5] = mult(mvMatrix[5], translate([powerbar.x, powerbar.y, powerbar.z]));
    mvMatrix[5] = mult(mvMatrix[5], scalem([powerbarValue, powerbarScale.y, powerbarScale.z]));
    setMatrixUniforms(5, color.red);
    gl.drawElements(gl.TRIANGLES, squareIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvMatrix[6] = camera;
    mvMatrix[6] = mult(mvMatrix[6], translate([powerbar.x, powerbar.y, powerbar.z]));
    mvMatrix[6] = mult(mvMatrix[6], scalem([powerbarScale.x, powerbarScale.y, powerbarScale.z]));
    setMatrixUniforms(6, color.yellow);
    gl.drawElements(gl.TRIANGLES, squareIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawTerrain() {
    // BIND BUFFERS!!!!!!!!!!!!
    // MUST BE DONE ONCE BEFORE DRAWING AN OBJECT
    /************************************************/
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.vertexAttribPointer(vPosition, squareVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    /********************************************************************/
    
    mvMatrix[7] = camera;
    mvMatrix[7] = mult(mvMatrix[7], translate([terrain.x, terrain.y, terrain.z]));
    mvMatrix[7] = mult(mvMatrix[7], scalem([terrainScale, 1, terrainScale]));
    mvMatrix[7] = mult(mvMatrix[7], rotate(90, [1, 0, 0]));
    setMatrixUniforms(7, color.darkGreen);
    gl.drawElements(gl.TRIANGLES, squareIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function render() {
    pMatrix = perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 150.0);
    camera = rotate(10, [1, 0, 0]);
    camera = mult(camera, translate([cameraParams.x, cameraParams.y, cameraParams.z]));
    
    drawBall();
    drawGoalPost();    
    drawTargets();
    drawTerrain();
    if (gameState == gameStates.AIMING) {
        drawArrow();
    }
    if (gameState == gameStates.POWERING) {
        drawPowerBar();
    }
}

function increaseScore() {
    score++;
    document.getElementById("score").innerHTML = score;
}

function initForNextShoot() {
    gameState = gameStates.AIMING;

    ball = {x: 0, y: 0, z: 9 }; 

    arrowDirection = 1;
    arrowAngle = 0;
    powerbarDirection = 1;
    powerbarValue = 0.006 ;
}

function ballHasReachedGoalPost() {
    return (ball.z <=  target.z + 1 );
}

function ballOnTarget() {
    return (ball.x >= target.x - 2*targetScale) && ( ball.x <= target.x + 2*targetScale) && (ball.y >= target.y - 2*targetScale) && ( ball.y <= target.y + 2*targetScale);
}

function updateArrow() {
    if (arrowAngle >= arrowMaxDegrees) {
        arrowDirection = -arrowDirection;
        arrowAngle = arrowAngle + arrowDirection*arrowAngleStep ;
    } else if (arrowAngle <= -arrowMaxDegrees) {
        arrowDirection = -arrowDirection;
        arrowAngle = arrowAngle + arrowDirection*arrowAngleStep;
    } else {
        arrowAngle = arrowAngle + arrowDirection*arrowAngleStep;
    }
}

function updatePowerbar() {
    if (powerbarValue >= powerbarScaleRange.max) {
        powerbarDirection = -powerbarDirection;
        powerbarValue = powerbarValue + (powerbarDirection * powerbarStep);
    } else if (powerbarValue < powerbarScaleRange.min) {
        powerbarDirection = -powerbarDirection;
        powerbarValue = powerbarValue + (powerbarDirection * powerbarStep);
    } else {
        powerbarValue = powerbarValue + (powerbarDirection * powerbarStep);
    }
}

function updateBall() {
    ball = {
        x: ball.x + shoot.horizontalStep,
        y: ball.y + shoot.verticalStep,
        z: ball.z - shoot.speed
    }
}

function gameOver() {
    score = 0;
    document.getElementById("score").innerHTML = score;
}

function update() {

    if ( ballHasReachedGoalPost() ) {
        if ( ballOnTarget() ) {
            increaseScore();
            initForNextShoot();
            defineTarget();  
        } else {
            gameOver(); 
            initForNextShoot();
            defineTarget();  
        }        
    } else {
        if (gameState == gameStates.AIMING) {
            updateArrow();            
        } else if (gameState == gameStates.POWERING) {
            updatePowerbar();
        } else if (gameState == gameStates.AIRTIME) {
            updateBall();            
        }
    }

    initViewport()
    render();
    requestAnimFrame(update);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );
    initGL();
    initVariables();
    document.getElementById("score").innerHTML = score;
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    vPosition = gl.getAttribLocation( program, "vPosition");

    // make the necessary correspondence
    pMatrixLoc = gl.getUniformLocation(program, "uPMatrix");
    mvMatrixLoc = gl.getUniformLocation(program, "uMVMatrix");
    colorLoc = gl.getUniformLocation( program, "color" );

    initSphereBuffer();
    initCubeBuffer();
    initSquareBuffer();
    initArrowBuffer()
    
    defineTarget();    
    update();
}

document.addEventListener("keydown", function(event) {
    if (event.which == 32) {
        switch(gameState) {
            case gameStates.AIMING:
                if (arrowAngle >= 0) { 
                    shoot.horizontalMax = -arrowAngle;
                    shoot.horizontalStep = shoot.horizontalMax / (shoot.distance / shoot.speed);
                } else {
                    shoot.horizontalMax = -arrowAngle;
                    shoot.horizontalStep = shoot.horizontalMax / (shoot.distance / shoot.speed);
                }
                gameState = gameStates.POWERING;
                break;
            case gameStates.POWERING:
                shoot.verticalCurve = (powerbarValue / powerbarScaleRange.max);
                shoot.verticalStep = (shoot.verticalCurve * shoot.verticalMax) / ( shoot.distance / shoot.speed);
                gameState = gameStates.AIRTIME;
                break;
            default:
        }
    }
})      