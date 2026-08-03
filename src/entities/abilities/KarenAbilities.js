import * as THREE from 'three';
import { KarenAbility } from './KarenAbility.js';

export class CallManagerAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'call_manager',
            name: 'Call the Manager',
            cooldown: config?.cooldown || 25000,
            telegraphDuration: config?.telegraphDuration || 2000,
            executeDuration: config?.executeDuration || 1500,
        });

        this.escalatedDuration = config?.escalatedDuration || 4;
        this.selfBuffDuration = config?.selfBuffDuration || 6;
    }

    setContext(karen, playerStatusController) {
        this.karen = karen;
        this.playerStatusController = playerStatusController;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("I'm calling the MANAGER!");
        }
    }

    _onExecute() {
        if (this.playerStatusController) {
            this.playerStatusController.add({
                id: 'escalated',
                name: 'ESCALATED',
                duration: this.escalatedDuration,
                modifiers: {
                    speedMultiplier: 0.75,
                },
            });
        }

        if (this.karen) {
            this.karen.statusEffects.add({
                id: 'manager_zeal',
                name: 'MANAGER_ZEAL',
                duration: 6,
                modifiers: {
                    speedMultiplier: 1.2,
                },
            });
        }
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
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
        });

        this.noticeDuration = config?.noticeDuration || 12;
        this.placeDistance = config?.placeDistance || 6;
    }

    setContext(karen, worldEffectSystem) {
        this.karen = karen;
        this.worldEffectSystem = worldEffectSystem;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("HOA VIOLATION!");
        }
    }

    _onExecute() {
        if (!this.karen || !this.worldEffectSystem) return;

        const dir = new THREE.Vector3();
        this.karen.getWorldDirection(dir);
        const placePos = this.karen.position.clone().add(dir.multiplyScalar(this.placeDistance));
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `violation_${performance.now()}`,
            position: placePos,
            duration: this.noticeDuration,
            radius: 3,
            type: 'notice',
            statusEffect: 'cited',
            statusDuration: 5,
            label: 'HOA VIOLATION',
        });
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
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
        });

        this.itemDuration = config?.itemDuration || 15;
        this.radius = config?.radius || 4;
    }

    setContext(karen, worldEffectSystem) {
        this.karen = karen;
        this.worldEffectSystem = worldEffectSystem;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("I don't need a receipt!");
        }
    }

    _onExecute() {
        if (!this.karen || !this.worldEffectSystem) return;

        const placePos = this.karen.position.clone();
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `returned_item_${performance.now()}`,
            position: placePos,
            duration: this.itemDuration,
            radius: this.radius,
            type: 'rejected_item',
            statusEffect: 'returned',
            statusDuration: 3,
            label: 'RETURNED ITEM',
        });
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
    }
}
