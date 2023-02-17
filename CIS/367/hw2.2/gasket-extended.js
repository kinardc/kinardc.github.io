"use strict";

var canvas;
var gl;
var points = [];
var numTimesToSubdivide = 0;

var theta = 0.0;
var thetaLoc;

var v = [
    { x: -0.5, y: -0.5 },
    { x: 0, y: 0.5 },
    { x: 0.5, y: -0.5 }
]

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( v[0].x, v[0].y ),
        vec2( v[1].x, v[1].y ),
        vec2( v[2].x, v[2].y )
    ];
    divideTriangle( vertices[0], vertices[1], vertices[2],
                    numTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // linking position variables to shader attributes
    thetaLoc = gl.getUniformLocation(program, "theta");

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 50000, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    document.getElementById("slider").onchange = function(event) {
        numTimesToSubdivide = parseInt(event.target.value);
    };

    canvas.addEventListener("mouseup", function(event) {
        // console.log(event.clientX, event.clientY);
        var rect = gl.canvas.getBoundingClientRect();
        var newx = (event.clientX - rect.left) / canvas.width * 2 - 1;
        var newy = (event.clientY - rect.top) / canvas.height * -2 + 1;

        console.log(`x[${event.clientX}] y[${event.clientY}]`);
        console.log(`newx[${newx}] newy[${newy}]`);
        console.log(`width[${canvas.width}] height[${canvas.height}]`)
        console.log(`top[${rect.top}] left[${rect.left}]`);
    });


    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

window.onload = init;

function render()
{
    setTimeout(function () {
        gl.clear(gl.COLOR_BUFFER_BIT);
        // rotate by modifying theta
        theta += 0.1;
        gl.uniform1f(thetaLoc, theta);
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
        points = [];
        requestAnimFrame(init);
    }, 100);
}
