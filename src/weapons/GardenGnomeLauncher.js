import { ProjectileWeapon } from './ProjectileWeapon.js';

export class GardenGnomeLauncher extends ProjectileWeapon {
    constructor(camera, inputManager, projectileSystem, vfxSystem, audioSystem, config) {
        super(camera, inputManager, projectileSystem, vfxSystem, audioSystem, config);
        this.name = config.displayName;
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
            maxBounces: this.config.maxBounces,
            lifetime: 8,
            impactEffect: this.config.impactEffect,
            statusEffect: this.config.statusEffect,
            statusDuration: this.config.statusDuration,
            tags: this.config.tags || [],
        });

        this.audioSystem.playGnomeThrow();
        if (this.view) this.view.fireAnimation();

        return true;
    }
}
