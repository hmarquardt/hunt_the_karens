import * as THREE from 'three';

export class ResourceTracker {
    constructor() {
        this._geometries = new Set();
        this._materials = new Set();
        this._textures = new Set();
        this._objects = [];
    }

    trackGeometry(geometry) {
        if (geometry) this._geometries.add(geometry);
        return geometry;
    }

    trackMaterial(material) {
        if (material) {
            if (Array.isArray(material)) {
                material.forEach((m) => this._materials.add(m));
            } else {
                this._materials.add(material);
            }
        }
        return material;
    }

    trackTexture(texture) {
        if (texture) this._textures.add(texture);
        return texture;
    }

    trackObject(object3D) {
        if (object3D) {
            this._objects.push(object3D);
            object3D.traverse((child) => {
                if (child.isMesh || child.isLine || child.isPoints) {
                    if (child.geometry) this._geometries.add(child.geometry);
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((m) => this._materials.add(m));
                        } else {
                            this._materials.add(child.material);
                        }
                    }
                }
            });
        }
        return object3D;
    }

    createMaterial(MaterialClass, params) {
        const mat = new MaterialClass(params);
        this._materials.add(mat);
        return mat;
    }

    createTexture(canvasOrLoader) {
        let texture;
        if (canvasOrLoader instanceof HTMLCanvasElement) {
            texture = new THREE.CanvasTexture(canvasOrLoader);
        } else {
            texture = canvasOrLoader;
        }
        this._textures.add(texture);
        return texture;
    }

    dispose() {
        for (const geo of this._geometries) {
            geo.dispose();
        }
        this._geometries.clear();

        for (const mat of this._materials) {
            if (mat.map) mat.map.dispose();
            mat.dispose();
        }
        this._materials.clear();

        for (const tex of this._textures) {
            tex.dispose();
        }
        this._textures.clear();

        this._objects = [];
    }

    getStats() {
        return {
            geometries: this._geometries.size,
            materials: this._materials.size,
            textures: this._textures.size,
            objects: this._objects.length,
        };
    }
}

export function disposeObjectTree(object3D, options = {}) {
    const { geometries = new Set(), materials = new Set(), textures = new Set() } = options;

    object3D.traverse((child) => {
        if (child.isMesh || child.isLine || child.isPoints) {
            if (child.geometry && !geometries.has(child.geometry)) {
                child.geometry.dispose();
                geometries.add(child.geometry);
            }
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                for (const mat of mats) {
                    if (!materials.has(mat)) {
                        if (mat.map && !textures.has(mat.map)) {
                            mat.map.dispose();
                            textures.add(mat.map);
                        }
                        mat.dispose();
                        materials.add(mat);
                    }
                }
            }
        }
    });
}
