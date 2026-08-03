import * as THREE from 'three';

export class ProceduralHuman {
    constructor(config = {}) {
        this.gender = config.gender || 'female';
        this.bodyType = config.bodyType || 'average';
        this.group = new THREE.Group();
        this.bones = {};
        this.materials = {};
        this._trackedGeometries = new Set();
        this._trackedMaterials = new Set();
        this._accessoryMeshes = [];
        this._build(config);
    }

    _build(config) {
        this._createMaterials(config);
        this._createBody(config);
        this._createHead(config);
        this._createLimbs(config);
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

        for (const mat of Object.values(this.materials)) {
            this._trackedMaterials.add(mat);
        }
    }

    _createBody(config) {
        const scale = this._bodyScale();
        const hipsY = 0.7 * scale.height;

        const bodyRoot = new THREE.Group();
        bodyRoot.name = 'bodyRoot';
        bodyRoot.position.y = hipsY;
        this.group.add(bodyRoot);
        this.bones.bodyRoot = bodyRoot;

        // Hips
        const hipsGeo = new THREE.CylinderGeometry(0.16 * scale.width, 0.14 * scale.width, 0.15 * scale.height, 10);
        this._trackedGeometries.add(hipsGeo);
        const hips = new THREE.Mesh(hipsGeo, this.materials.outfit);
        hips.castShadow = true;
        bodyRoot.add(hips);
        this.bones.hips = hips;

        // Torso pivot
        const torsoPivot = new THREE.Group();
        torsoPivot.name = 'torsoPivot';
        torsoPivot.position.y = 0.25 * scale.height;
        bodyRoot.add(torsoPivot);
        this.bones.torsoPivot = torsoPivot;

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.18 * scale.width, 0.15 * scale.width, 0.55 * scale.height, 10);
        this._trackedGeometries.add(torsoGeo);
        const torso = new THREE.Mesh(torsoGeo, this.materials.outfit);
        torso.castShadow = true;
        torsoPivot.add(torso);
        this.bones.torso = torso;

        // Chest
        const chestGeo = new THREE.CylinderGeometry(0.2 * scale.width, 0.18 * scale.width, 0.25 * scale.height, 10);
        this._trackedGeometries.add(chestGeo);
        const chest = new THREE.Mesh(chestGeo, this.materials.outfit);
        chest.position.y = 0.2 * scale.height;
        chest.castShadow = true;
        torsoPivot.add(chest);
        this.bones.chest = chest;

        // Head pivot
        const headPivot = new THREE.Group();
        headPivot.name = 'headPivot';
        headPivot.position.y = 0.5 * scale.height;
        torsoPivot.add(headPivot);
        this.bones.headPivot = headPivot;

        // Left shoulder pivot
        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.name = 'leftShoulderPivot';
        leftShoulderPivot.position.set(-0.22 * scale.width, 0.1 * scale.height, 0);
        torsoPivot.add(leftShoulderPivot);
        this.bones.leftShoulderPivot = leftShoulderPivot;

        // Right shoulder pivot
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.name = 'rightShoulderPivot';
        rightShoulderPivot.position.set(0.22 * scale.width, 0.1 * scale.height, 0);
        torsoPivot.add(rightShoulderPivot);
        this.bones.rightShoulderPivot = rightShoulderPivot;

        // Left hip pivot
        const leftHipPivot = new THREE.Group();
        leftHipPivot.name = 'leftHipPivot';
        leftHipPivot.position.set(-0.08 * scale.width, -0.2 * scale.height, 0);
        bodyRoot.add(leftHipPivot);
        this.bones.leftHipPivot = leftHipPivot;

        // Right hip pivot
        const rightHipPivot = new THREE.Group();
        rightHipPivot.name = 'rightHipPivot';
        rightHipPivot.position.set(0.08 * scale.width, -0.2 * scale.height, 0);
        bodyRoot.add(rightHipPivot);
        this.bones.rightHipPivot = rightHipPivot;
    }

    _createHead(config) {
        const scale = this._bodyScale();

        const headGroup = new THREE.Group();
        headGroup.name = 'head';

        const headGeo = new THREE.SphereGeometry(0.14 * scale.width, 12, 10);
        this._trackedGeometries.add(headGeo);
        const head = new THREE.Mesh(headGeo, this.materials.skin);
        head.position.y = 0.14;
        head.scale.set(1, 1.1, 0.95);
        head.castShadow = true;
        headGroup.add(head);
        this.bones.head = head;

        const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
        this._trackedGeometries.add(eyeGeo);
        const leftEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
        leftEye.position.set(-0.045, 0.15, 0.12);
        headGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
        rightEye.position.set(0.045, 0.15, 0.12);
        headGroup.add(rightEye);

        const mouthGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
        this._trackedGeometries.add(mouthGeo);
        const mouth = new THREE.Mesh(mouthGeo, this.materials.mouth);
        mouth.position.set(0, 0.07, 0.13);
        headGroup.add(mouth);
        this.bones.mouth = mouth;

        const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8);
        this._trackedGeometries.add(neckGeo);
        const neck = new THREE.Mesh(neckGeo, this.materials.skin);
        neck.position.y = 0.02;
        neck.castShadow = true;
        headGroup.add(neck);

        this.bones.headPivot.add(headGroup);
        this.bones.headGroup = headGroup;
    }

    _createLimbs(config) {
        const scale = this._bodyScale();

        // --- LEFT ARM ---
        const leftUpperArmGeo = new THREE.CylinderGeometry(0.04 * scale.width, 0.035 * scale.width, 0.3, 8);
        this._trackedGeometries.add(leftUpperArmGeo);
        const leftUpperArm = new THREE.Mesh(leftUpperArmGeo, this.materials.outfit);
        leftUpperArm.castShadow = true;
        this.bones.leftShoulderPivot.add(leftUpperArm);
        this.bones.leftUpperArm = leftUpperArm;

        const leftElbowPivot = new THREE.Group();
        leftElbowPivot.name = 'leftElbowPivot';
        leftElbowPivot.position.set(-0.02 * scale.width, -0.2 * scale.height, 0);
        this.bones.leftShoulderPivot.add(leftElbowPivot);
        this.bones.leftElbowPivot = leftElbowPivot;

        const leftForearmGeo = new THREE.CylinderGeometry(0.035 * scale.width, 0.03 * scale.width, 0.28, 8);
        this._trackedGeometries.add(leftForearmGeo);
        const leftForearm = new THREE.Mesh(leftForearmGeo, this.materials.skin);
        leftForearm.castShadow = true;
        leftElbowPivot.add(leftForearm);
        this.bones.leftForearm = leftForearm;

        const leftHandPivot = new THREE.Group();
        leftHandPivot.name = 'leftHandPivot';
        leftHandPivot.position.set(-0.01 * scale.width, -0.15 * scale.height, 0);
        leftElbowPivot.add(leftHandPivot);
        this.bones.leftHandPivot = leftHandPivot;

        const leftHandGeo = new THREE.SphereGeometry(0.035 * scale.width, 8, 6);
        this._trackedGeometries.add(leftHandGeo);
        const leftHand = new THREE.Mesh(leftHandGeo, this.materials.skin);
        leftHand.castShadow = true;
        leftHandPivot.add(leftHand);
        this.bones.leftHand = leftHand;

        // --- RIGHT ARM ---
        const rightUpperArmGeo = new THREE.CylinderGeometry(0.04 * scale.width, 0.035 * scale.width, 0.3, 8);
        this._trackedGeometries.add(rightUpperArmGeo);
        const rightUpperArm = new THREE.Mesh(rightUpperArmGeo, this.materials.outfit);
        rightUpperArm.castShadow = true;
        this.bones.rightShoulderPivot.add(rightUpperArm);
        this.bones.rightUpperArm = rightUpperArm;

        const rightElbowPivot = new THREE.Group();
        rightElbowPivot.name = 'rightElbowPivot';
        rightElbowPivot.position.set(0.02 * scale.width, -0.2 * scale.height, 0);
        this.bones.rightShoulderPivot.add(rightElbowPivot);
        this.bones.rightElbowPivot = rightElbowPivot;

        const rightForearmGeo = new THREE.CylinderGeometry(0.035 * scale.width, 0.03 * scale.width, 0.28, 8);
        this._trackedGeometries.add(rightForearmGeo);
        const rightForearm = new THREE.Mesh(rightForearmGeo, this.materials.skin);
        rightForearm.castShadow = true;
        rightElbowPivot.add(rightForearm);
        this.bones.rightForearm = rightForearm;

        const rightHandPivot = new THREE.Group();
        rightHandPivot.name = 'rightHandPivot';
        rightHandPivot.position.set(0.01 * scale.width, -0.15 * scale.height, 0);
        rightElbowPivot.add(rightHandPivot);
        this.bones.rightHandPivot = rightHandPivot;

        const rightHandGeo = new THREE.SphereGeometry(0.035 * scale.width, 8, 6);
        this._trackedGeometries.add(rightHandGeo);
        const rightHand = new THREE.Mesh(rightHandGeo, this.materials.skin);
        rightHand.castShadow = true;
        rightHandPivot.add(rightHand);
        this.bones.rightHand = rightHand;

        // --- LEFT LEG ---
        const leftUpperLegGeo = new THREE.CylinderGeometry(0.07 * scale.width, 0.06 * scale.width, 0.4 * scale.height, 8);
        this._trackedGeometries.add(leftUpperLegGeo);
        const leftUpperLeg = new THREE.Mesh(leftUpperLegGeo, this.materials.outfit);
        leftUpperLeg.castShadow = true;
        this.bones.leftHipPivot.add(leftUpperLeg);
        this.bones.leftUpperLeg = leftUpperLeg;

        const leftKneePivot = new THREE.Group();
        leftKneePivot.name = 'leftKneePivot';
        leftKneePivot.position.set(0, -0.3 * scale.height, 0);
        this.bones.leftHipPivot.add(leftKneePivot);
        this.bones.leftKneePivot = leftKneePivot;

        const leftLowerLegGeo = new THREE.CylinderGeometry(0.055 * scale.width, 0.045 * scale.width, 0.4 * scale.height, 8);
        this._trackedGeometries.add(leftLowerLegGeo);
        const leftLowerLeg = new THREE.Mesh(leftLowerLegGeo, this.materials.skin);
        leftLowerLeg.castShadow = true;
        leftKneePivot.add(leftLowerLeg);
        this.bones.leftLowerLeg = leftLowerLeg;

        const leftAnklePivot = new THREE.Group();
        leftAnklePivot.name = 'leftAnklePivot';
        leftAnklePivot.position.set(0, -0.17 * scale.height, 0);
        leftKneePivot.add(leftAnklePivot);
        this.bones.leftAnklePivot = leftAnklePivot;

        const leftFootGeo = new THREE.BoxGeometry(0.08 * scale.width, 0.06, 0.18);
        this._trackedGeometries.add(leftFootGeo);
        const leftFoot = new THREE.Mesh(leftFootGeo, this.materials.shoes);
        leftFoot.castShadow = true;
        leftAnklePivot.add(leftFoot);
        this.bones.leftFoot = leftFoot;

        // --- RIGHT LEG ---
        const rightUpperLegGeo = new THREE.CylinderGeometry(0.07 * scale.width, 0.06 * scale.width, 0.4 * scale.height, 8);
        this._trackedGeometries.add(rightUpperLegGeo);
        const rightUpperLeg = new THREE.Mesh(rightUpperLegGeo, this.materials.outfit);
        rightUpperLeg.castShadow = true;
        this.bones.rightHipPivot.add(rightUpperLeg);
        this.bones.rightUpperLeg = rightUpperLeg;

        const rightKneePivot = new THREE.Group();
        rightKneePivot.name = 'rightKneePivot';
        rightKneePivot.position.set(0, -0.3 * scale.height, 0);
        this.bones.rightHipPivot.add(rightKneePivot);
        this.bones.rightKneePivot = rightKneePivot;

        const rightLowerLegGeo = new THREE.CylinderGeometry(0.055 * scale.width, 0.045 * scale.width, 0.4 * scale.height, 8);
        this._trackedGeometries.add(rightLowerLegGeo);
        const rightLowerLeg = new THREE.Mesh(rightLowerLegGeo, this.materials.skin);
        rightLowerLeg.castShadow = true;
        rightKneePivot.add(rightLowerLeg);
        this.bones.rightLowerLeg = rightLowerLeg;

        const rightAnklePivot = new THREE.Group();
        rightAnklePivot.name = 'rightAnklePivot';
        rightAnklePivot.position.set(0, -0.17 * scale.height, 0);
        rightKneePivot.add(rightAnklePivot);
        this.bones.rightAnklePivot = rightAnklePivot;

        const rightFootGeo = new THREE.BoxGeometry(0.08 * scale.width, 0.06, 0.18);
        this._trackedGeometries.add(rightFootGeo);
        const rightFoot = new THREE.Mesh(rightFootGeo, this.materials.shoes);
        rightFoot.castShadow = true;
        rightAnklePivot.add(rightFoot);
        this.bones.rightFoot = rightFoot;
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
            this._accessoryMeshes.push(mesh);
            mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) this._trackedGeometries.add(child.geometry);
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((m) => this._trackedMaterials.add(m));
                        } else {
                            this._trackedMaterials.add(child.material);
                        }
                    }
                }
            });
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

    animate(state, time, options = {}) {
        const { isMoving = false, speed = 0, isAlive = true, hpRatio = 1, abilityVariant = null, hitIntensity = 1 } = options;

        this._resetPose();

        switch (state) {
            case 'idle':
                this._animateIdle(time);
                break;
            case 'walk':
                this._animateWalk(time, speed);
                break;
            case 'confront':
                this._animateConfront(time);
                break;
            case 'hit':
                this._animateHit(time, hitIntensity);
                break;
            case 'ability':
                this._animateAbility(time, abilityVariant);
                break;
            case 'defeat':
                this._animateDefeat(time);
                break;
        }

        if (!isAlive) {
            this._animateDefeated(time);
        }
    }

    _resetPose() {
        const b = this.bones;
        if (b.headPivot) b.headPivot.rotation.set(0, 0, 0);
        if (b.headGroup) b.headGroup.rotation.set(0, 0, 0);
        if (b.torsoPivot) b.torsoPivot.rotation.set(0, 0, 0);
        if (b.leftShoulderPivot) b.leftShoulderPivot.rotation.set(0, 0, 0);
        if (b.rightShoulderPivot) b.rightShoulderPivot.rotation.set(0, 0, 0);
        if (b.leftElbowPivot) b.leftElbowPivot.rotation.set(0, 0, 0);
        if (b.rightElbowPivot) b.rightElbowPivot.rotation.set(0, 0, 0);
        if (b.leftHipPivot) b.leftHipPivot.rotation.set(0, 0, 0);
        if (b.rightHipPivot) b.rightHipPivot.rotation.set(0, 0, 0);
        if (b.leftKneePivot) b.leftKneePivot.rotation.set(0, 0, 0);
        if (b.rightKneePivot) b.rightKneePivot.rotation.set(0, 0, 0);
        if (b.bodyRoot) b.bodyRoot.rotation.set(0, 0, 0);
    }

    _animateIdle(time) {
        const bob = Math.sin(time * 1.5) * 0.005;
        const sway = Math.sin(time * 0.8) * 0.01;
        const b = this.bones;

        if (b.headPivot) {
            b.headPivot.position.y = 0.5 * this._bodyScale().height + bob;
            b.headPivot.rotation.y = sway;
        }
        if (b.torsoPivot) {
            b.torsoPivot.rotation.z = sway * 0.5;
        }
    }

    _animateWalk(time, speed) {
        const stride = Math.min(speed * 2, 3) * 0.15;
        const legSwing = Math.sin(time * 5) * stride;
        const armSwing = Math.sin(time * 5 + Math.PI) * stride * 0.7;
        const b = this.bones;

        if (b.leftHipPivot) b.leftHipPivot.rotation.x = legSwing;
        if (b.rightHipPivot) b.rightHipPivot.rotation.x = -legSwing;
        if (b.leftShoulderPivot) b.leftShoulderPivot.rotation.x = armSwing;
        if (b.rightShoulderPivot) b.rightShoulderPivot.rotation.x = -armSwing;

        const bob = Math.abs(Math.sin(time * 5)) * 0.01;
        if (b.bodyRoot) b.bodyRoot.position.y = 0.7 * this._bodyScale().height + bob;
    }

    _animateConfront(time) {
        const tension = Math.sin(time * 3) * 0.02;
        const b = this.bones;

        if (b.headPivot) {
            b.headPivot.rotation.x = -0.1 + tension;
        }
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.z = 0.1;
            b.leftShoulderPivot.rotation.x = -0.2;
        }
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.z = -0.1;
            b.rightShoulderPivot.rotation.x = -0.3 + Math.sin(time * 4) * 0.1;
        }
        if (b.torsoPivot) {
            b.torsoPivot.rotation.x = -0.05;
        }
    }

    _animateHit(time, intensity = 1) {
        const recoil = Math.sin(time * 8) * 0.15 * intensity * Math.exp(-time * 3);
        const b = this.bones;

        if (b.headPivot) {
            b.headPivot.rotation.x = recoil;
            b.headPivot.rotation.z = recoil * 0.5;
        }
        if (b.torsoPivot) {
            b.torsoPivot.rotation.x = recoil * 0.3;
        }
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.z = 0.15 + recoil * 0.5;
        }
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.z = -0.15 - recoil * 0.5;
        }
    }

    _animateAbility(time, variant = null) {
        const b = this.bones;

        switch (variant) {
            case 'callManager':
                this._poseCallManager(time);
                break;
            case 'violationNotice':
                this._poseViolationNotice(time);
                break;
            case 'returnWithoutReceipt':
                this._poseReturnWithoutReceipt(time);
                break;
            default:
                this._poseGenericAbility(time);
                break;
        }
    }

    _poseCallManager(time) {
        const windup = Math.sin(time * 2) * 0.1;
        const b = this.bones;

        // Right hand raises phone to ear
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.x = -1.2 + windup;
            b.rightShoulderPivot.rotation.z = -0.3;
        }
        if (b.rightElbowPivot) {
            b.rightElbowPivot.rotation.x = -0.8 + windup * 0.5;
        }
        // Head angles toward phone
        if (b.headPivot) {
            b.headPivot.rotation.x = -0.2;
            b.headPivot.rotation.z = 0.15;
        }
        // Left hand gestures outward
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.x = -0.3;
            b.leftShoulderPivot.rotation.z = 0.25;
        }
    }

    _poseViolationNotice(time) {
        const b = this.bones;
        const point = Math.sin(time * 2) * 0.15;

        // Left hand raises clipboard
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.x = -0.6;
            b.leftShoulderPivot.rotation.z = 0.15;
        }
        if (b.leftElbowPivot) {
            b.leftElbowPivot.rotation.x = -0.5;
        }
        // Head looks down at clipboard
        if (b.headPivot) {
            b.headPivot.rotation.x = -0.25;
            b.headPivot.rotation.z = -0.1;
        }
        // Right arm points toward target
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.x = -0.5 + point;
            b.rightShoulderPivot.rotation.z = -0.25;
        }
    }

    _poseReturnWithoutReceipt(time) {
        const b = this.bones;
        const lift = Math.sin(time * 2) * 0.1;

        // Product/shopping bag lifts
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.x = -0.5 + lift;
            b.rightShoulderPivot.rotation.z = -0.15;
        }
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.x = -0.3 + lift * 0.5;
        }
        // Torso leans forward
        if (b.torsoPivot) {
            b.torsoPivot.rotation.x = -0.1;
        }
    }

    _poseGenericAbility(time) {
        const windup = Math.sin(time * 2) * 0.1;
        const b = this.bones;

        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.x = -0.5 + windup;
            b.rightShoulderPivot.rotation.z = -0.35;
        }
        if (b.headPivot) {
            b.headPivot.rotation.x = -0.15;
        }
    }

    _animateDefeat(time) {
        const slump = Math.min(time * 0.5, 1);
        const b = this.bones;

        if (b.torsoPivot) {
            b.torsoPivot.rotation.x = slump * 0.4;
        }
        if (b.headPivot) {
            b.headPivot.rotation.x = slump * 0.6;
        }
        if (b.leftShoulderPivot) b.leftShoulderPivot.rotation.z = slump * 0.5;
        if (b.rightShoulderPivot) b.rightShoulderPivot.rotation.z = -slump * 0.5;
    }

    _animateDefeated(time) {
        const b = this.bones;

        if (b.torsoPivot) {
            b.torsoPivot.rotation.x = 0.8;
        }
        if (b.headPivot) {
            b.headPivot.rotation.x = 1.2;
        }
        if (b.leftShoulderPivot) {
            b.leftShoulderPivot.rotation.z = 0.6;
            b.leftShoulderPivot.rotation.x = 0.3;
        }
        if (b.rightShoulderPivot) {
            b.rightShoulderPivot.rotation.z = -0.6;
            b.rightShoulderPivot.rotation.x = 0.3;
        }
    }

    dispose() {
        for (const geo of this._trackedGeometries) {
            geo.dispose();
        }
        this._trackedGeometries.clear();

        for (const mat of this._trackedMaterials) {
            mat.dispose();
        }
        this._trackedMaterials.clear();

        this._accessoryMeshes = [];
    }
}
