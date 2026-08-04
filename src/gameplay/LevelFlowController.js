/**
 * Level 1 flow controller — finite state machine for phase progression.
 *
 * Phases: INTRO → WAVE_1 → BREATHER_1 → WAVE_2 → BREATHER_2 → WAVE_3 → FINAL_ESCALATION → VICTORY/DEFEAT → RESULT
 */

import { PHASES, LEVEL_CONFIG } from './Level1Config.js';

export class LevelFlowController {
    constructor() {
        this.phase = PHASES.INTRO;
        this.phaseTime = 0;
        this.runTime = 0;
        this._activeEnemies = [];
        this._pendingSpawns = [];
        this._waveComplete = false;
        this._weaponsUnlocked = { croc: true, waterBalloon: false, gardenGnome: false };
        this._pendingWeaponUnlock = null;
        this._composureRecoveryThisBreather = false;
        this._lowComposureWarned = false;
        this._transitions = [];
    }

    reset() {
        this.phase = PHASES.INTRO;
        this.phaseTime = 0;
        this.runTime = 0;
        this._activeEnemies = [];
        this._pendingSpawns = [];
        this._waveComplete = false;
        this._weaponsUnlocked = { croc: true, waterBalloon: false, gardenGnome: false };
        this._pendingWeaponUnlock = null;
        this._composureRecoveryThisBreather = false;
        this._lowComposureWarned = false;
        this._transitions = [];
    }

    update(delta, playerPosition, composure, scoreSystem) {
        this.runTime += delta;
        this.phaseTime += delta;

        // Check for pending weapon unlock
        if (this._pendingWeaponUnlock) {
            const unlock = this._pendingWeaponUnlock;
            this._weaponsUnlocked[unlock.type] = true;
            this._transitions.push({
                type: 'weapon_unlock',
                weaponType: unlock.type,
                text: unlock.text,
                weaponName: unlock.weaponName,
                key: unlock.key,
            });
            this._pendingWeaponUnlock = null;
        }

        switch (this.phase) {
            case PHASES.INTRO:
                this._updateIntro(delta, playerPosition);
                break;
            case PHASES.WAVE_1:
            case PHASES.WAVE_2:
            case PHASES.WAVE_3:
            case PHASES.FINAL_ESCALATION:
                this._updateWave(delta);
                break;
            case PHASES.BREATHER_1:
            case PHASES.BREATHER_2:
                this._updateBreather(delta, composure);
                break;
            case PHASES.VICTORY:
            case PHASES.DEFEAT:
                // Terminal state — no updates
                break;
        }
    }

    _updateIntro(delta, playerPosition) {
        if (this.phaseTime >= LEVEL_CONFIG.introDuration) {
            this._startWave(1);
        }
    }

    _updateWave(delta) {
        // Process pending spawns with delays
        const now = this.phaseTime;
        const toSpawn = this._pendingSpawns.filter(s => s.delay <= now);
        this._pendingSpawns = this._pendingSpawns.filter(s => s.delay > now);

        for (const spawn of toSpawn) {
            this._transitions.push({ type: 'enemy_spawn', enemy: spawn });
        }

        // Check if all active enemies are defeated
        if (this._activeEnemies.length === 0 && this._pendingSpawns.length === 0) {
            this._completeWave();
        }
    }

    _updateBreather(delta, composure) {
        // Recover composure once at start of breather
        if (!this._composureRecoveryThisBreather && composure < 100) {
            this._composureRecoveryThisBreather = true;
            const recovery = Math.min(LEVEL_CONFIG.breatherComposureRecovery, 100 - composure);
            this._transitions.push({ type: 'composure_recovery', amount: recovery });
        }

        if (this.phaseTime >= LEVEL_CONFIG.breatherDuration) {
            const currentWaveNum = this.phase === PHASES.BREATHER_1 ? 2 : 3;
            this._startWave(currentWaveNum);
        }
    }

    _startWave(num) {
        let configKey, nextPhase;
        switch (num) {
            case 1:
                configKey = 'wave1';
                nextPhase = PHASES.WAVE_1;
                break;
            case 2:
                configKey = 'wave2';
                nextPhase = PHASES.WAVE_2;
                break;
            case 3:
                configKey = 'wave3';
                nextPhase = PHASES.WAVE_3;
                break;
            case 4:
                configKey = 'final';
                nextPhase = PHASES.FINAL_ESCALATION;
                break;
        }

        const config = LEVEL_CONFIG[configKey];
        this.phase = nextPhase;
        this.phaseTime = 0;
        this._waveComplete = false;
        this._composureRecoveryThisBreather = false;
        this._activeEnemies = [];
        this._pendingSpawns = [];

        // Set up enemies
        for (const enemy of config.enemies) {
            this._pendingSpawns.push({ ...enemy });
        }

        // Phase announcement
        this._transitions.push({
            type: 'phase_announcement',
            incident: config.incident,
            subtitle: config.incidentSubtitle,
            objective: config.objective,
        });
    }

    _completeWave() {
        if (this._waveComplete) return;
        this._waveComplete = true;

        let configKey;
        let nextPhase;

        switch (this.phase) {
            case PHASES.WAVE_1:
                configKey = 'wave1';
                nextPhase = PHASES.BREATHER_1;
                break;
            case PHASES.WAVE_2:
                configKey = 'wave2';
                nextPhase = PHASES.BREATHER_2;
                break;
            case PHASES.WAVE_3:
                configKey = 'wave3';
                nextPhase = PHASES.FINAL_ESCALATION;
                break;
            case PHASES.FINAL_ESCALATION:
                configKey = 'final';
                nextPhase = PHASES.VICTORY;
                break;
            default:
                return;
        }

        const config = LEVEL_CONFIG[configKey];

        // Weapon unlock
        if (config.unlockWeapon) {
            this._pendingWeaponUnlock = {
                type: config.unlockWeapon,
                text: config.unlockText,
                weaponName: config.unlockWeaponName,
                key: config.unlockKey,
            };
        }

        // Complete bonus
        if (config.completeBonus) {
            this._transitions.push({ type: 'wave_complete_bonus', amount: config.completeBonus });
        }

        // Incident resolved announcement
        this._transitions.push({ type: 'incident_resolved' });

        if (nextPhase === PHASES.VICTORY) {
            this.phase = nextPhase;
            this.phaseTime = 0;
            this._transitions.push({ type: 'victory' });
        } else {
            this.phase = nextPhase;
            this.phaseTime = 0;
            this._transitions.push({ type: 'breather_start', objective: this._getBreatherObjective() });
        }
    }

    _getBreatherObjective() {
        if (this.phase === PHASES.WAVE_1 || this.phase === PHASES.BREATHER_1) {
            return 'CATCH YOUR BREATH';
        }
        return 'MOVE TOWARD THE STORE';
    }

    triggerDefeat() {
        if (this.phase === PHASES.VICTORY || this.phase === PHASES.DEFEAT || this.phase === PHASES.RESULT) return;
        this.phase = PHASES.DEFEAT;
        this.phaseTime = 0;
        this._activeEnemies = [];
        this._pendingSpawns = [];
        this._transitions.push({ type: 'defeat' });
    }

    showResult() {
        if (this.phase !== PHASES.VICTORY && this.phase !== PHASES.DEFEAT) return;
        this.phase = PHASES.RESULT;
        this.phaseTime = 0;
        this._transitions.push({ type: 'show_result' });
    }

    onEnemyDefeated(enemy) {
        const idx = this._activeEnemies.indexOf(enemy);
        if (idx !== -1) {
            this._activeEnemies.splice(idx, 1);
        }
    }

    onEnemySpawned(enemy) {
        this._activeEnemies.push(enemy);
    }

    getPendingSpawns() {
        return this._pendingSpawns.filter(s => s.delay <= this.phaseTime);
    }

    consumePendingSpawns() {
        const now = this.phaseTime;
        const ready = this._pendingSpawns.filter(s => s.delay <= now);
        this._pendingSpawns = this._pendingSpawns.filter(s => s.delay > now);
        return ready;
    }

    getPhase() {
        return this.phase;
    }

    getObjective() {
        switch (this.phase) {
            case PHASES.INTRO: return 'MAKE IT TO THE ENTRANCE';
            case PHASES.WAVE_1: return LEVEL_CONFIG.wave1.objective;
            case PHASES.BREATHER_1: return 'CATCH YOUR BREATH';
            case PHASES.WAVE_2: return LEVEL_CONFIG.wave2.objective;
            case PHASES.BREATHER_2: return 'MOVE TOWARD THE STORE';
            case PHASES.WAVE_3: return LEVEL_CONFIG.wave3.objective;
            case PHASES.FINAL_ESCALATION: return LEVEL_CONFIG.final.objective;
            case PHASES.VICTORY: return LEVEL_CONFIG.victoryText;
            case PHASES.DEFEAT: return LEVEL_CONFIG.defeatText;
            case PHASES.RESULT: return '';
            default: return '';
        }
    }

    getEnemiesAlive() {
        return this._activeEnemies.length;
    }

    isWaveActive() {
        return [PHASES.WAVE_1, PHASES.WAVE_2, PHASES.WAVE_3, PHASES.FINAL_ESCALATION].includes(this.phase);
    }

    isTerminal() {
        return [PHASES.VICTORY, PHASES.DEFEAT, PHASES.RESULT].includes(this.phase);
    }

    getWeaponUnlocks() {
        return { ...this._weaponsUnlocked };
    }

    getFinalConfig() {
        return LEVEL_CONFIG.final;
    }

    popTransitions() {
        const transitions = [...this._transitions];
        this._transitions = [];
        return transitions;
    }

    getDebugInfo() {
        return {
            phase: this.phase,
            phaseTime: this.phaseTime.toFixed(1),
            runTime: this.runTime.toFixed(1),
            enemiesAlive: this._activeEnemies.length,
            pendingSpawns: this._pendingSpawns.length,
            weaponsUnlocked: this._weaponsUnlocked,
        };
    }
}
