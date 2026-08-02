export class Weapon {
    constructor() {
        this.name = 'Unknown';
        this.cooldown = 0;
        this.lastFireTime = 0;
        this.ammo = Infinity;
    }

    init() {}

    update(delta) {}

    canFire() {
        const now = performance.now();
        return (now - this.lastFireTime) >= this.cooldown;
    }

    fire() {
        if (!this.canFire()) return false;
        this.lastFireTime = performance.now();
        return true;
    }

    dispose() {}
}
