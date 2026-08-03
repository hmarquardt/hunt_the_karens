import * as THREE from 'three';
import { Karen } from './Karen.js';
import { KAREN_TYPES } from '../config/karenTypes.js';
import { ReturnWithoutReceiptAbility } from './abilities/KarenAbilities.js';

export class RetailReturnKaren extends Karen {
    constructor(config) {
        const typeDef = KAREN_TYPES.retail_return;
        const merged = {
            ...typeDef,
            ...config,
            karenType: 'retail_return',
        };

        super(merged);
        this.name = typeDef.name;

        this.addAbility(new ReturnWithoutReceiptAbility(config.abilities?.returnWithoutReceipt));

        this._addRetailReturnAccessories();
    }

    _addRetailReturnAccessories() {
        const bagGeo = new THREE.BoxGeometry(0.18, 0.22, 0.1);
        const bagMat = new THREE.MeshStandardMaterial({
            color: 0xcc4444,
            roughness: 0.7,
            metalness: 0.05,
        });
        const bag = new THREE.Mesh(bagGeo, bagMat);
        bag.castShadow = true;
        this.addAccessory('shoppingBag', bag, 'leftHand');

        const boxGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x4488cc,
            roughness: 0.5,
            metalness: 0.1,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.castShadow = true;
        this.addAccessory('productBox', box, 'rightHand');

        const purseGeo = new THREE.BoxGeometry(0.14, 0.1, 0.06);
        const purseMat = new THREE.MeshStandardMaterial({
            color: 0x886644,
            roughness: 0.6,
            metalness: 0.15,
        });
        const purse = new THREE.Mesh(purseGeo, purseMat);
        purse.castShadow = true;
        this.addAccessory('purse', purse, 'leftHand');
    }
}
