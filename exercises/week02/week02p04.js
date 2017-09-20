function clearCanvas() {
    pointVertices = [];
    pointColors = [];
    triangleVertices = [];
    triangleIndices = [];
    triangleColors = [];
    triangleHeads = 0;
    circleVertices = [];
    circleColors = [];
    circleClicks = 0;
    numOfCircles = 0;
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

function toggleMode(mode) {
    if (mode == 0) {
        $("#toggle-triangle").prop("checked", false);
        $("#toggle-circle").prop("checked", false);
        drawMode = 0;
    } else if (mode == 1) {
        $("#toggle-point").prop("checked", false);
        $("#toggle-circle").prop("checked", false);
        drawMode = 1;
    } else if (mode == 2) {
        $("#toggle-point").prop("checked", false);
        $("#toggle-triangle").prop("checked", false);
        drawMode = 2;
    }
}

function initSliders() {
    // Credits to http://seiyria.com/bootstrap-slider/
    RGBChange = function() {
        $('#RGB').css('background', 'rgb('+r.getValue()+','+g.getValue()+','+b.getValue()+')')
    };
    
    r = $('#R').slider().on('slide', RGBChange).data('slider');
    g = $('#G').slider().on('slide', RGBChange).data('slider');
    b = $('#B').slider().on('slide', RGBChange).data('slider'); 
    
    // Set color for sample box            
    $('#RGB').css('background', 'rgb('+r.getValue()+','+g.getValue()+','+b.getValue()+')')
}

function bindBuffer(mode, circle_i) {
    /*========== Bind Buffers =======*/
    if (mode == "POINT_MODE") {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointVertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointColors), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    } else if (mode == "TRIANGLE_MODE") {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleIndices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    } else if (mode == "CIRCLE_MODE") {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        // Get vertices of the current (circle_i) circle
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices.slice(circle_i * 1080, circle_i * 1080 + 1080)), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        // Get colors of the current (circle_i) circle
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleColors.slice(circle_i * 1080, circle_i * 1080 + 1080)), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

function shaderToBuffer(mode) {
    /*======== Associating shaders to buffer objects ========*/
    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Bind index buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    
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

function initViewport() {
    // Clear the canvas
    gl.clearColor( selectedClr.red, selectedClr.green, selectedClr.blue, 1.0 );
    
    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color buffer bit
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function render(mode) {
    /*============= Drawing the Scene ===============*/
    if (mode == "POINT_MODE") {
        gl.drawArrays(gl.POINTS, 0, pointVertices.length / 3);
    } else if (mode == "TRIANGLE_MODE") {
        gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length / 3);
    } else if (mode == "CIRCLE_MODE") {
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 360);
    } 
}

function pipeline() {
    initViewport();
    if (triangleVertices.length > 2) {
        bindBuffer("TRIANGLE_MODE");
        shaderToBuffer("TRIANGLE_MODE");
        render("TRIANGLE_MODE");
    } 
    if (pointVertices.length > 2) {
        bindBuffer("POINT_MODE");
        shaderToBuffer("POINT_MODE");
        render("POINT_MODE");
    } 

    if (numOfCircles > 0) {
        for (var circ_i = 0; circ_i < numOfCircles; circ_i++) {
            bindBuffer("CIRCLE_MODE", circ_i);
            shaderToBuffer("CIRCLE_MODE");
            render("CIRCLE_MODE");
        }
        
    }
    requestAnimFrame(pipeline);
}

function WebGLStart() {    
    /*================ Creating a canvas =================*/
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }

    // Init RGB sliders
    initSliders();
    // Init canvas bg color
    setCanvasBgClr();


    /* INIT VARIABLES
    ============================================================================================
    ============================================================================================
    */

    // Init point colors to black
    pointClr = {
        red: 0, 
        green: 0, 
        blue: 0
    };

    // Vertices
    pointVertices = [];
    triangleVertices = [];
    circleVertices = [];
    // Indices
    triangleIndices = [];
    // Colors
    pointColors = [];
    triangleColors = [];
    circleColors = [];
    numOfCircles = 0;
    
    // New clicked vertex and color
    tempVert = [];
    // New clicked color
    tempColor= [];
    // Init draw mode
    drawMode = 0;
    // Check the point mode checkbox
    $("#toggle-point").prop("checked", true);
    // Init the triangleHeads to zero (no heads have been drawn)
    triangleHeads = 0;
    // Init the circleClicks to zero (no clicks for the circle)
    circleClicks = 0;

    // Create an empty buffer object to store the vertex buffer
    vertex_buffer = gl.createBuffer();
    // Create an empty buffer object and store Index data
    index_buffer = gl.createBuffer();
    // Create an empty buffer object and store color data
    color_buffer = gl.createBuffer ();

    /* INIT VARIABLES END
    ============================================================================================
    ============================================================================================
    */


    // Canvas click event listener
    canvas.addEventListener("click", function() {        
        // Create a temp vertex depending on the clicked coordinates
        tempVert = vec3(
            -1 + 2 * event.clientX / canvas.width, // x
            -1 + 2 * (canvas.height - event.clientY) / canvas.height, // y
            0.00 // z
        );
        
        // Create a temp color array depending on the selected colors
        tempColor = vec3(
            pointClr.red,
            pointClr.green,
            pointClr.blue
        );        

        if (drawMode == 0) { // Point mode
            pointVertices = tempVert.concat(pointVertices);
            pointColors = tempColor.concat(pointColors);
        } else if (drawMode == 1) { // Triangle mode
            if (triangleHeads < 2) {
                // Save clicked vertex and color to temp
                pointVertices = tempVert.concat(pointVertices);
                pointColors = tempColor.concat(pointColors);
                triangleHeads += 1;
            } else { 
                // Save the three vertices that define the triangle
                tempTriangleVert = [
                    tempVert[0], tempVert[1], tempVert[2],
                    pointVertices[0], pointVertices[1], pointVertices[2], 
                    pointVertices[3], pointVertices[4], pointVertices[5] 
                ];

                // Pop the two vertices from point vertices
                pointVertices.shift();pointVertices.shift();pointVertices.shift();
                pointVertices.shift();pointVertices.shift();pointVertices.shift();

                // Save the three color for each vertex
                tempTriangleColor = [
                    tempColor[0], tempColor[1], tempColor[2], 
                    pointColors[0], pointColors[1], pointColors[2], 
                    pointColors[3], pointColors[4], pointColors[5] 
                ];

                // Pop the two colors from point colors
                pointColors.shift();pointColors.shift();pointColors.shift();
                pointColors.shift();pointColors.shift();pointColors.shift();

                // Save the indices for the new triangle
                tempTriangleIndex = [
                    triangleIndices.length, triangleIndices.length + 1, triangleIndices.length + 2
                ];

                // Concatenate the new triangle vertices with the already ones
                triangleVertices = tempTriangleVert.concat(triangleVertices);
                triangleIndices = tempTriangleIndex.concat(triangleIndices);
                triangleColors = tempTriangleColor.concat(triangleColors);

                // Reset the drawn triangle heads
                triangleHeads = 0;
            }
        } else if (drawMode == 2) { // Circle mode
            if (circleClicks == 0) {
                // Save clicked vertex and color to temp
                pointVertices = tempVert.concat(pointVertices);
                pointColors = tempColor.concat(pointColors);
                circleClicks += 1;
            } else if (circleClicks == 1) {
                // Save clicked vertex and color to temp
                pointVertices = tempVert.concat(pointVertices);
                pointColors = tempColor.concat(pointColors);
                circleClicks += 1;

                // Save clicked coordiantes for sitance computation
                x1 = pointVertices[3];
                y1 = pointVertices[4];
                x2 = pointVertices[0];
                y2 = pointVertices[1];

                // Calculate circle radius
                dist = Math.sqrt( ((x1 - x2) * (x1 - x2) ) + ((y1 - y2) * (y1 - y2) ));
                console.log(dist);

                for (var i = 0.0; i < 360; i++) {
                    // Convert the degrees to radians
                    var j = radians(i);
            
                    // Create a temporary vertex for the current degree
                    var tempCircleVert = [
                        x1 + (dist*Math.sin(j)), y1 + (dist*Math.cos(j)), 0.0
                    ];
            
                    // Create temporary color array for the current vertex
                    tempCircleColor = [
                        tempColor[0], tempColor[1], tempColor[2]
                    ]
                    
                    // Concatenate vertex and color buffer to vertices and colors
                    circleVertices = tempCircleVert.concat(circleVertices);
                    circleColors = tempCircleColor.concat(circleColors);
                }

                // Pop the vertex from point vertices
                pointVertices.shift();pointVertices.shift();pointVertices.shift();
                pointVertices.shift();pointVertices.shift();pointVertices.shift();
                circleClicks = 0;
                numOfCircles += 1;
            }             
        }
    });

    /*========================= Shaders ========================*/
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    pipeline();
}