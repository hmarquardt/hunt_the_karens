export class HUD {
    constructor(scoreSystem) {
        this.scoreSystem = scoreSystem;
        this.blocker = document.getElementById('blocker');
        this.hud = document.getElementById('hud');
        this.scoreValue = document.getElementById('score-value');
        this.comboValue = document.getElementById('combo-value');
        this.weaponName = document.getElementById('weapon-name');
        this.ammoValue = document.getElementById('ammo-value');
        this.hitFeedback = document.getElementById('hit-feedback');
        this.hitMarker = document.getElementById('hit-marker');
        this.debugOverlay = document.getElementById('debug-overlay');
        this.debugStats = document.getElementById('debug-stats');
        this.weaponSlots = document.getElementById('weapon-slots');
        this.statusEffectsContainer = document.getElementById('status-effects');

        this._feedbackTimeout = null;
        this._activeWeaponSlot = 0;
    }

    showHUD() {
        if (this.blocker) this.blocker.classList.add('hidden');
        if (this.hud) this.hud.classList.remove('hidden');
    }

    showBlocker() {
        if (this.blocker) this.blocker.classList.remove('hidden');
        if (this.hud) this.hud.classList.add('hidden');
    }

    updateScore(score) {
        if (this.scoreValue) {
            this.scoreValue.textContent = score.toLocaleString();
        }
    }

    updateCombo(combo) {
        if (this.comboValue) {
            if (combo > 1) {
                this.comboValue.textContent = `${combo}x COMBO`;
                this.comboValue.classList.add('active');
                setTimeout(() => {
                    this.comboValue.classList.remove('active');
                }, 150);
            } else {
                this.comboValue.textContent = '';
            }
        }
    }

    updateWeapon(name, ammo) {
        if (this.weaponName) this.weaponName.textContent = name;
        if (this.ammoValue) {
            const display = ammo === Infinity ? '∞' : Math.max(0, Math.floor(ammo)).toString();
            this.ammoValue.textContent = display;
        }
    }

    updateWeaponSlots(activeIndex) {
        this._activeWeaponSlot = activeIndex;
        const slots = this.weaponSlots?.querySelectorAll('.weapon-slot');
        if (slots) {
            slots.forEach((slot, i) => {
                slot.classList.toggle('active', i === activeIndex);
            });
        }
    }

    updateStatusEffects(effects) {
        if (!this.statusEffectsContainer) return;

        this.statusEffectsContainer.innerHTML = '';

        if (!effects || effects.length === 0) return;

        for (const effect of effects) {
            const el = document.createElement('div');
            el.className = `status-effect ${effect.id || ''}`;
            const remaining = Math.ceil(effect.remaining);
            el.textContent = `${effect.name} ${remaining}s`;
            this.statusEffectsContainer.appendChild(el);
        }
    }

    showHitFeedback(text) {
        if (!this.hitFeedback) return;
        this.hitFeedback.textContent = text;
        this.hitFeedback.classList.add('visible');

        if (this._feedbackTimeout) {
            clearTimeout(this._feedbackTimeout);
        }

        this._feedbackTimeout = setTimeout(() => {
            this.hitFeedback.classList.remove('visible');
        }, 1500);
    }

    showHitMarker() {
        if (!this.hitMarker) return;
        this.hitMarker.classList.remove('visible');
        void this.hitMarker.offsetWidth;
        this.hitMarker.classList.add('visible');

        setTimeout(() => {
            this.hitMarker.classList.remove('visible');
        }, 150);
    }

    toggleDebug(enabled) {
        if (!this.debugOverlay) return;
        if (enabled) {
            this.debugOverlay.classList.remove('hidden');
        } else {
            this.debugOverlay.classList.add('hidden');
        }
    }

    updateDebug(data) {
        if (!this.debugStats) return;
        const lines = [];
        if (data.fps !== undefined) lines.push(`FPS: ${data.fps}`);
        if (data.frameTime !== undefined) lines.push(`Frame: ${data.frameTime.toFixed(1)}ms`);
        if (data.projectiles !== undefined) lines.push(`Projectiles: ${data.projectiles}`);
        if (data.pooled !== undefined) lines.push(`Pooled: ${data.pooled}`);
        if (data.enemies !== undefined) lines.push(`Enemies: ${data.enemies}`);
        if (data.vfx !== undefined) lines.push(`VFX: ${data.vfx}`);
        if (data.drawCalls !== undefined) lines.push(`Draw calls: ${data.drawCalls}`);
        if (data.triangles !== undefined) lines.push(`Triangles: ${data.triangles.toLocaleString()}`);
        if (data.textures !== undefined) lines.push(`Textures: ${data.textures}`);
        if (data.geometries !== undefined) lines.push(`Geometries: ${data.geometries}`);

        this.debugStats.innerHTML = lines.map(l => `<p>${l}</p>`).join('');
    }
}
