import * as THREE from 'three';
import * as VertexShaders from './vertex-shaders.mjs';
import * as FragmentShaders from './fragment-shaders.mjs';
import * as Setup from './setup.js';

/* Important Variables */
const windowHeight = window.innerHeight,
    windowWidth = window.innerWidth;

const scene = new THREE.Scene(),
    orthographicCamera = Setup.orthographicCamera(windowWidth, windowHeight),
    renderer = Setup.renderer(windowWidth, windowHeight);

/* Fragment Shader */
const fragmentShaderUniforms = {
    u_time: { value: 0 },
    u_resolution:  { value: new THREE.Vector3() },
};

/* Generate background mesh. */
const backgroundHeight = windowHeight,
    backgroundWidth = windowWidth,
    backgroundGeometry = new THREE.PlaneGeometry(backgroundWidth, backgroundHeight);
fragmentShaderUniforms.u_resolution.value.set(backgroundWidth, backgroundHeight, 1);
const 
    backgroundMaterial = new THREE.ShaderMaterial({
        vertexShader: VertexShaders.basicVertexShader,
        fragmentShader: FragmentShaders.voronoiShader,
        uniforms: fragmentShaderUniforms
    }),
    backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.position.set( 0, 0, -1 );
scene.add(backgroundMesh);

/* Animate the scene. */
function animate(milliseconds) {
    const seconds = milliseconds * 0.001;
    fragmentShaderUniforms.u_time.value = seconds;
    requestAnimationFrame( animate );
    renderer.render( scene, orthographicCamera );
}
animate();