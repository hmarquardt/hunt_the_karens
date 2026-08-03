import * as THREE from 'three';

export function createCrocView(config = {}) {
    const group = new THREE.Group();
    const color = config.color || 0x2d5a27;
    const soleColor = config.soleColor || 0x1a3a18;
    const strapColor = config.strapColor || 0x224422;

    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.05,
    });

    const soleMat = new THREE.MeshStandardMaterial({
        color: soleColor,
        roughness: 0.8,
        metalness: 0.0,
    });

    const strapMat = new THREE.MeshStandardMaterial({
        color: strapColor,
        roughness: 0.7,
        metalness: 0.05,
    });

    // Toe box - rounded front
    const toeShape = new THREE.Shape();
    toeShape.moveTo(0, 0);
    toeShape.quadraticCurveTo(0.12, 0.04, 0.14, 0);
    toeShape.quadraticCurveTo(0.12, -0.04, 0, -0.04);
    toeShape.lineTo(0, 0);

    const toeExtrudeSettings = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
    const toeGeo = new THREE.ExtrudeGeometry(toeShape, toeExtrudeSettings);
    const toe = new THREE.Mesh(toeGeo, bodyMat);
    toe.rotation.x = -Math.PI / 2;
    toe.position.set(-0.07, 0, -0.06);
    toe.castShadow = true;
    group.add(toe);

    // Main body - dome shape
    const bodyGeo = new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.04, -0.02);
    body.scale.set(0.9, 0.6, 0.7);
    body.castShadow = true;
    group.add(body);

    // Heel cup
    const heelGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.06, 10, 1, true, 0, Math.PI);
    const heel = new THREE.Mesh(heelGeo, bodyMat);
    heel.position.set(0, 0.03, 0.08);
    heel.rotation.y = Math.PI;
    heel.castShadow = true;
    group.add(heel);

    // Heel strap
    const strapCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.08, 0.04, 0.08),
        new THREE.Vector3(0, 0.1, 0.06),
        new THREE.Vector3(0.08, 0.04, 0.08)
    );
    const strapGeo = new THREE.TubeGeometry(strapCurve, 12, 0.012, 6, false);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.castShadow = true;
    group.add(strap);

    // Ventilation holes
    const holeGeo = new THREE.CircleGeometry(0.015, 8);
    const holeMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });

    const holePositions = [
        [-0.04, 0.06, -0.04],
        [0.04, 0.06, -0.04],
        [0, 0.07, -0.02],
        [-0.06, 0.04, 0],
        [0.06, 0.04, 0],
    ];

    for (const pos of holePositions) {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(...pos);
        hole.rotation.x = -Math.PI / 4;
        group.add(hole);
    }

    // Sole
    const soleGeo = new THREE.BoxGeometry(0.2, 0.02, 0.14);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.01, 0);
    sole.castShadow = true;
    group.add(sole);

    // Sole tread pattern
    const treadGeo = new THREE.BoxGeometry(0.18, 0.005, 0.01);
    for (let i = -2; i <= 2; i++) {
        const tread = new THREE.Mesh(treadGeo, soleMat);
        tread.position.set(0, -0.02, i * 0.025);
        group.add(tread);
    }

    return { group, materials: { body: bodyMat, sole: soleMat, strap: strapMat } };
}

export function createCrocProjectile(config = {}) {
    const { group } = createCrocView(config);

    // Simplify for projectile (fewer details, same silhouette)
    group.scale.set(1.5, 1.5, 1.5);

    return group;
}

export function createWaterBalloon(config = {}) {
    const group = new THREE.Group();
    const color = config.color || 0x4488ff;

    // Main balloon body - stretched sphere
    const bodyGeo = new THREE.SphereGeometry(0.12, 12, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(0.9, 1.1, 0.9);
    body.castShadow = true;
    group.add(body);

    // Internal water color variation
    const waterGeo = new THREE.SphereGeometry(0.1, 10, 8);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x6699cc,
        roughness: 0.2,
        metalness: 0.05,
        transparent: true,
        opacity: 0.6,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.scale.set(0.85, 1.0, 0.85);
    water.position.y = -0.01;
    group.add(water);

    // Tied neck at top
    const neckGeo = new THREE.CylinderGeometry(0.015, 0.03, 0.05, 8);
    const neckMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
    });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.y = 0.14;
    neck.castShadow = true;
    group.add(neck);

    // Knot at neck
    const knotGeo = new THREE.SphereGeometry(0.025, 8, 6);
    const knot = new THREE.Mesh(knotGeo, neckMat);
    knot.position.y = 0.17;
    knot.scale.set(1.2, 0.8, 1.0);
    group.add(knot);

    // Subtle highlight
    const highlightGeo = new THREE.SphereGeometry(0.04, 8, 6, 0, Math.PI * 0.5, 0, Math.PI * 0.3);
    const highlightMat = new THREE.MeshStandardMaterial({
        color: 0xaaccff,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.4,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(0.04, 0.04, 0.06);
    group.add(highlight);

    return { group, materials: { body: bodyMat, water: waterMat, neck: neckMat } };
}

export function createGardenGnome(config = {}) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        roughness: 0.7,
        metalness: 0.05,
    });

    const hatMat = new THREE.MeshStandardMaterial({
        color: 0xcc3333,
        roughness: 0.6,
        metalness: 0.05,
    });

    const beardMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.9,
        metalness: 0.0,
    });

    const skinMat = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.7,
        metalness: 0.05,
    });

    const bootMat = new THREE.MeshStandardMaterial({
        color: 0x332211,
        roughness: 0.8,
        metalness: 0.05,
    });

    const beltMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.6,
        metalness: 0.1,
    });

    // Body/shirt
    const bodyGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.25, 10);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.15;
    body.castShadow = true;
    group.add(body);

    // Belt
    const beltGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 10);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.08;
    group.add(belt);

    // Belt buckle
    const buckleGeo = new THREE.BoxGeometry(0.04, 0.03, 0.02);
    const buckleMat = new THREE.MeshStandardMaterial({
        color: 0xddaa44,
        roughness: 0.3,
        metalness: 0.6,
    });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.08, 0.11);
    group.add(buckle);

    // Head
    const headGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.35;
    head.castShadow = true;
    group.add(head);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.03, 8, 6);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 0.34, 0.09);
    nose.scale.set(1, 0.9, 1.2);
    group.add(nose);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.03, 0.36, 0.07);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.03, 0.36, 0.07);
    group.add(rightEye);

    // Beard - full, bushy
    const beardGeo = new THREE.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.5);
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.set(0, 0.3, 0.02);
    beard.scale.set(1, 1.2, 0.9);
    group.add(beard);

    // Mustache
    const mustacheGeo = new THREE.BoxGeometry(0.06, 0.015, 0.03);
    const mustache = new THREE.Mesh(mustacheGeo, beardMat);
    mustache.position.set(0, 0.33, 0.08);
    mustache.rotation.z = 0.2;
    group.add(mustache);

    // Pointed hat
    const hatBaseGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.04, 10);
    const hatBase = new THREE.Mesh(hatBaseGeo, hatMat);
    hatBase.position.y = 0.42;
    hatBase.castShadow = true;
    group.add(hatBase);

    // Hat cone
    const hatConeGeo = new THREE.ConeGeometry(0.1, 0.2, 10);
    const hatCone = new THREE.Mesh(hatConeGeo, hatMat);
    hatCone.position.y = 0.54;
    hatCone.rotation.z = 0.15;
    hatCone.castShadow = true;
    group.add(hatCone);

    // Hat tip bend
    const hatTipGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const hatTip = new THREE.Mesh(hatTipGeo, hatMat);
    hatTip.position.set(0.03, 0.64, 0);
    group.add(hatTip);

    // Boots
    const bootGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8);

    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.06, 0.04, 0);
    leftBoot.castShadow = true;
    group.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.06, 0.04, 0);
    rightBoot.castShadow = true;
    group.add(rightBoot);

    // Boot toes
    const bootToeGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const leftToe = new THREE.Mesh(bootToeGeo, bootMat);
    leftToe.position.set(-0.06, 0.02, 0.04);
    leftToe.scale.set(1, 0.6, 0.8);
    group.add(leftToe);
    const rightToe = new THREE.Mesh(bootToeGeo, bootMat);
    rightToe.position.set(0.06, 0.02, 0.04);
    rightToe.scale.set(1, 0.6, 0.8);
    group.add(rightToe);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.03, 8, 6);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.13, 0.12, 0);
    group.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.13, 0.12, 0);
    group.add(rightHand);

    return { group, materials: { body: bodyMat, hat: hatMat, beard: beardMat, skin: skinMat, boots: bootMat } };
}
