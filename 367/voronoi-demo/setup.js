import * as THREE from 'three';

export function perspectiveCamera(windowWidth, windowHeight) {
    const cameraFOV = 100,
        cameraNearPlane = 0.1,
        cameraFarPlane = 10;
    const camera = new THREE.PerspectiveCamera(
        cameraFOV, windowWidth / windowHeight,
        cameraNearPlane, cameraFarPlane
    );
    camera.position.set(0, 0, 0);
    return camera;
}

export function orthographicCamera(windowWidth, windowHeight) {
    const windowHalfWidth = windowWidth * 0.5, windowHalfHeight = windowHeight*0.5,
        cameraLeft = -windowHalfWidth, cameraRight = windowHalfWidth,
        cameraTop = windowHalfHeight, cameraBottom = -windowHalfHeight,
        cameraNearPlane = -1, cameraFarPlane = 10;
    const orthographicCamera = new THREE.OrthographicCamera(
        cameraLeft, cameraRight, cameraTop, cameraBottom,
        cameraNearPlane, cameraFarPlane
    );
    orthographicCamera.position.set(0, 0, 0);
    return orthographicCamera;
}

export function renderer(windowWidth, windowHeight) {
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize( windowWidth, windowHeight );
    document.body.appendChild( renderer.domElement );
    renderer.setClearColor(0xFFFFFF);
    return renderer;
}