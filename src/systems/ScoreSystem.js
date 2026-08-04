import * as CONSTANTS from '../config/constants.js';

/**
 * ScoreSystem — authoritative source for score, combo, and accuracy.
 *
 * API semantics:
 *
 * registerHit(points)
 *   Means: a player projectile successfully struck an enemy.
 *   - Increments totalHits (accuracy numerator)
 *   - Advances combo
 *   - Applies combo multiplier to points
 *   - Each projectile can trigger this at most once.
 *
 * registerMiss()
 *   Means: a thrown projectile did not hit an enemy.
 *   - Increments totalMisses (accuracy denominator)
 *   - Resets combo to 0
 *   - Covers vehicle impacts, ground bounces to rest, and lifetime expiry.
 *   - Each projectile can trigger this at most once.
 *
 * registerDefeat(points)
 *   Means: an enemy was resolved/defeated.
 *   - Awards score (with combo multiplier if combo > 0)
 *   - Increments totalDefeated
 *   - Does NOT affect accuracy (no change to totalHits or totalMisses)
 *
 * registerBonus(points)
 *   Means: scripted level bonus (incident completion, victory bonus, etc.).
 *   - Awards score only
 *   - Does NOT affect accuracy
 *   - Does NOT alter combo
 *   - Does NOT pretend a projectile hit occurred.
 */
export class ScoreSystem {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        this.totalDefeated = 0;
        this.hud = null;
    }

    setHUD(hud) {
        this.hud = hud;
    }

    /**
     * Record a successful projectile hit on an enemy.
     * Increments totalHits and advances combo.
     */
    registerHit(points) {
        const now = performance.now();
        if (now - this.comboTimer < CONSTANTS.COMBO_TIMEOUT) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.comboTimer = now;

        const comboMultiplier = 1 + (this.combo - 1) * 0.25;
        const earned = Math.round(points * comboMultiplier);
        this.score += earned;
        this.totalHits++;

        if (this.hud) {
            this.hud.updateScore(this.score);
            this.hud.updateCombo(this.combo);
        }

        return { score: this.score, combo: this.combo, earned };
    }

    /**
     * Record a projectile miss (vehicle hit, ground rest, or expiry).
     * Increments totalMisses and resets combo.
     */
    registerMiss() {
        this.totalMisses++;
        this.combo = 0;
        this.comboTimer = 0;

        if (this.hud) {
            this.hud.updateScore(this.score);
            this.hud.updateCombo(this.combo);
        }
    }

    /**
     * Record an enemy defeat/resolution.
     * Awards score with combo multiplier. Does NOT affect accuracy.
     */
    registerDefeat(points) {
        const basePoints = points || 100;
        const comboMultiplier = 1 + (this.combo - 1) * 0.25;
        const earned = Math.round(basePoints * comboMultiplier);
        this.score += earned;
        this.totalDefeated++;

        if (this.hud) {
            this.hud.updateScore(this.score);
        }

        return { score: this.score, combo: this.combo, earned };
    }

    /**
     * Award scripted bonus points (incident completion, victory bonus, etc.).
     * Score only — does NOT affect accuracy, combo, or hit/miss counters.
     */
    registerBonus(points) {
        this.score += points;

        if (this.hud) {
            this.hud.updateScore(this.score);
        }

        return this.score;
    }

    getAccuracy() {
        const totalShots = this.totalHits + this.totalMisses;
        if (totalShots === 0) return 0;
        return Math.round((this.totalHits / totalShots) * 100);
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        this.totalDefeated = 0;
    }
}
