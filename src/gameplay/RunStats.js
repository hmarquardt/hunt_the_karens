/**
 * Run statistics tracking — local to a single playthrough.
 */

import { RANKS } from './Level1Config.js';

export class RunStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = 0;
        this.endTime = 0;
        this.totalTime = 0;
        this.score = 0;
        this.highestCombo = 0;
        this.incidentsResolved = 0;
        this.throws = { croc: 0, waterBalloon: 0, gardenGnome: 0 };
        this.enemyHits = 0;
        this.composureRemaining = 100;
        this.composureLost = false;
        this.victory = false;
    }

    startTimer() {
        this.startTime = performance.now();
    }

    stopTimer() {
        if (this.startTime > 0 && this.endTime === 0) {
            this.endTime = performance.now();
            this.totalTime = (this.endTime - this.startTime) / 1000;
        }
    }

    recordThrow(weaponType) {
        if (weaponType === 'croc') this.throws.croc++;
        else if (weaponType === 'waterBalloon') this.throws.waterBalloon++;
        else if (weaponType === 'gardenGnome') this.throws.gardenGnome++;
    }

    recordHit() {
        this.enemyHits++;
    }

    recordCombo(combo) {
        if (combo > this.highestCombo) this.highestCombo = combo;
    }

    getAccuracy() {
        const totalThrows = this.throws.croc + this.throws.waterBalloon + this.throws.gardenGnome;
        if (totalThrows === 0) return 0;
        return Math.round((this.enemyHits / totalThrows) * 100);
    }

    getTotalThrows() {
        return this.throws.croc + this.throws.waterBalloon + this.throws.gardenGnome;
    }

    addScore(points) {
        this.score += points;
    }

    getRank() {
        for (const rank of RANKS) {
            if (this.score >= rank.minScore) return rank;
        }
        return RANKS[RANKS.length - 1];
    }
}
