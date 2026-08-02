import { ProjectileWeapon } from './ProjectileWeapon.js';
import { WEAPON_DEFS } from '../config/weapons.js';

export class CrocLauncher extends ProjectileWeapon {
    constructor(camera, inputManager, projectileSystem, audioSystem) {
        const config = WEAPON_DEFS.croc;
        super(camera, projectileSystem, audioSystem, config);
        this.inputManager = inputManager;
        this.name = 'Croc';
    }

    update(delta) {
        const clicked = this.inputManager.consumeMouseClick();
        if (clicked === 0) {
            this.fire();
        }
    }
}
