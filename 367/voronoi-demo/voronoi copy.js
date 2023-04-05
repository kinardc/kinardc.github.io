import * as THREE from 'three';
import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";
import { createNoise2D } from "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/+esm";

/* Important Variables */
const windowHeight = window.innerHeight,
    windowWidth = window.innerWidth,
    aspectRatio = windowWidth / windowHeight;

const leftBound = -aspectRatio * 2,
    rightBound = aspectRatio * 2,
    topBound = 2,
    bottomBound = -2;
console.log('left:   ', leftBound);
console.log('right:  ', rightBound);
console.log('top:    ', topBound);
console.log('bottom: ', bottomBound);

/**
 * Generate a circular region of random points for a voronoi diagram.
 * Reference: https://stackoverflow.com/a/50746409
 * @param { Number } n The number of points
 * @param { Number } r The radius of the region
 * @returns { THREE.Vector3[] } An array of points
 */
function generateRandomPoints(n, r) {
    const points = [];
    for (let i = 0; i < n; ++i) {
        const radius = r * Math.sqrt(Math.random()),
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
            xy = new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0);
        points.push(xy);
    }
    return points;
}

/**
 * Get voronoi regions (sets of vertices) from a set of points.
 * @param { THREE.Vector3[] } points
 * @returns { THREE.Vector3[][] }
 */
function getVoronoiRegions(points) {
    const delaunay = Delaunay.from(points.map( (v) => [ v.x, v.y ] )),
        boundingBox = [leftBound, bottomBound, rightBound, topBound],
        voronoi = delaunay.voronoi(boundingBox),
        polygons = [];
    for (let i = 0; i < points.length; ++i) {
        const polygon = voronoi.cellPolygon(i).map( (v) => new THREE.Vector3(v[0], v[1], 0) );
        polygons.push(polygon);
    }
    return polygons;
}

function getVoronoiHull(points) {
    const delaunay = Delaunay.from(points.map((v) => [v.x, v.y])),
        hull = delaunay.hull;
    return hull;
}

// GEOMETRY
/**
 * Generate region edge mesh and add to scene.
 * @param { THREE.Vector3[] } vertices The voronoi vertices of a region.
 * @returns { THREE.Line } The mesh of the region border.
 */
function getRegionBorderMesh(vertices) {
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices),
        material = new THREE.LineBasicMaterial({ color: 0xFFFFFF }),
        mesh = new THREE.Line(geometry, material);
    return mesh;
}

/**
 * Draw the meshes of all regions in the voronoi diagram.
 * @param { THREE.Vector3[][] } regions An array of voronoi region vertex arrays
 * @returns { THREE.Line[] } An array of region border meshes
 */
function getAllRegionBorderMeshes(regions) {
    const meshes = [];
    for (let i = 0; i < regions.length; ++i) {
        meshes.push( getRegionBorderMesh(regions[i]) );
    }
    return meshes;
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




function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild( renderer.domElement );
    return renderer;
}

function fractionate(val, minVal, maxVal) {
    // console.log('in voronoi#fractionate: ', val, minVal, maxVal);
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    // console.log('in voronoi#modulate: ', val, minVal, maxVal, outMin, outMax, fr, delta);
    return outMin + (fr * delta);
}

function max(typedArray) {
    return typedArray.reduce( (a, b) => Math.max(a, b) );
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

    var points = [
        ...generateCircumferencePoints(32, topBound * 0.5),
        new THREE.Vector3(0, 0, 0)
    ];

    /* Voronoi */
    var regions = getVoronoiRegions(points);
    var hull = getVoronoiHull(points);
    var hullPoints = points.filter( (_, i) => hull.includes(i) );
    
    /* Meshes */
    var regionPointMesh = getPointsMesh(points, 0xFF0000);
    scene.add(regionPointMesh);
    var hullPointMesh = getPointsMesh(hullPoints, 0x00FF00);
    scene.add(hullPointMesh);
    var regionBorderMeshes = getAllRegionBorderMeshes(regions);
    for (let i = 0; i < regions.length; ++i) {
        scene.add(regionBorderMeshes[i]);
    }
    renderer.render( scene, camera );

    /* Audio */
    const audio = document.getElementById('audio-controls');
    audio.src = 'audio/things-id-do-for-u.mp3';
    var audioSource, analyzer, bufferLength, frequencyBinData;
    audio.addEventListener('playing', function () {
        const audioContext = new AudioContext();
        console.log(`Playing ${ audio.src }!`);
        audio.play();
        audioSource = audioContext.createMediaElementSource(audio);     // Connect audio element to AudioContext
        analyzer = audioContext.createAnalyser();                       // Create audio analyzer
        audioSource.connect(analyzer);                                  // Expose analyzer to audio element
        analyzer.connect(audioContext.destination);                     // Expose default audio output device to analyzer
        
        analyzer.fftSize = 64;                                          // Number of samples
        bufferLength = analyzer.frequencyBinCount;                      // Number of nodes to draw (always fftSize/2)
        frequencyBinData = new Uint8Array(bufferLength);                // Frequency data must be stored as uint8
        
        /* Render */
        const clock = new THREE.Clock(true);
        const noise = createNoise2D();
        // console.log(points);

        function animate() {
            scene.clear();

            const time = clock.getElapsedTime();                              
            analyzer.getByteFrequencyData(frequencyBinData);
            var lowerHalfArray = frequencyBinData.slice(0, (frequencyBinData.length/2));
            var upperHalfArray = frequencyBinData.slice((frequencyBinData.length/2) - 1, frequencyBinData.length - 1);
            var mirroredArray = [...lowerHalfArray, ...lowerHalfArray.reverse()]

            var pointsCopy = points.map( (v) => new THREE.Vector3(v.x, v.y, v.z) );
            
            let step = 2 * Math.PI / 32;
            let maxFreq = max(frequencyBinData);
            for (let i = 0; i < 32; ++i) {
                const theta = step * i,
                    x = points[i].x,
                    y = points[i].y,
                    offsetX = modulate(mirroredArray[i] + noise(x + time*0.1, y + time*0.1)*mirroredArray[i], 0, 255, 0, 1.0 - 0.2 - 0.5) * Math.cos(theta),
                    offsetY = modulate(mirroredArray[i] + noise(x + time*0.1, y + time*0.1)*mirroredArray[i], 0, 255, 0, 1.0 - 0.2 - 0.5) * Math.sin(theta);
                pointsCopy[i].x = x + offsetX;
                pointsCopy[i].y = y + offsetY;
                // console.log(noise(x, y));
            }

            // regions = getVoronoiRegions(pointsCopy);
            // if (!regions) { console.log('exiting!'); return; }
            // hull = getVoronoiHull(pointsCopy);
            // hullPoints = pointsCopy.filter( (_, i) => hull.includes(i) );

            /* Meshes */
            regionPointMesh = getPointsMesh(pointsCopy, 0xFF0000);
            scene.add(regionPointMesh);
            // hullPointMesh = getPointsMesh(hullPoints, 0x00FF00);
            // scene.add(hullPointMesh);
            // regionBorderMeshes = getAllRegionBorderMeshes(regions);
            // for (let i = 0; i < regions.length; ++i) {
            //     scene.add(regionBorderMeshes[i]);
            // }

            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        }
        animate();
    });    
}
start();

// console.log(modulate(100, 0, 1000, 0, 1));