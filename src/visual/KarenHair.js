import * as THREE from 'three';

export function buildKarenBob(headMesh, hairMaterial, parentGroup) {
    const hairGroup = new THREE.Group();
    hairGroup.name = 'hair';

    const frontLong = 0.2;
    const backShort = 0.12;
    const sideSweep = 0.15;

    // Main crown volume - stacked/back volume
    const crownGeo = new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const crown = new THREE.Mesh(crownGeo, hairMaterial);
    crown.position.set(0, 0.08, -0.02);
    crown.scale.set(1.05, 0.8, 0.9);
    crown.castShadow = true;
    hairGroup.add(crown);

    // Back shorter layers - stacked appearance
    for (let i = 0; i < 3; i++) {
        const layerGeo = new THREE.SphereGeometry(0.16 - i * 0.01, 10, 6, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.35);
        const layer = new THREE.Mesh(layerGeo, hairMaterial);
        layer.position.set(0, 0.04 - i * 0.025, -0.04 - i * 0.01);
        layer.scale.set(1.0, 0.7, 0.8);
        layer.castShadow = true;
        hairGroup.add(layer);
    }

    // Left side - shorter
    const leftSideGeo = new THREE.BoxGeometry(0.06, 0.16, 0.08);
    const leftSide = new THREE.Mesh(leftSideGeo, hairMaterial);
    leftSide.position.set(-0.15, -0.02, 0.0);
    leftSide.rotation.z = 0.1;
    leftSide.castShadow = true;
    hairGroup.add(leftSide);

    // Right side - longer front sweep (asymmetric)
    const rightSideGeo = new THREE.BoxGeometry(0.06, frontLong, 0.08);
    const rightSide = new THREE.Mesh(rightSideGeo, hairMaterial);
    rightSide.position.set(0.15, -0.04, 0.02);
    rightSide.rotation.z = -0.15;
    rightSide.rotation.x = -0.1;
    rightSide.castShadow = true;
    hairGroup.add(rightSide);

    // Front sweep - longer bangs on one side
    const sweepGeo = new THREE.BoxGeometry(0.12, 0.04, 0.1);
    const sweep = new THREE.Mesh(sweepGeo, hairMaterial);
    sweep.position.set(0.05, 0.1, 0.12);
    sweep.rotation.z = -0.3;
    sweep.rotation.x = -0.2;
    sweep.castShadow = true;
    hairGroup.add(sweep);

    // Side burn left
    const sideBurnGeo = new THREE.BoxGeometry(0.03, 0.08, 0.05);
    const leftBurn = new THREE.Mesh(sideBurnGeo, hairMaterial);
    leftBurn.position.set(-0.14, 0.06, 0.08);
    hairGroup.add(leftBurn);

    // Side burn right
    const rightBurn = new THREE.Mesh(sideBurnGeo, hairMaterial);
    rightBurn.position.set(0.14, 0.06, 0.08);
    hairGroup.add(rightBurn);

    // Back volume - rounded
    const backGeo = new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.5);
    const back = new THREE.Mesh(backGeo, hairMaterial);
    back.position.set(0, 0.0, -0.06);
    back.scale.set(1.0, 0.6, 0.7);
    back.castShadow = true;
    hairGroup.add(back);

    // Top highlight layer
    const highlightGeo = new THREE.SphereGeometry(0.13, 10, 6, Math.PI * 0.8, Math.PI * 0.4, 0, Math.PI * 0.3);
    const highlightMat = new THREE.MeshStandardMaterial({
        color: hairMaterial.color.clone().multiplyScalar(1.15),
        roughness: 0.7,
        metalness: 0.05,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(0, 0.1, 0.04);
    highlight.scale.set(1.0, 0.4, 0.8);
    hairGroup.add(highlight);

    parentGroup.add(hairGroup);

    return { group: hairGroup, highlightMaterial: highlightMat };
}

export function buildKarenPlatinumBob(headMesh, hairMaterial, parentGroup) {
    const platinumMat = new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        roughness: 0.75,
        metalness: 0.05,
    });
    return buildKarenBob(headMesh, platinumMat, parentGroup);
}

export function buildKarenBrunetteBob(headMesh, hairMaterial, parentGroup) {
    const brunetteMat = new THREE.MeshStandardMaterial({
        color: 0x5c3a1e,
        roughness: 0.85,
        metalness: 0.0,
    });
    return buildKarenBob(headMesh, brunetteMat, parentGroup);
}

export function buildKarenAuburnBob(headMesh, hairMaterial, parentGroup) {
    const auburnMat = new THREE.MeshStandardMaterial({
        color: 0x8b3a2a,
        roughness: 0.8,
        metalness: 0.02,
    });
    return buildKarenBob(headMesh, auburnMat, parentGroup);
}
