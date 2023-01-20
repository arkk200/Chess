import * as THREE from 'three';

export function getIntesectObject(e: MouseEvent, scene: THREE.Scene, camera: THREE.Camera) {
    const mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length === 0) return null;
    return intersects[0].object;
}