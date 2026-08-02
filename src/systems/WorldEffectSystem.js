import * as THREE from 'three';

export class WorldEffect {
    constructor(config) {
        this.id = config.id;
        this.position = config.position?.clone() || new THREE.Vector3();
        this.duration = config.duration || 10;
        this.remaining = this.duration;
        this.radius = config.radius || 2;
        this.type = config.type || 'notice';
        this.statusEffect = config.statusEffect || null;
        this.statusDuration = config.statusDuration || 0;
        this.label = config.label || '';
        this.mesh = null;
        this.active = true;
        this.debugVisible = false;
        this._debugMesh = null;

        this._createMesh();
    }

    _createMesh() {
        const group = new THREE.Group();

        if (this.type === 'notice') {
            const boardGeo = new THREE.BoxGeometry(0.4, 0.3, 0.02);
            const boardMat = new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                roughness: 0.8,
                metalness: 0.1,
            });
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.y = 0.8;
            board.castShadow = true;
            group.add(board);

            const clipGeo = new THREE.BoxGeometry(0.45, 0.04, 0.03);
            const clipMat = new THREE.MeshStandardMaterial({
                color: 0x8B7355,
                roughness: 0.6,
                metalness: 0.2,
            });
            const clip = new THREE.Mesh(clipGeo, clipMat);
            clip.position.set(0, 0.98, 0);
            group.add(clip);

            const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 0.4;
            group.add(pole);

        } else if (this.type === 'rejected_item') {
            const boxGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
            const boxMat = new THREE.MeshStandardMaterial({
                color: 0x884422,
                roughness: 0.8,
                metalness: 0.1,
            });
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.y = 0.1;
            box.rotation.y = Math.random() * Math.PI;
            box.castShadow = true;
            group.add(box);

            const receiptGeo = new THREE.PlaneGeometry(0.1, 0.15);
            const receiptMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.9,
                side: THREE.DoubleSide,
            });
            const receipt = new THREE.Mesh(receiptGeo, receiptMat);
            receipt.position.set(0.1, 0.15, 0.08);
            receipt.rotation.z = 0.3;
            group.add(receipt);
        }

        group.position.copy(this.position);
        this.mesh = group;
        this.mesh.userData.isWorldEffect = true;
        this.mesh.userData.worldEffectRef = this;
    }

    update(delta, debugEnabled) {
        if (!this.active) return;

        this.remaining -= delta;

        if (this.remaining <= 0) {
            this.expire();
            return;
        }

        if (debugEnabled) {
            this._showDebug();
        } else {
            this._hideDebug();
        }
    }

    _showDebug() {
        if (this._debugMesh) return;

        const geo = new THREE.RingGeometry(this.radius - 0.05, this.radius + 0.05, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: this.type === 'notice' ? 0xffaa00 : 0xff4444,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        this._debugMesh = new THREE.Mesh(geo, mat);
        this._debugMesh.rotation.x = -Math.PI / 2;
        this._debugMesh.position.copy(this.position);
        this._debugMesh.position.y = 0.05;
        this._debugMesh.userData.isDebug = true;
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.add(this._debugMesh);
        }
    }

    _hideDebug() {
        if (this._debugMesh && this._debugMesh.parent) {
            this._debugMesh.parent.remove(this._debugMesh);
            this._debugMesh.geometry.dispose();
            this._debugMesh.material.dispose();
            this._debugMesh = null;
        }
    }

    expire() {
        this.active = false;
        if (this._debugMesh && this._debugMesh.parent) {
            this._debugMesh.parent.remove(this._debugMesh);
        }
    }

    dispose() {
        this.expire();
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}

export class WorldEffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.effects = [];
    }

    add(config) {
        const effect = new WorldEffect(config);
        this.effects.push(effect);
        this.scene.add(effect.mesh);
        return effect;
    }

    update(delta, debugEnabled) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const e = this.effects[i];
            e.update(delta, debugEnabled);

            if (!e.active) {
                this.scene.remove(e.mesh);
                this.effects.splice(i, 1);
            }
        }
    }

    clear() {
        for (const e of this.effects) {
            e.dispose();
        }
        this.effects = [];
    }

    getActiveEffects() {
        return this.effects;
    }

    getActiveCount() {
        return this.effects.length;
    }

    getEffectsInRadius(position, radius) {
        return this.effects.filter(e => {
            if (!e.active) return false;
            return e.position.distanceTo(position) <= (e.radius + radius);
        });
    }
}
