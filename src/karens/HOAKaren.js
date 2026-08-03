import * as THREE from 'three';
import { Karen } from '../entities/Karen.js';
import { KAREN_TYPES } from '../config/karenTypes.js';
import { ViolationNoticeAbility } from '../entities/abilities/KarenAbilities.js';

export class HOAKaren extends Karen {
    constructor(config = {}) {
        const typeDef = KAREN_TYPES.hoa;
        const merged = {
            ...typeDef,
            ...config,
            karenType: 'hoa',
        };

        super(merged);
        this.name = typeDef.name;

        this.addAbility(new ViolationNoticeAbility(config.abilities?.violationNotice));

        this._addHOAAccessories();
    }

    _addHOAAccessories() {
        if (!this.mesh) return;

        const clipboardGeo = new THREE.BoxGeometry(0.18, 0.25, 0.01);
        const clipboardMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.7,
            metalness: 0.1,
        });
        const clipboard = new THREE.Mesh(clipboardGeo, clipboardMat);
        clipboard.position.set(-0.3, this.colliderHeight * 0.45, 0.08);
        clipboard.rotation.z = 0.1;
        clipboard.castShadow = true;
        this.mesh.add(clipboard);

        const paperGeo = new THREE.PlaneGeometry(0.14, 0.2);
        const paperMat = new THREE.MeshStandardMaterial({
            color: 0xfffff0,
            roughness: 0.9,
            metalness: 0,
            side: THREE.DoubleSide,
        });
        const paper = new THREE.Mesh(paperGeo, paperMat);
        paper.position.set(-0.3, this.colliderHeight * 0.47, 0.09);
        this.mesh.add(paper);

        const tapeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
        const tapeMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.4,
            metalness: 0.6,
        });
        const tape = new THREE.Mesh(tapeGeo, tapeMat);
        tape.position.set(0.3, this.colliderHeight * 0.5, 0.05);
        tape.rotation.z = Math.PI / 6;
        tape.castShadow = true;
        this.mesh.add(tape);

        const visorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12, 1, false, 0, Math.PI);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1,
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, this.colliderHeight * 0.75, 0.1);
        visor.rotation.x = -0.3;
        visor.castShadow = true;
        this.mesh.add(visor);
    }

    attachCharacterAsset(characterInstance, animationClips) {
        super.attachCharacterAsset(characterInstance, animationClips);
        this._addHOAAccessories();
    }
}
