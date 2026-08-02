import * as THREE from 'three';
import { Karen } from '../entities/Karen.js';
import { KAREN_TYPES } from '../config/karenTypes.js';

export class ManagerKaren extends Karen {
    constructor(config = {}) {
        const typeDef = KAREN_TYPES.manager;
        const merged = {
            ...typeDef,
            ...config,
            karenType: 'manager',
        };

        super(merged);
        this.name = typeDef.name;

        this._addManagerAccessories();
    }

    _addManagerAccessories() {
        if (!this.mesh) return;

        const phoneGeo = new THREE.BoxGeometry(0.06, 0.12, 0.01);
        const phoneMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.8,
        });
        const phone = new THREE.Mesh(phoneGeo, phoneMat);
        phone.position.set(0.28, this.colliderHeight * 0.45, 0.05);
        phone.rotation.z = -0.3;
        phone.castShadow = true;
        this.mesh.add(phone);

        const clipboardGeo = new THREE.BoxGeometry(0.15, 0.22, 0.01);
        const clipboardMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8,
            metalness: 0.1,
        });
        const clipboard = new THREE.Mesh(clipboardGeo, clipboardMat);
        clipboard.position.set(-0.28, this.colliderHeight * 0.4, 0.1);
        clipboard.rotation.z = 0.15;
        clipboard.castShadow = true;
        this.mesh.add(clipboard);

        const paperGeo = new THREE.PlaneGeometry(0.12, 0.18);
        const paperMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0,
            side: THREE.DoubleSide,
        });
        const paper = new THREE.Mesh(paperGeo, paperMat);
        paper.position.set(-0.28, this.colliderHeight * 0.42, 0.11);
        this.mesh.add(paper);
    }

    attachCharacterAsset(characterInstance, animationClips) {
        super.attachCharacterAsset(characterInstance, animationClips);
        this._addManagerAccessories();
    }
}
