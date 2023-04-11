import * as THREE from 'three';
import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";
import { createNoise2D } from "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/+esm";
import { avg, max, modulate } from './helpers.mjs';

/* Important Variables */
const noise = createNoise2D();
const clock = new THREE.Clock(true);

const windowHeight = window.innerHeight,
    windowWidth = window.innerWidth,
    aspectRatio = windowWidth / windowHeight;

const leftBound = -aspectRatio * 2,
    rightBound = aspectRatio * 2,
    topBound = 2,
    bottomBound = -2;

/**
 * Generate a circular region of random points for a voronoi diagram.
 * Reference: https://stackoverflow.com/a/50746409
 * @param { Number } n The number of points
 * @param { Number } r The radius of the region
 * @returns { THREE.Vector3[] } An array of points
 */
function generateRandomPoints(n, r) {
    const points = [];
    const innerGap = 0.5;
    for (let i = 0; i < n; ++i) {
        const radius = ((r - innerGap) * Math.sqrt(Math.random())) + innerGap,
            theta = 2 * Math.PI * Math.random(),
            xy = new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0);
        points.push(xy);
    }
    return points;
}
function generateCircumferencePoints(n, r) {
    const points = [];
    let step = 2*Math.PI / n;
    for (let i = 0; i < 2*Math.PI; i+=step) {
        const radius = r,
            // theta = 2 * Math.PI * Math.random(),
            theta = i,
            x = radius * Math.cos(theta),
            y = radius * Math.sin(theta),
            noiseXY = noise(x, y),
            // xy = new THREE.Vector3(x*noiseXY*0.1 + x, y*noiseXY*0.1 + y, 0);
            xy = new THREE.Vector3(x, y, 0);
        points.push(xy);
    }
    return points;
}

/**
 * Generate circumcenter meshes.
 * @param { THREE.Vector3[] } points The points used to generate the voronoi diagram
 * @returns { THREE.Points } The mesh of points used to generate the voronoi diagram
 */
function getPointsMesh(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points),
        material = new THREE.PointsMaterial({ color: color, size: 5 }),
        mesh = new THREE.Points(geometry, material);
    return mesh;
}
function getLineLoopMesh(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points),
        material = new THREE.PointsMaterial({ color: color, size: 5 }),
        mesh = new THREE.LineLoop(geometry, material);
    return mesh;
}



function updateMeshGeometry(mesh, data, points, options = {}) {
    const positions = mesh.geometry.attributes.position.array,
        step = 2 * Math.PI / points.length;
    for (let i = 0, p = 0; i <= points.length; ++i) {
        const theta = step * i,
            frequency = max(data), // avg(data),
            [newX, newY] = updatePoint(points[i % points.length], frequency, theta, 0.5, options);
        positions[p++] = newX;
        positions[p++] = newY;
        positions[p++] = 0;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
}



function updatePoint(point, freq, theta, radius, { amplitude = 1, movement = 0.1, absolute = false } = {}) {
    const maxFrequency = 255,
        time = clock.getElapsedTime(),
        x = point.x, y = point.y,
        noiseOffset = time * movement;
    let noiseXY = noise(x + noiseOffset, y + noiseOffset);
    if (absolute) { noiseXY = Math.abs(noiseXY); }
    const offsetX = modulate(freq, 0, maxFrequency, 0, amplitude) * noiseXY * Math.cos(theta),
        offsetY = modulate(freq, 0, maxFrequency, 0, amplitude) * noiseXY * Math.sin(theta);
    return [ x + offsetX*radius, y + offsetY*radius ];
}


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


function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild( renderer.domElement );
    return renderer;
}

function start() {

    var options = { amplitude: 1, movement: 0.1, absolute: false };

    window.onload = function () {
        /* Controls */
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
    };

    /* Scene */
    var scene = new THREE.Scene();
    const renderer = initRenderer();

    /* Camera */
    var camera = new THREE.OrthographicCamera(leftBound, rightBound, topBound, bottomBound, 0.1, 2);
    camera.position.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    /* Points */
    var outerPoints = generateCircumferencePoints(128, 1.5),
        middlePoints = generateCircumferencePoints(128, 1.0),
        innerPoints = generateCircumferencePoints(128, 0.5);

    /* Meshes */
    var outerMesh = getLineLoopMesh(outerPoints, 0xFFFF00),
        middleMesh = getLineLoopMesh(middlePoints, 0xFF00FF),
        innerMesh = getLineLoopMesh(innerPoints, 0x00FFFF);

    /* Render */
    scene.add(outerMesh);
    scene.add(middleMesh);
    scene.add(innerMesh);
    renderer.render( scene, camera );

    /* Play */
    const audio = document.getElementById('audio-controls');
    audio.addEventListener('playing', function () {
        /* Audio */
        const fftSize = 256,
            [ , , analyzer, bufferSize, buffer ] = initAudio(audio, fftSize);
        console.log(`Playing ${ audio.src }!`);
        audio.play();
        /* Animate */
        function animate() {
            // scene.clear();
            analyzer.getByteFrequencyData(buffer);
            var lowerHalfArray = buffer.slice(0, (bufferSize / 3)),
                middleHalfArray = buffer.slice((bufferSize / 3) - 1, bufferSize - 1 - (bufferSize / 3)),
                upperHalfArray = buffer.slice(2 * (bufferSize / 3) - 1, bufferSize - 1);
            updateMeshGeometry( outerMesh, lowerHalfArray, outerPoints, options );
            updateMeshGeometry( middleMesh, middleHalfArray, middlePoints, options );
            updateMeshGeometry( innerMesh, upperHalfArray, innerPoints, options );
            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        }
        animate();
    });    
}
start();