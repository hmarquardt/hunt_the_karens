import { KarenAbility } from './KarenAbility.js';
import { WorldEffect } from '../../systems/WorldEffectSystem.js';

export class CallManagerAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'call_manager',
            name: 'Call the Manager',
            cooldown: config?.cooldown || 25000,
            telegraphDuration: config?.telegraphDuration || 2000,
            executeDuration: config?.executeDuration || 1500,
            speedBoost: config?.speedBoost || 1.4,
            speedDuration: config?.speedDuration || 6000,
            aggroRadius: config?.aggroRadius || 8,
        });

        this.speedBoost = config?.speedBoost || 1.4;
        this.speedDuration = config?.speedDuration || 6000;
        this.aggroRadius = config?.aggroRadius || 8;
    }

    _onTelegraph() {
        if (this.onTelegraph) this.onTelegraph(this);
    }

    _onExecute() {
        if (this.onExecute) this.onExecute(this);
        if (this.karen) {
            this.karen.statusEffects.add({
                id: 'speed_boost',
                name: 'MANAGER_BOOST',
                duration: this.speedDuration,
                speedMultiplier: this.speedBoost,
            });
        }
    }

    _onComplete() {
        if (this.onComplete) this.onComplete(this);
    }
}

export class ViolationNoticeAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'violation_notice',
            name: 'Violation Notice',
            cooldown: config?.cooldown || 20000,
            telegraphDuration: config?.telegraphDuration || 2000,
            executeDuration: config?.executeDuration || 1000,
            noticeDuration: config?.noticeDuration || 12000,
            slowFactor: config?.slowFactor || 0.5,
            placeDistance: config?.placeDistance || 6,
        });

        this.noticeDuration = config?.noticeDuration || 12000;
        this.slowFactor = config?.slowFactor || 0.5;
        this.placeDistance = config?.placeDistance || 6;
    }

    use(karen, worldEffectSystem) {
        if (!this.canUse()) return false;
        this.karen = karen;
        this.worldEffectSystem = worldEffectSystem;

        this.state = 'telegraphing';
        this.stateTimer = this.telegraphDuration;
        this.remainingCooldown = this.cooldown;

        if (this.onTelegraph) this.onTelegraph(this);
        return true;
    }

    _onExecute() {
        if (this.onExecute) this.onExecute(this);
        if (!this.karen || !this.worldEffectSystem) return;

        const dir = new THREE.Vector3();
        this.karen.getWorldDirection(dir);
        const placePos = this.karen.position.clone().add(dir.multiplyScalar(this.placeDistance));
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `violation_${performance.now()}`,
            position: placePos,
            duration: this.noticeDuration / 1000,
            radius: this.aggroRadius || 3,
            type: 'notice',
            statusEffect: 'slowed',
            statusDuration: 3000,
            label: 'HOA VIOLATION',
        });
    }

    _onComplete() {
        if (this.onComplete) this.onComplete(this);
    }
}

export class ReturnWithoutReceiptAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'return_without_receipt',
            name: 'Return Without Receipt',
            cooldown: config?.cooldown || 30000,
            telegraphDuration: config?.telegraphDuration || 2500,
            executeDuration: config?.executeDuration || 2000,
            itemDuration: config?.itemDuration || 15000,
            radius: config?.radius || 4,
            refundAmount: config?.refundAmount || 50,
        });

        this.itemDuration = config?.itemDuration || 15000;
        this.radius = config?.radius || 4;
        this.refundAmount = config?.refundAmount || 50;
    }

    use(karen, worldEffectSystem) {
        if (!this.canUse()) return false;
        this.karen = karen;
        this.worldEffectSystem = worldEffectSystem;

        this.state = 'telegraphing';
        this.stateTimer = this.telegraphDuration;
        this.remainingCooldown = this.cooldown;

        if (this.onTelegraph) this.onTelegraph(this);
        return true;
    }

    _onExecute() {
        if (this.onExecute) this.onExecute(this);
        if (!this.karen || !this.worldEffectSystem) return;

        const placePos = this.karen.position.clone();
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `returned_item_${performance.now()}`,
            position: placePos,
            duration: this.itemDuration / 1000,
            radius: this.radius,
            type: 'rejected_item',
            statusEffect: 'confused',
            statusDuration: 4000,
            label: 'RETURNED ITEM',
        });
    }

    _onComplete() {
        if (this.onComplete) this.onComplete(this);
    }
}
