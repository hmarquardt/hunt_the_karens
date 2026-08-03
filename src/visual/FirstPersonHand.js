import * as THREE from 'three';

export function createFirstPersonHand(config = {}) {
    const group = new THREE.Group();
    const skinTone = config.skinTone || 0xd4a574;

    const skinMat = new THREE.MeshStandardMaterial({
        color: skinTone,
        roughness: 0.7,
        metalness: 0.05,
    });

    const sleeveMat = new THREE.MeshStandardMaterial({
        color: config.sleeveColor || 0x334433,
        roughness: 0.8,
        metalness: 0.05,
    });

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3, 10);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(0, -0.15, 0);
    forearm.rotation.x = Math.PI / 6;
    forearm.castShadow = false;
    group.add(forearm);

    // Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.15, 10);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.set(0, -0.28, -0.03);
    sleeve.rotation.x = Math.PI / 6;
    group.add(sleeve);

    // Palm
    const palmGeo = new THREE.BoxGeometry(0.07, 0.02, 0.1);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, 0, 0.02);
    group.add(palm);

    // Fingers - simplified block fingers
    const fingerGeo = new THREE.BoxGeometry(0.015, 0.015, 0.06);

    const fingerPositions = [
        [-0.025, 0, 0.07],
        [-0.008, 0, 0.08],
        [0.008, 0, 0.08],
        [0.025, 0, 0.07],
    ];

    for (const pos of fingerPositions) {
        const finger = new THREE.Mesh(fingerGeo, skinMat);
        finger.position.set(...pos);
        finger.rotation.x = Math.PI / 8;
        group.add(finger);
    }

    // Thumb
    const thumbGeo = new THREE.BoxGeometry(0.02, 0.015, 0.04);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-0.04, 0.005, 0.02);
    thumb.rotation.z = -0.4;
    thumb.rotation.x = Math.PI / 6;
    group.add(thumb);

    return { group, materials: { skin: skinMat, sleeve: sleeveMat } };
}
