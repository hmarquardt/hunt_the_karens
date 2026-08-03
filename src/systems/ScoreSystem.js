import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

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

    registerMiss() {
        this.totalMisses++;
        this.combo = 0;
        this.comboTimer = 0;

        if (this.hud) {
            this.hud.updateScore(this.score);
            this.hud.updateCombo(this.combo);
        }
    }

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
