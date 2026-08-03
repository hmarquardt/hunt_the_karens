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

        this._startTelegraph();
        return true;
    }

    _startTelegraph() {
        this._onTelegraph();
        if (this.onTelegraph) this.onTelegraph(this);
    }

    _startExecute() {
        this._onExecute();
        if (this.onExecute) this.onExecute(this);
    }

    _complete() {
        this._onComplete();
        if (this.onComplete) this.onComplete(this);
    }

    _onTelegraph() {}

    _onExecute() {}

    _onComplete() {}

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
                this._startExecute();
            } else if (this.state === 'executing') {
                this.state = 'ready';
                this._complete();
            }
        }
    }

    reset() {
        this.state = 'ready';
        this.stateTimer = 0;
        this.remainingCooldown = 0;
        this._onReset();
    }

    _onReset() {}

    dispose() {}
}
