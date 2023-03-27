import * as THREE from 'three';
import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";

/* Important Variables */
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
    for (let i = 0; i < n; ++i) {
        const radius = r * Math.sqrt(Math.random()),
            theta = 2 * Math.PI * Math.random(),
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


/* Scene */
var scene = new THREE.Scene();

/* Camera */
var camera = new THREE.OrthographicCamera(leftBound, rightBound, topBound, bottomBound, 0.1, 2);
camera.position.set(0, 0, -1);
camera.lookAt(0, 0, 0);

/* Voronoi */
var points = generateRandomPoints(80, topBound*0.8);
// const regions = getVoronoiRegions(points);

// /* Meshes */
// const regionPointMesh = getPointsMesh(points);
// scene.add(regionPointMesh);
// const regionBorderMeshes = getAllRegionBorderMeshes(regions);
// for (let i = 0; i < regions.length; ++i) {
//     scene.add(regionBorderMeshes[i]);
// }


/* Render */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild( renderer.domElement );
renderer.render(scene, camera);


function animate() {
    scene.clear();

    // points = points.map((v) => {    // Rotate all points around an axis.
    //     return v.applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 100);
    // });
    // points = points.map((v) => {    // Apply random walk to each point.
    //     return new THREE.Vector3(
    //         (Math.random() - 0.5) * 0.01 + v.x,
    //         (Math.random() - 0.5) * 0.01 + v.y,
    //         0
    //     )
    // });
    const regions = getVoronoiRegions(points);
    const hull = getVoronoiHull(points);
    const hullPoints = points.filter( (v, i) => hull.includes(i) );

    /* Meshes */
    const regionPointMesh = getPointsMesh(points, 0xFF0000);
    scene.add(regionPointMesh);
    const hullPointMesh = getPointsMesh(hullPoints, 0x00FF00);
    scene.add(hullPointMesh);
    const regionBorderMeshes = getAllRegionBorderMeshes(regions);
    for (let i = 0; i < regions.length; ++i) {
        scene.add(regionBorderMeshes[i]);
    }

    // requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();