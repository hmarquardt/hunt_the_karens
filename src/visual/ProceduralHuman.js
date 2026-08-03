import * as THREE from 'three';

export class ProceduralHuman {
    constructor(config = {}) {
        this.gender = config.gender || 'female';
        this.bodyType = config.bodyType || 'average';
        this.group = new THREE.Group();
        this.bones = {};
        this.materials = {};
        this._build(config);
    }

    _build(config) {
        this._createMaterials(config);
        this._createBody();
        this._createHead();
        this._createLimbs();
    }

    _createMaterials(config) {
        const skinTone = config.skinTone || 0xd4a574;
        const outfitColor = config.outfitColor || 0x333333;
        const shoeColor = config.shoeColor || 0x222222;

        this.materials.skin = new THREE.MeshStandardMaterial({
            color: skinTone,
            roughness: 0.7,
            metalness: 0.05,
        });

        this.materials.outfit = new THREE.MeshStandardMaterial({
            color: outfitColor,
            roughness: 0.8,
            metalness: 0.05,
        });

        this.materials.shoes = new THREE.MeshStandardMaterial({
            color: shoeColor,
            roughness: 0.6,
            metalness: 0.1,
        });

        this.materials.hair = new THREE.MeshStandardMaterial({
            color: config.hairColor || 0xc8a864,
            roughness: 0.9,
            metalness: 0.0,
        });

        this.materials.eyes = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.1,
        });

        this.materials.mouth = new THREE.MeshStandardMaterial({
            color: 0xcc8888,
            roughness: 0.6,
            metalness: 0.0,
        });
    }

    _createBody() {
        const bodyGroup = new THREE.Group();
        bodyGroup.name = 'body';

        const scale = this._bodyScale();

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.18 * scale.width, 0.15 * scale.width, 0.55 * scale.height, 10);
        const torso = new THREE.Mesh(torsoGeo, this.materials.outfit);
        torso.position.y = 0.95 * scale.height;
        torso.castShadow = true;
        bodyGroup.add(torso);
        this.bones.torso = torso;

        // Chest
        const chestGeo = new THREE.CylinderGeometry(0.2 * scale.width, 0.18 * scale.width, 0.25 * scale.height, 10);
        const chest = new THREE.Mesh(chestGeo, this.materials.outfit);
        chest.position.y = 1.15 * scale.height;
        chest.castShadow = true;
        bodyGroup.add(chest);
        this.bones.chest = chest;

        // Hips
        const hipsGeo = new THREE.CylinderGeometry(0.16 * scale.width, 0.14 * scale.width, 0.15 * scale.height, 10);
        const hips = new THREE.Mesh(hipsGeo, this.materials.outfit);
        hips.position.y = 0.7 * scale.height;
        hips.castShadow = true;
        bodyGroup.add(hips);
        this.bones.hips = hips;

        this.group.add(bodyGroup);
        this.bones.body = bodyGroup;
    }

    _createHead() {
        const headGroup = new THREE.Group();
        headGroup.name = 'head';
        headGroup.position.y = 1.45;

        const scale = this._bodyScale();

        // Head
        const headGeo = new THREE.SphereGeometry(0.14 * scale.width, 12, 10);
        const head = new THREE.Mesh(headGeo, this.materials.skin);
        head.position.y = 0.14;
        head.scale.set(1, 1.1, 0.95);
        head.castShadow = true;
        headGroup.add(head);
        this.bones.head = head;

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
        leftEye.position.set(-0.045, 0.15, 0.12);
        headGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
        rightEye.position.set(0.045, 0.15, 0.12);
        headGroup.add(rightEye);

        // Mouth
        const mouthGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
        const mouth = new THREE.Mesh(mouthGeo, this.materials.mouth);
        mouth.position.set(0, 0.07, 0.13);
        headGroup.add(mouth);
        this.bones.mouth = mouth;

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8);
        const neck = new THREE.Mesh(neckGeo, this.materials.skin);
        neck.position.y = 0.02;
        neck.castShadow = true;
        headGroup.add(neck);

        this.group.add(headGroup);
        this.bones.headGroup = headGroup;
    }

    _createLimbs() {
        const scale = this._bodyScale();

        // Upper legs
        const upperLegGeo = new THREE.CylinderGeometry(0.07 * scale.width, 0.06 * scale.width, 0.4 * scale.height, 8);

        const leftUpperLeg = new THREE.Mesh(upperLegGeo, this.materials.outfit);
        leftUpperLeg.position.set(-0.08 * scale.width, 0.5 * scale.height, 0);
        leftUpperLeg.castShadow = true;
        this.group.add(leftUpperLeg);
        this.bones.leftUpperLeg = leftUpperLeg;

        const rightUpperLeg = new THREE.Mesh(upperLegGeo, this.materials.outfit);
        rightUpperLeg.position.set(0.08 * scale.width, 0.5 * scale.height, 0);
        rightUpperLeg.castShadow = true;
        this.bones.rightUpperLeg = rightUpperLeg;

        // Lower legs
        const lowerLegGeo = new THREE.CylinderGeometry(0.055 * scale.width, 0.045 * scale.width, 0.4 * scale.height, 8);

        const leftLowerLeg = new THREE.Mesh(lowerLegGeo, this.materials.skin);
        leftLowerLeg.position.set(-0.08 * scale.width, 0.2 * scale.height, 0);
        leftLowerLeg.castShadow = true;
        this.group.add(leftLowerLeg);
        this.bones.leftLowerLeg = leftLowerLeg;

        const rightLowerLeg = new THREE.Mesh(lowerLegGeo, this.materials.skin);
        rightLowerLeg.position.set(0.08 * scale.width, 0.2 * scale.height, 0);
        rightLowerLeg.castShadow = true;
        this.bones.rightLowerLeg = rightLowerLeg;

        // Feet/shoes
        const footGeo = new THREE.BoxGeometry(0.08 * scale.width, 0.06, 0.18);

        const leftFoot = new THREE.Mesh(footGeo, this.materials.shoes);
        leftFoot.position.set(-0.08 * scale.width, 0.03, 0.04);
        leftFoot.castShadow = true;
        this.group.add(leftFoot);
        this.bones.leftFoot = leftFoot;

        const rightFoot = new THREE.Mesh(footGeo, this.materials.shoes);
        rightFoot.position.set(0.08 * scale.width, 0.03, 0.04);
        rightFoot.castShadow = true;
        this.group.add(rightFoot);
        this.bones.rightFoot = rightFoot;

        // Arms
        const upperArmGeo = new THREE.CylinderGeometry(0.04 * scale.width, 0.035 * scale.width, 0.3, 8);

        const leftUpperArm = new THREE.Mesh(upperArmGeo, this.materials.outfit);
        leftUpperArm.position.set(-0.22 * scale.width, 1.05 * scale.height, 0);
        leftUpperArm.rotation.z = 0.15;
        leftUpperArm.castShadow = true;
        this.group.add(leftUpperArm);
        this.bones.leftUpperArm = leftUpperArm;

        const rightUpperArm = new THREE.Mesh(upperArmGeo, this.materials.outfit);
        rightUpperArm.position.set(0.22 * scale.width, 1.05 * scale.height, 0);
        rightUpperArm.rotation.z = -0.15;
        rightUpperArm.castShadow = true;
        this.group.add(rightUpperArm);
        this.bones.rightUpperArm = rightUpperArm;

        const forearmGeo = new THREE.CylinderGeometry(0.035 * scale.width, 0.03 * scale.width, 0.28, 8);

        const leftForearm = new THREE.Mesh(forearmGeo, this.materials.skin);
        leftForearm.position.set(-0.24 * scale.width, 0.85 * scale.height, 0);
        leftForearm.rotation.z = 0.1;
        leftForearm.castShadow = true;
        this.group.add(leftForearm);
        this.bones.leftForearm = leftForearm;

        const rightForearm = new THREE.Mesh(forearmGeo, this.materials.skin);
        rightForearm.position.set(0.24 * scale.width, 0.85 * scale.height, 0);
        rightForearm.rotation.z = -0.1;
        rightForearm.castShadow = true;
        this.group.add(rightForearm);
        this.bones.rightForearm = rightForearm;

        // Hands
        const handGeo = new THREE.SphereGeometry(0.035 * scale.width, 8, 6);

        const leftHand = new THREE.Mesh(handGeo, this.materials.skin);
        leftHand.position.set(-0.25 * scale.width, 0.7 * scale.height, 0);
        leftHand.castShadow = true;
        this.group.add(leftHand);
        this.bones.leftHand = leftHand;

        const rightHand = new THREE.Mesh(handGeo, this.materials.skin);
        rightHand.position.set(0.25 * scale.width, 0.7 * scale.height, 0);
        rightHand.castShadow = true;
        this.group.add(rightHand);
        this.bones.rightHand = rightHand;
    }

    _bodyScale() {
        const scales = {
            petite: { width: 0.88, height: 0.92 },
            average: { width: 1.0, height: 1.0 },
            curvy: { width: 1.1, height: 0.97 },
            tall: { width: 0.95, height: 1.08 },
        };
        return scales[this.bodyType] || scales.average;
    }

    addHair(hairBuilder) {
        if (hairBuilder) {
            hairBuilder(this.bones.head, this.materials.hair, this.group);
        }
    }

    addAccessory(name, mesh, parentBone) {
        const parent = parentBone ? this.bones[parentBone] : this.group;
        if (parent) {
            parent.add(mesh);
        }
    }

    getGroup() {
        return this.group;
    }

    getBone(name) {
        return this.bones[name];
    }

    setMaterial(type, material) {
        this.materials[type] = material;
    }

    dispose() {
        for (const mat of Object.values(this.materials)) {
            mat.dispose();
        }
    }
}
