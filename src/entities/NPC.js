import * as THREE from 'three';

let _nextUid = 1;

export class NPC {
    constructor(config) {
        this.uid = _nextUid++;
        this.mesh = null;
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.health = config.health || 100;
        this.maxHealth = config.health || 100;
        this.speed = config.speed || 2;
        this.isAlive = true;
        this.colliderRadius = config.colliderRadius || 0.5;
        this.colliderHeight = config.colliderHeight || 1.6;
        this.state = 'idle';
        this.stateTimer = 0;
        if (config.buildDefaultMesh !== false) {
            this._buildMesh(config);
        }
    }

    _buildMesh(config) {
        const group = new THREE.Group();

        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, this.colliderHeight * 0.6, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: config.bodyColor || 0x888888,
            roughness: 0.7,
            metalness: 0.1,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = this.colliderHeight * 0.3;
        body.castShadow = true;
        group.add(body);

        const headGeo = new THREE.SphereGeometry(0.2, 12, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: config.headColor || 0xd4a574,
            roughness: 0.8,
            metalness: 0.05,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = this.colliderHeight * 0.7;
        head.castShadow = true;
        group.add(head);

        this.mesh = group;
        this.mesh.position.copy(this.position);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    takeDamage(amount, source) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            this.onDefeated(source);
        }
        return this.health;
    }

    update(delta) {
        if (!this.isAlive) return;
        this.stateTimer += delta;
    }

    onDefeated(source) {
        this.state = 'defeated';
    }

    getBounds() {
        return {
            center: this.position.clone(),
            radius: this.colliderRadius,
            height: this.colliderHeight,
        };
    }
}
