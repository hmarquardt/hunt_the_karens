import { WEAPON_DEFS } from '../config/weapons.js';

export class WeaponManager {
    constructor(camera, inputManager) {
        this.camera = camera;
        this.inputManager = inputManager;
        this.weapons = [];
        this.weaponOrder = [];
        this.activeIndex = 0;
        this.activeWeapon = null;
    }

    registerWeapon(id, weaponInstance, slotIndex) {
        const def = WEAPON_DEFS[id];
        if (!def) {
            console.warn('[WeaponManager] Unknown weapon definition:', id);
            return;
        }

        this.weapons.push({
            id,
            instance: weaponInstance,
            def,
            slotIndex: slotIndex || this.weapons.length,
        });

        this.weapons.sort((a, b) => a.slotIndex - b.slotIndex);
        this.weaponOrder = this.weapons.map(w => w.id);

        if (!this.activeWeapon) {
            this.switchTo(0);
        }
    }

    switchTo(index) {
        if (index < 0 || index >= this.weapons.length) return false;

        if (this.activeWeapon) {
            this.activeWeapon.onDeselect?.();
        }

        this.activeIndex = index;
        this.activeWeapon = this.weapons[index].instance;
        this.activeWeapon.onSelect?.();

        return true;
    }

    switchToId(id) {
        const idx = this.weaponOrder.indexOf(id);
        if (idx === -1) return false;
        return this.switchTo(idx);
    }

    handleDigitKey(digit) {
        const idx = digit - 1;
        return this.switchTo(idx);
    }

    getActiveWeapon() {
        return this.activeWeapon;
    }

    getActiveWeaponDef() {
        return this.activeWeapon ? this.weapons[this.activeIndex]?.def : null;
    }

    update(delta) {
        if (this.activeWeapon) {
            this.activeWeapon.update(delta);
        }
    }

    clear() {
        for (const w of this.weapons) {
            w.instance.ammo = w.def.ammo ?? w.instance.ammo;
        }
    }

    dispose() {
        for (const w of this.weapons) {
            w.instance.dispose?.();
        }
    }
}
