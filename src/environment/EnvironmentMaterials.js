import * as THREE from 'three';

export class EnvironmentMaterials {
    constructor() {
        this._materials = {};
        this._init();
    }

    _init() {
        this._materials.asphalt = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.95,
            metalness: 0,
        });

        this._materials.concrete = new THREE.MeshStandardMaterial({
            color: 0xbbbbbb,
            roughness: 0.85,
            metalness: 0.05,
        });

        this._materials.concreteDark = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.9,
            metalness: 0.05,
        });

        this._materials.paintWhite = new THREE.MeshStandardMaterial({
            color: 0xf0f0e8,
            roughness: 0.8,
            metalness: 0,
        });

        this._materials.paintYellow = new THREE.MeshStandardMaterial({
            color: 0xe8c840,
            roughness: 0.75,
            metalness: 0,
        });

        this._materials.paintBlue = new THREE.MeshStandardMaterial({
            color: 0x4477cc,
            roughness: 0.7,
            metalness: 0,
        });

        this._materials.storeWall = new THREE.MeshStandardMaterial({
            color: 0xd4c8b0,
            roughness: 0.8,
            metalness: 0.05,
        });

        this._materials.storeAccent = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.75,
            metalness: 0.1,
        });

        this._materials.storeRed = new THREE.MeshStandardMaterial({
            color: 0xcc2200,
            roughness: 0.6,
            metalness: 0.1,
        });

        this._materials.glass = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.4,
        });

        this._materials.glassDark = new THREE.MeshStandardMaterial({
            color: 0x222233,
            roughness: 0.05,
            metalness: 0.5,
        });

        this._materials.metalDark = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.8,
        });

        this._materials.metalGalvanized = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.7,
        });

        this._materials.rubber = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.95,
            metalness: 0,
        });

        this._materials.mulch = new THREE.MeshStandardMaterial({
            color: 0x5c3a1e,
            roughness: 0.95,
            metalness: 0,
        });

        this._materials.foliage = new THREE.MeshStandardMaterial({
            color: 0x3d6b35,
            roughness: 0.9,
            metalness: 0,
        });

        this._materials.foliageDark = new THREE.MeshStandardMaterial({
            color: 0x2d5025,
            roughness: 0.9,
            metalness: 0,
        });

        this._materials.treeBark = new THREE.MeshStandardMaterial({
            color: 0x6b4226,
            roughness: 0.95,
            metalness: 0,
        });

        this._materials.curbYellow = new THREE.MeshStandardMaterial({
            color: 0xddaa00,
            roughness: 0.8,
            metalness: 0,
        });

        this._materials.bollardYellow = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            roughness: 0.5,
            metalness: 0.3,
        });

        this._materials.bollardConcrete = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.85,
            metalness: 0.05,
        });
    }

    get(name) {
        return this._materials[name];
    }

    dispose() {
        for (const mat of Object.values(this._materials)) {
            mat.dispose();
        }
    }
}
