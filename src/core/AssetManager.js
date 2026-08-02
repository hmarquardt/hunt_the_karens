import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { CharacterAsset } from '../animation/CharacterAsset.js';

export class AssetManager {
    constructor() {
        this.textures = new Map();
        this.models = new Map();
        this.characterAssets = new Map();
        this.audioBuffers = new Map();
        this.gltfLoader = new GLTFLoader();
        this._loadPromises = [];
    }

    async loadAll() {
        console.log('[AssetManager] Loading assets...');

        const startTime = performance.now();

        await Promise.all(this._loadPromises);

        const elapsed = (performance.now() - startTime).toFixed(0);
        console.log(`[AssetManager] Loaded ${this.textures.size} textures, ${this.models.size} models, ${this.characterAssets.size} character assets, ${this.audioBuffers.size} audio files in ${elapsed}ms`);
    }

    loadTexture(name, url) {
        const promise = new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (tex) => {
                    this.textures.set(name, tex);
                    resolve(tex);
                },
                undefined,
                reject
            );
        });
        this._loadPromises.push(promise);
        return promise;
    }

    async loadModel(name, url) {
        const promise = new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    this.models.set(name, gltf);
                    resolve(gltf);
                },
                undefined,
                reject
            );
        });
        this._loadPromises.push(promise);
        return promise;
    }

    async loadCharacterAsset(name, url) {
        const asset = new CharacterAsset();
        const promise = asset.load(url).then(() => {
            this.characterAssets.set(name, asset);
            return asset;
        });
        this._loadPromises.push(promise);
        return promise;
    }

    async loadAudio(name, url) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        this.audioBuffers.set(name, buffer);
        return buffer;
    }

    getTexture(name) {
        return this.textures.get(name);
    }

    getModel(name) {
        return this.models.get(name);
    }

    getCharacterAsset(name) {
        return this.characterAssets.get(name);
    }

    getAudio(name) {
        return this.audioBuffers.get(name);
    }
}
