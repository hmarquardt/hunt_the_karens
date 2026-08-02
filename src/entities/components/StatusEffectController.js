export class StatusEffect {
    constructor(config) {
        this.id = config.id;
        this.name = config.name || config.id;
        this.duration = config.duration || 5;
        this.remaining = this.duration;
        this.source = config.source || null;
        this.stackCount = 1;
        this.maxStacks = config.maxStacks || 1;
        this.onRefresh = config.onRefresh || 'extend';
        this.modifiers = config.modifiers || {};
        this._onStart = config.onStart || null;
        this._onEnd = config.onEnd || null;
        this._active = false;
    }

    apply() {
        if (!this._active) {
            this._active = true;
            this.remaining = this.duration;
            if (this._onStart) this._onStart(this);
        } else {
            switch (this.onRefresh) {
                case 'reset':
                    this.remaining = this.duration;
                    break;
                case 'extend':
                    this.remaining = Math.max(this.remaining, this.duration);
                    break;
                case 'stack':
                    this.stackCount = Math.min(this.stackCount + 1, this.maxStacks);
                    this.remaining = this.duration;
                    break;
            }
        }
    }

    update(delta) {
        if (!this._active) return;

        this.remaining -= delta;

        if (this.remaining <= 0) {
            this.remaining = 0;
            this.expire();
        }
    }

    expire() {
        if (this._active && this._onEnd) {
            this._onEnd(this);
        }
        this._active = false;
        this.stackCount = 0;
    }

    getModifierValue(key, defaultValue) {
        if (!this._active) return defaultValue;
        return this.modifiers[key] !== undefined ? this.modifiers[key] : defaultValue;
    }

    get active() {
        return this._active;
    }

    dispose() {
        this.expire();
    }
}

export class StatusEffectController {
    constructor() {
        this.effects = new Map();
    }

    add(config) {
        const existing = this.effects.get(config.id);
        if (existing) {
            existing.apply();
            return existing;
        }

        const effect = new StatusEffect(config);
        this.effects.set(config.id, effect);
        effect.apply();
        return effect;
    }

    remove(id) {
        const effect = this.effects.get(id);
        if (effect) {
            effect.expire();
            this.effects.delete(id);
        }
    }

    has(id) {
        const effect = this.effects.get(id);
        return effect && effect.active;
    }

    get(id) {
        return this.effects.get(id);
    }

    getActiveEffects() {
        const active = [];
        for (const [, effect] of this.effects) {
            if (effect.active) {
                active.push(effect);
            }
        }
        return active;
    }

    getModifierValue(key, defaultValue) {
        let value = defaultValue;
        for (const [, effect] of this.effects) {
            if (effect.active && effect.modifiers[key] !== undefined) {
                const mod = effect.modifiers[key];
                if (typeof mod === 'function') {
                    value = mod(value);
                } else {
                    value *= mod;
                }
            }
        }
        return value;
    }

    update(delta) {
        for (const [, effect] of this.effects) {
            if (effect.active) {
                effect.update(delta);
                if (!effect.active) {
                    this.effects.delete(effect.id);
                }
            }
        }
    }

    clear() {
        for (const [, effect] of this.effects) {
            effect.dispose();
        }
        this.effects.clear();
    }
}
