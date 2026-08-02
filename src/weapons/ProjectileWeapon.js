import * as THREE from 'three';
import { Weapon } from './Weapon.js';

export class ProjectileWeapon extends Weapon {
    constructor(camera, projectileSystem, audioSystem, config) {
        super();
        this.camera = camera;
        this.projectileSystem = projectileSystem;
        this.audioSystem = audioSystem;
        this.config = config;
        this.cooldown = config.cooldown;
        this.ammo = config.ammo;
        this.spread = config.spread || 0;
    }

    fire() {
        if (!super.fire()) return false;

        const direction = this._getAimDirection();
        const origin = this.camera.position.clone();

        this.projectileSystem.spawnProjectile({
            origin: origin.clone(),
            direction: direction.clone(),
            velocity: this.config.velocity,
            gravity: this.config.gravity,
            mass: this.config.mass,
            radius: this.config.radius,
            bounce: this.config.bounce,
            drag: this.config.drag,
            damage: this.config.baseDamage,
            model: this.config.projectileModel,
            rotationSpeed: this.config.rotationSpeed,
            lifetime: 8,
        });

        this.audioSystem.playShoot();

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
}
