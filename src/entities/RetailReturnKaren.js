import * as THREE from 'three';
import { Karen } from './Karen.js';
import { CallManagerAbility, ViolationNoticeAbility, ReturnWithoutReceiptAbility } from './abilities/KarenAbilities.js';

export class RetailReturnKaren extends Karen {
    constructor(config) {
        super(config);

        this.abilities = [];
        this.worldEffectSystem = null;
        this._setupAbilities(config);
    }

    _setupAbilities(config) {
        const abilities = config.abilities || {};

        if (abilities.callManager) {
            const ability = new CallManagerAbility(abilities.callManager);
            ability.karen = this;
            ability.onTelegraph = () => this._onAbilityTelegraph(ability);
            ability.onExecute = () => this._onAbilityExecute(ability);
            ability.onComplete = () => this._onAbilityComplete(ability);
            this.abilities.push(ability);
        }

        if (abilities.violationNotice) {
            const ability = new ViolationNoticeAbility(abilities.violationNotice);
            ability.karen = this;
            ability.onTelegraph = () => this._onAbilityTelegraph(ability);
            ability.onExecute = () => this._onAbilityExecute(ability);
            ability.onComplete = () => this._onAbilityComplete(ability);
            this.abilities.push(ability);
        }

        if (abilities.returnWithoutReceipt) {
            const ability = new ReturnWithoutReceiptAbility(abilities.returnWithoutReceipt);
            ability.karen = this;
            ability.onTelegraph = () => this._onAbilityTelegraph(ability);
            ability.onExecute = () => this._onAbilityExecute(ability);
            ability.onComplete = () => this._onAbilityComplete(ability);
            this.abilities.push(ability);
        }
    }

    _onAbilityTelegraph(ability) {
        this.currentDialogue = `I'm using ${ability.name}!`;
        if (this.dialogue) {
            this.dialogue.onUseAbility(ability.name);
        }
    }

    _onAbilityExecute(ability) {
        if (this.worldEffectSystem) {
            ability.use(this, this.worldEffectSystem);
        }
    }

    _onAbilityComplete(ability) {
        this.currentDialogue = `${ability.name} complete!`;
    }

    updateAbilities(delta, worldEffectSystem) {
        this.worldEffectSystem = worldEffectSystem;
        for (const ability of this.abilities) {
            ability.update(delta);

            if (ability.canUse() && Math.random() < 0.001) {
                this.tryUseAbility(worldEffectSystem);
            }
        }
    }

    tryUseAbility(worldEffectSystem) {
        for (const ability of this.abilities) {
            if (ability.canUse()) {
                this.worldEffectSystem = worldEffectSystem;
                return ability.use(this, worldEffectSystem);
            }
        }
        return false;
    }

    resetAbilities() {
        for (const ability of this.abilities) {
            ability.reset();
        }
    }

    dispose() {
        for (const ability of this.abilities) {
            ability.dispose();
        }
        super.dispose();
    }

    get archetype() {
        return 'retail_return';
    }
}
