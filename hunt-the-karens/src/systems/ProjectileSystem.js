import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';
import { PROJECTILE_MODELS } from '../config/weapons.js';

class Projectile {
    constructor() {
        this.mesh = null;
        this.origin = new THREE.Vector3();
        this.previousPosition = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.active = false;
        this.lifetime = 0;
        this.age = 0;
        this.damage = 0;
        this.radius = 0.25;
        this.bounce = 0.4;
        this.drag = 0.01;
        this.rotationSpeed = 8;
        this.gravity = -15;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.debugLine = null;
        this.collisionSegment = null;
    }

    init(config) {
        this.origin.copy(config.origin);
        this.direction.copy(config.direction).normalize();
        this.velocity.copy(this.direction).multiplyScalar(config.velocity);
        this.damage = config.damage;
        this.radius = config.radius;
        this.bounce = config.bounce;
        this.drag = config.drag;
        this.rotationSpeed = config.rotationSpeed;
        this.gravity = config.gravity;
        this.lifetime = config.lifetime || CONSTANTS.MAX_PROJECTILE_LIFETIME;
        this.age = 0;
        this.bounceCount = 0;
        this.active = true;

        this._createMesh(config.model);

        if (this.mesh) {
            this.mesh.position.copy(config.origin);
            this.previousPosition.copy(config.origin);
        }
    }

    _createMesh(modelType) {
        if (this.mesh) return;

        const def = PROJECTILE_MODELS[modelType];
        if (!def) return;

        const geometry = new THREE.BoxGeometry(
            def.scale[0],
            def.scale[1],
            def.scale[2],
            2, 1, 2
        );

        const material = new THREE.MeshStandardMaterial({
            color: def.color,
            emissive: def.emissive,
            emissiveIntensity: 0.15,
            roughness: 0.6,
            metalness: 0.1,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.userData.isProjectile = true;
    }

    update(delta) {
        if (!this.active || !this.mesh) return;

        this.previousPosition.copy(this.mesh.position);

        this.age += delta;
        if (this.age >= this.lifetime) {
            this.deactivate();
            return;
        }

        const gravityVec = new THREE.Vector3(0, this.gravity * delta, 0);
        this.velocity.add(gravityVec);

        const dragFactor = 1 - this.drag * delta * 60;
        this.velocity.multiplyScalar(Math.max(dragFactor, 0));

        const movement = this.velocity.clone().multiplyScalar(delta);
        const nextPosition = this.mesh.position.clone().add(movement);

        if (nextPosition.y < this.radius) {
            nextPosition.y = this.radius;
            this.velocity.y = Math.abs(this.velocity.y) * this.bounce;
            this.bounceCount++;

            if (this.bounceCount >= this.maxBounces || Math.abs(this.velocity.y) < 1) {
                this.velocity.y = 0;
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;

                if (this.velocity.length() < 0.5) {
                    this.deactivate();
                    return;
                }
            }
        }

        this.mesh.position.copy(nextPosition);

        const speed = this.velocity.length();
        if (speed > 0.1) {
            const axis = new THREE.Vector3(0, 0, 1);
            this.mesh.rotateOnWorldAxis(axis, this.rotationSpeed * delta * (speed / 10));
        }
    }

    deactivate() {
        this.active = false;
        if (this.collisionSegment) {
            this.collisionSegment.visible = false;
        }
    }

    getBounds() {
        if (!this.mesh) return null;
        return {
            center: this.mesh.position.clone(),
            radius: this.radius,
        };
    }

    getCollisionSegment() {
        if (!this.mesh) return null;
        return {
            start: this.previousPosition.clone(),
            end: this.mesh.position.clone(),
        };
    }
}

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.debugEnabled = false;
        this._initPool();
    }

    _initPool() {
        for (let i = 0; i < CONSTANTS.PROJECTILE_POOL_SIZE; i++) {
            const p = new Projectile();
            this.pool.push(p);
        }
    }

    spawnProjectile(config) {
        let projectile = this.pool.find(p => !p.active);
        if (!projectile) {
            projectile = new Projectile();
            this.pool.push(projectile);
        }

        projectile.init(config);
        this.scene.add(projectile.mesh);

        if (this.debugEnabled) {
            this._addDebugTrail(projectile);
        }

        this.active.push(projectile);
        return projectile;
    }

    update(delta) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.update(delta);

            if (!p.active) {
                this.scene.remove(p.mesh);
                if (p.debugLine) {
                    this.scene.remove(p.debugLine);
                    p.debugLine = null;
                }
                this.active.splice(i, 1);
            }
        }
    }

    getActiveProjectiles() {
        return this.active;
    }

    getActiveCount() {
        return this.active.length;
    }

    clear() {
        for (const p of this.active) {
            this.scene.remove(p.mesh);
            if (p.debugLine) {
                this.scene.remove(p.debugLine);
                p.debugLine = null;
            }
        }
        this.active = [];
    }

    setDebug(enabled) {
        this.debugEnabled = enabled;
        if (!enabled) {
            for (const p of this.active) {
                if (p.debugLine) {
                    this.scene.remove(p.debugLine);
                    p.debugLine = null;
                }
            }
        }
    }

    _addDebugTrail(projectile) {
        const points = [];
        const pos = projectile.mesh.position.clone();
        const vel = projectile.velocity.clone();
        let p = pos.clone();
        let v = vel.clone();

        for (let i = 0; i < 30; i++) {
            points.push(p.clone());
            v.y += projectile.gravity * 0.016;
            p.add(v.clone().multiplyScalar(0.016));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3,
        });
        projectile.debugLine = new THREE.Line(geometry, material);
        this.scene.add(projectile.debugLine);
    }
}
