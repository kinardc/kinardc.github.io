import * as THREE from 'three';
import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";
import { createNoise2D } from "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/+esm";
import { avg, max, modulate } from './helpers.mjs';

/* Important Variables */
const noise = createNoise2D();

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
            xy = new THREE.Vector3(x*noiseXY*0.1 + x, y*noiseXY*0.1 + y, 0);
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




function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild( renderer.domElement );
    return renderer;
}

function start() {

    window.onload = function () {
        console.log('inside window.onload!!!');  
    };
    /* Scene */
    var scene = new THREE.Scene();
    const renderer = initRenderer();

    /* Camera */
    var camera = new THREE.OrthographicCamera(leftBound, rightBound, topBound, bottomBound, 0.1, 2);
    camera.position.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    /* Meshes */
    const fftSize = 512;

    var middlePoints = generateCircumferencePoints(128, 1.0);
    var middleMesh = getLineLoopMesh(middlePoints, 0xFF00FF);
    scene.add(middleMesh);

    var outerPoints = generateCircumferencePoints(128, 1.5);
    var outerMesh = getLineLoopMesh(outerPoints, 0xFFFF00);
    scene.add(outerMesh);

    var innerPoints = generateCircumferencePoints(128, 0.5);
    var innerMesh = getLineLoopMesh(innerPoints, 0x00FFFF);
    scene.add(innerMesh);

    renderer.render( scene, camera );

    /* Audio */
    const audio = document.getElementById('audio-controls');
    audio.src = 'audio/control.mp3';
    var audioSource, analyzer, bufferLength, frequencyBinData;
    audio.addEventListener('playing', function () {
        const audioContext = new AudioContext();
        console.log(`Playing ${ audio.src }!`);
        audio.play();
        audioSource = audioContext.createMediaElementSource(audio);     // Connect audio element to AudioContext
        analyzer = audioContext.createAnalyser();                       // Create audio analyzer
        audioSource.connect(analyzer);                                  // Expose analyzer to audio element
        analyzer.connect(audioContext.destination);                     // Expose default audio output device to analyzer
        
        analyzer.fftSize = fftSize;                                         // Number of samples
        bufferLength = analyzer.frequencyBinCount;                      // Number of nodes to draw (always fftSize/2)
        frequencyBinData = new Uint8Array(bufferLength);                // Frequency data must be stored as uint8
        
        /* Render */
        const clock = new THREE.Clock(true);
        // const noise = createNoise2D();

        function animate() {
            // scene.clear();

            analyzer.getByteFrequencyData(frequencyBinData);

            var lowerHalfArray = frequencyBinData.slice(0, (frequencyBinData.length/3));
            var upperHalfArray = frequencyBinData.slice(2*(frequencyBinData.length/3) - 1, frequencyBinData.length - 1);
            var middleHalfArray = frequencyBinData.slice((frequencyBinData.length/3) - 1, frequencyBinData.length - 1 - (frequencyBinData.length/3));
            var lowerHalfAverage = avg(lowerHalfArray),
                lowerHalfMax = max(lowerHalfArray),
                middleHalfAverage = avg(middleHalfArray),
                middleHalfMax = avg(middleHalfArray),
                upperHalfAverage = avg(upperHalfArray),
                upperHalfMax = max(upperHalfArray);
            
            // console.log(upperHalfMax);
            
            const maxFrequency = 255,
                step = 2 * Math.PI / 128;
            
            function updatePoint(point, freq, theta, radius) {
                const time = clock.getElapsedTime();
                const amplitude = 2,
                    x = point.x,
                    y = point.y,
                    noiseXY = noise(x + time*0.1, y + time*0.1),
                    offsetX = modulate(amplitude*freq, 0, (amplitude + 1)*maxFrequency, 0, radius) * Math.abs(noiseXY*Math.cos(theta)),
                    offsetY = modulate(amplitude*freq, 0, (amplitude + 1)*maxFrequency, 0, radius) * Math.abs(noiseXY*Math.sin(theta));
                return [ x + offsetX, y + offsetY ];
            }
            
            const lowerPositions = outerMesh.geometry.attributes.position.array,
                middlePositions = middleMesh.geometry.attributes.position.array,
                upperPositions = innerMesh.geometry.attributes.position.array;
            let index = 0;
            for (let i = 0; i < 128; i++) {
                const theta = step + i,
                    bassFrequency = lowerHalfMax,
                    midsFrequency = middleHalfAverage,
                    trebleFrequency = upperHalfMax;
                const [bassX, bassY] = updatePoint(outerPoints[i], bassFrequency, theta, 0.5),
                    [midsX, midsY] = updatePoint(middlePoints[i], midsFrequency, theta, 0.5),
                    [trebleX, trebleY] = updatePoint(innerPoints[i], trebleFrequency, theta, 1.0);

                lowerPositions[index] = bassX;
                middlePositions[index] = midsX;
                upperPositions[index] = trebleX;
                index++;

                lowerPositions[index] = bassY;
                middlePositions[index] = midsY;
                upperPositions[index] = trebleY;
                index++;

                lowerPositions[index] = 0;
                middlePositions[index] = 0;
                upperPositions[index] = 0;
                index++;
            }
            innerMesh.geometry.attributes.position.needsUpdate = true;
            middleMesh.geometry.attributes.position.needsUpdate = true;
            outerMesh.geometry.attributes.position.needsUpdate = true;

            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        }
        animate();
    });    
}
start();