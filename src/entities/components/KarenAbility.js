export class KarenAbility {
    constructor(config) {
        this.id = config.id;
        this.name = config.name || config.id;
        this.cooldown = config.cooldown || 10000;
        this.telegraphDuration = config.telegraphDuration || 1500;
        this.executeDuration = config.executeDuration || 2000;
        this.remainingCooldown = 0;
        this.state = 'ready';
        this.stateTimer = 0;
        this.onTelegraph = config.onTelegraph || null;
        this.onExecute = config.onExecute || null;
        this.onComplete = config.onComplete || null;
    }

    canUse() {
        return this.state === 'ready' && this.remainingCooldown <= 0;
    }

    use() {
        if (!this.canUse()) return false;

        this.state = 'telegraphing';
        this.stateTimer = this.telegraphDuration;
        this.remainingCooldown = this.cooldown;

        if (this.onTelegraph) this.onTelegraph(this);
        return true;
    }

    update(delta) {
        if (this.state === 'ready') {
            if (this.remainingCooldown > 0) {
                this.remainingCooldown -= delta * 1000;
                if (this.remainingCooldown < 0) this.remainingCooldown = 0;
            }
            return;
        }

        this.stateTimer -= delta * 1000;

        if (this.stateTimer <= 0) {
            if (this.state === 'telegraphing') {
                this.state = 'executing';
                this.stateTimer = this.executeDuration;
                if (this.onExecute) this.onExecute(this);
            } else if (this.state === 'executing') {
                this.state = 'ready';
                if (this.onComplete) this.onComplete(this);
            }
        }
    }

    reset() {
        this.state = 'ready';
        this.stateTimer = 0;
        this.remainingCooldown = 0;
    }

    dispose() {}
}
