/**
 * Chase Kinard
 * - An audio visualizer using three.js and simplex-noise
 */
import * as THREE from 'three';
import { createNoise2D } from "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/+esm";
import { avg, max, mirrorArray, modulate } from './helpers.mjs';

/* Common Values */
const tau = 2 * Math.PI,
    maxFrequency = 255;

/* Noise Objects */
const noise = createNoise2D(),
    clock = new THREE.Clock(true);

/* Window Size */
const windowHeight = window.innerHeight,
    windowWidth = window.innerWidth,
    aspectRatio = windowWidth / windowHeight;

/**
 * Use aspect ratio keep X and Y axes on same scale.
 * - For demo purposes, assumes window width > height (e.g. fullscreen)
 */
const leftBound = -aspectRatio * 2,
    rightBound = aspectRatio * 2,
    topBound = 2,
    bottomBound = -2;

/**
 * Generate a ring of points.
 * @param { Number } n The number of points
 * @param { Number } r The radius of the ring
 * @returns { THREE.Vector3[] } Evenly-spaced points in the ring
 */
function generateRingPoints(n, r) {
    const points = [];
    for ( let theta = 0, step = tau / n; theta < tau; theta += step ) {
        points.push( new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0) );
    }
    return points;
}

/**
 * Generate a THREE.LineLoop mesh from a ring of points.
 * @param { THREE.Vector3[] } points The points of the ring
 * @param { Number } color The line color in base-16
 * @returns { THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial> } The mesh of the ring
 */
// const uniforms = {
//     u_time: { value: 0.0 },
//     u_resolution:  { value: new THREE.Vector3(windowWidth, windowHeight, 1) },
// }
function getLineLoopMesh(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points),
        material = new THREE.LineBasicMaterial({ color: color }),
        // material = new THREE.ShaderMaterial({
        //     uniforms: uniforms,
        //     vertexShader: `
        //         varying vec2 v_uv;
        //         void main() {
        //             v_uv = uv;
        //             gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        //         }
        //     `,
        //     fragmentShader: `
        //         precision mediump float;
        //         uniform float u_time;
        //         uniform vec3 u_resolution;
        //         void main() {
        //             // Get current pixel position.
        //             vec2 currentPixel = fragCoord.xy / u_resolution.xy;
        //             currentPixel = currentPixel * (u_resolution.x / u_resolution.y);
        //             gl_FragColor = vec4(0.0, cos(u_time * 5.0) + 0.5, sin(u_time * 5.0) + 0.5, 1.0).rgba;  
        //         }
        //     `
        // }),
        mesh = new THREE.LineLoop(geometry, material);
    return mesh;
}

/**
 * Update the vertex positions of a ring mesh based on frequencies in the song and optional modifiers.
 * @param { THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial> } mesh The mesh of the ring
 * @param { Uint8Array } data The byte frequency data
 * @param { THREE.Vector3[] } points The unmodified points (original position) of the ring
 * @param { Object } options The control panel modifiers
 */
function updateMeshGeometry(mesh, data, points, options = {}) {
    const positions = mesh.geometry.attributes.position.array,
        step = 2 * Math.PI / points.length;
    for (let i = 0, p = 0; i <= points.length; ++i) {
        const theta = step * i,
            freqMod = [ data[i % data.length], avg(data), max(data) ],      // Not happy about calculating all options every time...
            frequency = freqMod[options.frequencyType],
            [newX, newY] = updatePoint(points[i % points.length], frequency, theta, 0.5, options);
        positions[p++] = newX;
        positions[p++] = newY;
        positions[p++] = 0;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
}

/**
 * Update a vertex position in a ring mesh based on a frequency and optional modifiers.
 * @param { THREE.Vector3 } point The original position of the vertex
 * @param { Number } freq The frequency
 * @param { Number } theta The angle of the point on the ring
 * @param { Number } radius The radius of the ring
 * @param { Object } options Options to control amplitude, noise "speed", and wave shape
 * @returns { [ Number, Number ] } The updated X and Y coordinates
 */
function updatePoint(point, freq, theta, radius, { amplitude = 1, movement = 0.1, absolute = false, frequencyType = 0 } = {}) {
    const time = clock.getElapsedTime(),
        x = point.x, y = point.y,
        noiseOffset = time * movement;
    let noiseXY = noise(x + noiseOffset, y + noiseOffset);
    if (absolute) { noiseXY = Math.abs(noiseXY); }
    const offsetX = modulate(freq, 0, maxFrequency, 0, amplitude) * noiseXY * Math.cos(theta),
        offsetY = modulate(freq, 0, maxFrequency, 0, amplitude) * noiseXY * Math.sin(theta);
    return [ x + offsetX*radius, y + offsetY*radius ];
}

/**
 * Initialize the three.js audio context.
 * @param { HTMLElement } audio The audio element from the control panel
 * @param { Number } nSamples The number of samples used (fft size)
 * @returns { [ AudioContext, MediaElementAudioSourceNode, AnalyserNode, Number, Uint8Array ] } The initialized audio context, element, analyzer, bin size, and frequency bin
 */
function initAudio(audio, nSamples) {
    const context = new AudioContext(),
        source = context.createMediaElementSource(audio),   // Connect audio element to AudioContext
        analyzer = context.createAnalyser();                // Create audio analyzer
    source.connect(analyzer);                               // Expose analyzer to audio element
    analyzer.connect(context.destination);                  // Expose default audio output device to analyzer
    analyzer.fftSize = nSamples;                            // Number of samples
    return [
        context, source, analyzer,
        analyzer.frequencyBinCount,                         // Number of nodes to draw (always fftSize/2) 
        new Uint8Array(analyzer.frequencyBinCount)          // Frequency data must be stored as uint8
    ];
}

/**
 * Initialize the three.js renderer.
 * @returns { THREE.WebGLRenderer } The renderer object
 */
function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild( renderer.domElement );
    return renderer;
}

/**
 * Main program.
 */
function start() {

    /* Options for modifying the shape of visuals/waves. */
    var options = {
        amplitude: 1,       // The height of wave crests/troughs
        movement: 0.1,      // The speed of movement across 2D noise
        absolute: false,    // Invert wave troughs to crests
        frequencyType: 0    // Linear frequency data, average frequency, or max frequency
    };

    /* Add event listeners/default values to the control panel when the window loads. */
    window.onload = function () {
        const trackSelect = document.getElementById('track-select');
        audio.src = trackSelect.options[trackSelect.selectedIndex].value;
        trackSelect.addEventListener('input', function () { window.location.reload(); });

        const amplitudeSlider = document.getElementById('amplitude-slider');
        amplitudeSlider.value = 1;
        amplitudeSlider.addEventListener('input', function () { options.amplitude = amplitudeSlider.value; });

        const movementSlider = document.getElementById('movement-slider');
        movementSlider.value = 0.1;
        movementSlider.addEventListener('input', function () { options.movement = movementSlider.value; });

        const absoluteCheckbox = document.getElementById('absolute-checkbox');
        absoluteCheckbox.checked = false;
        absoluteCheckbox.addEventListener('change', function () { options.absolute = !options.absolute; });

        const frequencySlider = document.getElementById('frequency-slider');
        frequencySlider.value = 0;
        frequencySlider.addEventListener('input', function () { options.frequencyType = frequencySlider.value; });
    };

    /* Initialize the scene. */
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(leftBound, rightBound, topBound, bottomBound, 0.1, 2);
    camera.position.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    const renderer = initRenderer();

    /* Generate three rings (for lows, mids, highs). */
    var outerPoints = generateRingPoints(256*0.75, 1.5),
        middlePoints = generateRingPoints(256*0.75, 1.0),
        innerPoints = generateRingPoints(256*0.75, 0.5);
    var outerMesh = getLineLoopMesh(outerPoints, 0xFFFF00),
        middleMesh = getLineLoopMesh(middlePoints, 0xFF00FF),
        innerMesh = getLineLoopMesh(innerPoints, 0x00FFFF);

    /* Render the rings in the scene. */
    scene.add(outerMesh);
    scene.add(middleMesh);
    scene.add(innerMesh);
    renderer.render( scene, camera );

    /* Begin animating when audio starts playing. */
    const audio = document.getElementById('audio-controls');
    audio.addEventListener('playing', function () {

        /* Initialize the audio context and start the song. */
        const [, , analyzer, bufferSize, buffer] = initAudio(audio, 512);       // Don't really need context or source...
        console.log(`Playing ${audio.src}!`);
        audio.play();
        
        /* Update meshes each frame using frequency data. */
        function animate() {
            analyzer.getByteFrequencyData(buffer);

            /* Trim off top quarter of frequencies (always sparse). */
            const trimmedArray = buffer.slice(0, bufferSize * 0.75),
                trimmedLength = trimmedArray.length;
            
            /* Split frequency data into lows, mids, highs (-ish) and mirror to cover up difference between highs and lows. */
            var lowerHalfArray = mirrorArray(trimmedArray.slice(0, (trimmedLength / 2))),
                middleHalfArray = mirrorArray(trimmedArray.slice((trimmedLength / 4) - 1, trimmedLength - (trimmedLength / 4))),
                upperHalfArray = mirrorArray(trimmedArray.slice((trimmedLength / 2) - 1, trimmedLength));
            
            /* Update the points in each circle */
            updateMeshGeometry( outerMesh, lowerHalfArray, outerPoints, options );
            updateMeshGeometry( middleMesh, middleHalfArray, middlePoints, options );
            updateMeshGeometry( innerMesh, upperHalfArray, innerPoints, options );

            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        }
        animate();
    });    
}

/* Initialize the program. */
start();