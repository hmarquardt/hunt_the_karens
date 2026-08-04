import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/SkeletonUtils.js';

export class CharacterAsset {
    constructor() {
        this.gltf = null;
        this.rootScene = null;
        this.animations = [];
        this.animationMap = new Map();
        this.boundingBox = new THREE.Box3();
        this.loader = new GLTFLoader();
    }

    async load(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    this.gltf = gltf;
                    this.rootScene = gltf.scene;

                    this.rootScene.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this.boundingBox.setFromObject(this.rootScene);

                    if (gltf.animations && gltf.animations.length > 0) {
                        this.animations = gltf.animations;
                        for (const clip of gltf.animations) {
                            this.animationMap.set(clip.name.trim(), clip);
                        }
                    }

                    resolve(this);
                },
                undefined,
                reject
            );
        });
    }

    cloneInstance() {
        if (!this.rootScene) return null;

        const cloned = skeletonClone(this.rootScene);

        cloned.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return cloned;
    }

    getAnimationClips() {
        return this.animations;
    }

    getAnimationClip(name) {
        return this.animationMap.get(name);
    }

    getHeight() {
        return this.boundingBox.max.y - this.boundingBox.min.y;
    }

    getRadius() {
        const size = this.boundingBox.getSize(new THREE.Vector3());
        return Math.max(size.x, size.z) / 2;
    }
}
