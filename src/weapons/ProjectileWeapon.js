import * as THREE from 'three';
import { Weapon } from './Weapon.js';

export class ProjectileWeapon extends Weapon {
    constructor(camera, inputManager, projectileSystem, vfxSystem, audioSystem, config) {
        super();
        this.camera = camera;
        this.inputManager = inputManager;
        this.projectileSystem = projectileSystem;
        this.vfxSystem = vfxSystem;
        this.audioSystem = audioSystem;
        this.config = config;
        this.cooldown = config.cooldown;
        this.ammo = config.ammo;
        this.maxAmmo = config.ammo;
        this.spread = config.spread || 0;
        this.name = config.displayName || 'Unknown';
        this.view = null;
    }

    setView(view) {
        this.view = view;
    }

    init() {}

    update(delta) {}

    onSelect() {
        if (this.view) this.view.show();
    }

    onDeselect() {
        if (this.view) this.view.hide();
    }

    canFire() {
        const now = performance.now();
        if ((now - this.lastFireTime) < this.cooldown) return false;
        if (this.ammo !== Infinity && this.ammo <= 0) return false;
        return true;
    }

    fire() {
        if (!this.canFire()) return false;
        this.lastFireTime = performance.now();

        if (this.ammo !== Infinity) {
            this.ammo--;
        }

        return true;
    }

    _getAimDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        if (this.spread > 0) {
            direction.x += (Math.random() - 0.5) * this.spread;
            direction.y += (Math.random() - 0.5) * this.spread;
            direction.z += (Math.random() - 0.5) * this.spread;
            direction.normalize();
        }

        return direction;
    }

    reload() {
        if (this.ammo !== Infinity) {
            this.ammo = this.maxAmmo;
        }
    }

    dispose() {}
}
