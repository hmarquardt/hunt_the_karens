import * as THREE from 'three';
import { Karen } from '../entities/Karen.js';
import { KAREN_TYPES } from '../config/karenTypes.js';
import { CallManagerAbility } from '../entities/abilities/KarenAbilities.js';

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

        this.addAbility(new CallManagerAbility(config.abilities?.callManager));

        this._addManagerAccessories();
    }

    _addManagerAccessories() {
        const phoneGeo = new THREE.BoxGeometry(0.06, 0.12, 0.01);
        const phoneMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.8,
        });
        const phone = new THREE.Mesh(phoneGeo, phoneMat);
        phone.castShadow = true;
        this.addAccessory('phone', phone, 'rightHand');

        const clipboardGeo = new THREE.BoxGeometry(0.15, 0.22, 0.01);
        const clipboardMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8,
            metalness: 0.1,
        });
        const clipboard = new THREE.Mesh(clipboardGeo, clipboardMat);
        clipboard.castShadow = true;
        this.addAccessory('clipboard', clipboard, 'leftHand');

        const paperGeo = new THREE.PlaneGeometry(0.12, 0.18);
        const paperMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0,
            side: THREE.DoubleSide,
        });
        const paper = new THREE.Mesh(paperGeo, paperMat);
        this.addAccessory('paper', paper, 'leftHand');
    }
}
