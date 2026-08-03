import { Karen } from './Karen.js';
import { ReturnWithoutReceiptAbility } from './abilities/KarenAbilities.js';

export class RetailReturnKaren extends Karen {
    constructor(config) {
        super(config);

        this.addAbility(new ReturnWithoutReceiptAbility(config.abilities?.returnWithoutReceipt));
    }

    updateAbilities(delta) {
        super.updateAbilities(delta);

        if (this.abilityContext && this.abilities.length > 0) {
            this.abilityTryCooldown -= delta;
            if (this.abilityTryCooldown <= 0) {
                this.abilityTryCooldown = this.abilityTryInterval;
                this._tryUseAbility();
            }
        }
    }
}
