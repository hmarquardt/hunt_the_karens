import { Karen } from './Karen.js';
import { ReturnWithoutReceiptAbility } from './abilities/KarenAbilities.js';

export class RetailReturnKaren extends Karen {
    constructor(config) {
        super(config);

        this.addAbility(new ReturnWithoutReceiptAbility(config.abilities?.returnWithoutReceipt));
    }
}
