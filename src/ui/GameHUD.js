/**
 * HUD overlay for objectives, phase announcements, composure, and result screen.
 */

export class GameHUD {
    constructor(scoreSystem) {
        this.scoreSystem = scoreSystem;
        this._overlay = null;
        this._objectiveText = null;
        this._objectiveLabel = null;
        this._composureBar = null;
        this._composureText = null;
        this._composureContainer = null;
        this._announcement = null;
        this._announcementTimer = 0;
        this._hintText = null;
        this._hintTimer = 0;
        this._debugOverlay = null;
        this._debugStats = null;
        this._lowComposureWarning = null;
        this._lowComposureWarned = false;
        this._introOverlay = null;
    }

    build() {
        this._overlay = document.createElement('div');
        this._overlay.id = 'game-hud';
        this._overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:100;font-family:monospace;';

        // Objective area — top left
        this._objectiveLabel = document.createElement('div');
        this._objectiveLabel.style.cssText = 'position:absolute;top:20px;left:20px;color:#ffaa44;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;';
        this._objectiveLabel.textContent = 'OBJECTIVE';

        this._objectiveText = document.createElement('div');
        this._objectiveText.style.cssText = 'position:absolute;top:36px;left:20px;color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:1px;max-width:300px;';
        this._objectiveText.textContent = 'SURVIVE THE PARKING LOT';

        // Composure — top right
        this._composureContainer = document.createElement('div');
        this._composureContainer.style.cssText = 'position:absolute;top:20px;right:20px;text-align:right;';

        this._composureText = document.createElement('div');
        this._composureText.style.cssText = 'color:#ffaa44;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:4px;';
        this._composureText.textContent = 'COMPOSURE';

        this._composureBar = document.createElement('div');
        this._composureBar.style.cssText = 'width:150px;height:6px;background:#333;border:1px solid #555;position:relative;overflow:hidden;';
        const barFill = document.createElement('div');
        barFill.id = 'composure-fill';
        barFill.style.cssText = 'height:100%;background:#44ff88;transition:width 0.3s,background 0.3s;width:100%;';
        this._composureBar.appendChild(barFill);

        this._composureContainer.appendChild(this._composureText);
        this._composureContainer.appendChild(this._composureBar);

        // Announcement overlay — center
        this._announcement = document.createElement('div');
        this._announcement.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity 0.4s;';

        const annIncident = document.createElement('div');
        annIncident.id = 'ann-incident';
        annIncident.style.cssText = 'color:#ffaa44;font-size:12px;letter-spacing:3px;text-transform:uppercase;';
        annIncident.textContent = '';

        const annSubtitle = document.createElement('div');
        annSubtitle.id = 'ann-subtitle';
        annSubtitle.style.cssText = 'color:#ffffff;font-size:28px;font-weight:bold;margin-top:8px;letter-spacing:2px;';
        annSubtitle.textContent = '';

        this._announcement.appendChild(annIncident);
        this._announcement.appendChild(annSubtitle);

        // Hint text — bottom center
        this._hintText = document.createElement('div');
        this._hintText.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#aaa;font-size:13px;opacity:0;transition:opacity 0.5s;text-align:center;';
        this._hintText.textContent = '';

        // Low composure warning — top center
        this._lowComposureWarning = document.createElement('div');
        this._lowComposureWarning.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);color:#ff4444;font-size:14px;font-weight:bold;letter-spacing:2px;opacity:0;transition:opacity 0.5s;';
        this._lowComposureWarning.textContent = '⚠ COMPOSURE CRITICAL';

        // Debug overlay
        this._debugOverlay = document.createElement('div');
        this._debugOverlay.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);color:#ffff00;font-size:12px;text-align:center;opacity:0;';

        // Score display — top center
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);color:#ffffff;font-size:18px;font-weight:bold;';
        scoreDisplay.textContent = '0';

        this._overlay.appendChild(this._objectiveLabel);
        this._overlay.appendChild(this._objectiveText);
        this._overlay.appendChild(this._composureContainer);
        this._overlay.appendChild(this._announcement);
        this._overlay.appendChild(this._hintText);
        this._overlay.appendChild(this._lowComposureWarning);
        this._overlay.appendChild(this._debugOverlay);
        this._overlay.appendChild(scoreDisplay);

        document.body.appendChild(this._overlay);
    }

    updateObjective(text) {
        if (!this._objectiveText) return;
        this._objectiveText.textContent = text;
        this._objectiveText.style.transition = 'opacity 0.2s';
        this._objectiveText.style.opacity = '0.5';
        setTimeout(() => { if (this._objectiveText) this._objectiveText.style.opacity = '1'; }, 200);
    }

    updateComposure(value) {
        if (!this._composureBar) return;
        const fill = this._composureBar.querySelector('div');
        if (!fill) return;
        fill.style.width = `${value}%`;

        if (value <= 25) {
            fill.style.background = '#ff4444';
        } else if (value <= 50) {
            fill.style.background = '#ffaa44';
        } else {
            fill.style.background = '#44ff88';
        }

        // Low composure warning
        if (value <= 25 && !this._lowComposureWarned) {
            this._lowComposureWarned = true;
            this._lowComposureWarning.style.opacity = '1';
            setTimeout(() => {
                if (this._lowComposureWarning) this._lowComposureWarning.style.opacity = '0.5';
            }, 2000);
        } else if (value > 30) {
            this._lowComposureWarned = false;
            this._lowComposureWarning.style.opacity = '0';
        }
    }

    showAnnouncement(incident, subtitle, duration = 2500) {
        if (!this._announcement) return;
        const incEl = this._announcement.querySelector('#ann-incident');
        const subEl = this._announcement.querySelector('#ann-subtitle');
        if (incEl) incEl.textContent = incident || '';
        if (subEl) subEl.textContent = subtitle || '';

        this._announcement.style.opacity = '1';
        this._announcementTimer = duration;
    }

    hideAnnouncement() {
        if (this._announcement) this._announcement.style.opacity = '0';
    }

    updateAnnouncement(delta) {
        if (this._announcementTimer > 0) {
            this._announcementTimer -= delta * 1000;
            if (this._announcementTimer <= 0) {
                this.hideAnnouncement();
            }
        }
    }

    showHint(text, duration = 3000) {
        if (!this._hintText) return;
        this._hintText.textContent = text;
        this._hintText.style.opacity = '1';
        this._hintTimer = duration;
    }

    updateHint(delta) {
        if (this._hintTimer > 0) {
            this._hintTimer -= delta * 1000;
            if (this._hintTimer <= 0 && this._hintText) {
                this._hintText.style.opacity = '0';
            }
        }
    }

    updateScore(score) {
        const el = document.getElementById('score-display');
        if (el) el.textContent = score.toLocaleString();
    }

    updateCombo(combo) {
        // Combo can be shown if needed
    }

    showHitFeedback(text) {
        // Handled by parent
    }

    showHitMarker() {
        // Handled by parent
    }

    updateWeapon(name, ammo) {
        const el = document.getElementById('weapon-display');
        if (el) el.textContent = `${name} | ${ammo}`;
    }

    updateWeaponSlots(activeIndex) {
        // Weapon slot indicators handled by intro/result or omitted for simplicity
    }

    updateStatusEffects(effects) {
        // Status effects (SLOWED, STUNNED) visual indicators — omitted for Milestone 8
    }

    toggleDebug(enabled) {
        if (this._debugOverlay) {
            this._debugOverlay.style.opacity = enabled ? '1' : '0';
        }
    }

    updateDebug(data) {
        if (!this._debugOverlay) return;
        const lines = [];
        if (data.fps !== undefined) lines.push(`FPS: ${data.fps}`);
        if (data.frameTime !== undefined) lines.push(`Frame: ${data.frameTime.toFixed(1)}ms`);
        if (data.projectiles !== undefined) lines.push(`Projectiles: ${data.projectiles}`);
        if (data.pooled !== undefined) lines.push(`Pooled: ${data.pooled}`);
        if (data.enemies !== undefined) lines.push(`Enemies: ${data.enemies}`);
        if (data.pendingSpawns !== undefined) lines.push(`Pending: ${data.pendingSpawns}`);
        if (data.pendingRespawns !== undefined) lines.push(`Respawn: ${data.pendingRespawns}`);
        if (data.vfx !== undefined) lines.push(`VFX: ${data.vfx}`);
        if (data.worldEffects !== undefined) lines.push(`World FX: ${data.worldEffects}`);
        if (data.vehicles !== undefined) lines.push(`Vehicles: ${data.vehicles}`);
        if (data.carts !== undefined) lines.push(`Carts: ${data.carts}`);
        if (data.trees !== undefined) lines.push(`Trees: ${data.trees}`);
        if (data.drawCalls !== undefined) lines.push(`Draw calls: ${data.drawCalls}`);
        if (data.triangles !== undefined) lines.push(`Triangles: ${data.triangles.toLocaleString()}`);
        if (data.textures !== undefined) lines.push(`Textures: ${data.textures}`);
        if (data.geometries !== undefined) lines.push(`Geometries: ${data.geometries}`);
        // Level flow debug
        if (data.levelPhase !== undefined) lines.push(`Phase: ${data.levelPhase}`);
        if (data.levelPhaseTime !== undefined) lines.push(`Phase Time: ${data.levelPhaseTime}s`);
        if (data.levelEnemiesAlive !== undefined) lines.push(`Wave Alive: ${data.levelEnemiesAlive}`);
        if (data.composure !== undefined) lines.push(`Composure: ${data.composure}`);
        if (data.runTime !== undefined) lines.push(`Run Time: ${data.runTime}s`);

        this._debugOverlay.innerHTML = lines.map(l => `<p style="margin:0">${l}</p>`).join('');
    }

    // Result screen
    showResult(data) {
        this.hideAnnouncement();
        if (this._lowComposureWarning) this._lowComposureWarning.style.opacity = '0';
        if (this._hintText) this._hintText.style.opacity = '0';

        const resultEl = document.createElement('div');
        resultEl.id = 'result-screen';
        resultEl.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);pointer-events:auto;';

        const title = document.createElement('div');
        title.style.cssText = `font-size:32px;font-weight:bold;letter-spacing:3px;margin-bottom:8px;${data.victory ? 'color:#44ff88' : 'color:#ff4444'}`;
        title.textContent = data.victory ? 'INCIDENT RESOLVED' : 'YOU BECAME THE INCIDENT';
        resultEl.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'color:#aaa;font-size:14px;margin-bottom:30px;';
        subtitle.textContent = data.victory ? 'YOU MAY NOW ENTER MEGA MART' : 'Management has been notified.';
        resultEl.appendChild(subtitle);

        const stats = document.createElement('div');
        stats.style.cssText = 'color:#fff;font-size:14px;text-align:left;line-height:1.8;min-width:280px;';
        const rows = [
            ['Score', data.score.toLocaleString()],
            ['Time', `${data.time.toFixed(1)}s`],
            ['Accuracy', `${data.accuracy}%`],
            ['Highest Combo', data.combo],
            ['Incidents Resolved', data.incidents],
            ['Composure', `${data.composure}%`],
            ['', ''],
            ['Crocs Thrown', data.crocThrows],
            ['Balloons Thrown', data.balloonThrows],
            ['Gnomes Thrown', data.gnomeThrows],
            ['', ''],
            ['Rank', `${data.rank.label} — ${data.rank.title}`],
        ];
        for (const [label, value] of rows) {
            if (label === '') { stats.appendChild(document.createElement('br')); continue; }
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;';
            row.innerHTML = `<span style="color:#888">${label}</span><span style="color:#fff;font-weight:bold">${value}</span>`;
            stats.appendChild(row);
        }
        resultEl.appendChild(stats);

        if (data.bestScore !== undefined) {
            const best = document.createElement('div');
            best.style.cssText = 'color:#ffaa44;font-size:12px;margin-top:20px;letter-spacing:1px;';
            best.textContent = `BEST: ${data.bestScore.toLocaleString()} (${data.bestRank?.label})`;
            resultEl.appendChild(best);
        }

        const restart = document.createElement('div');
        restart.style.cssText = 'color:#aaa;font-size:14px;margin-top:30px;letter-spacing:2px;';
        restart.textContent = 'PRESS R TO RETURN TO MEGA MART';
        resultEl.appendChild(restart);

        this._overlay.appendChild(resultEl);
    }

    hideResult() {
        const el = document.getElementById('result-screen');
        if (el) el.remove();
    }

    showIntro() {
        if (!this._overlay) return;
        const introEl = document.createElement('div');
        introEl.id = 'intro-overlay';
        introEl.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;';

        const title = document.createElement('div');
        title.style.cssText = 'color:#ffffff;font-size:48px;font-weight:bold;letter-spacing:6px;';
        title.textContent = 'MEGA MART';
        introEl.appendChild(title);

        const time = document.createElement('div');
        time.style.cssText = 'color:#ffaa44;font-size:16px;margin-top:8px;letter-spacing:3px;';
        time.textContent = '4:37 PM';
        introEl.appendChild(time);

        const flavor = document.createElement('div');
        flavor.style.cssText = 'color:#aaa;font-size:14px;margin-top:20px;letter-spacing:1px;';
        flavor.textContent = 'YOU JUST NEEDED PAPER TOWELS.';
        introEl.appendChild(flavor);

        const objective = document.createElement('div');
        objective.style.cssText = 'color:#ffffff;font-size:18px;font-weight:bold;margin-top:30px;letter-spacing:2px;opacity:0;transition:opacity 1s;';
        objective.textContent = 'OBJECTIVE';
        introEl.appendChild(objective);

        const objText = document.createElement('div');
        objText.style.cssText = 'color:#ffffff;font-size:22px;font-weight:bold;margin-top:4px;letter-spacing:2px;opacity:0;transition:opacity 1s;';
        objText.textContent = 'MAKE IT TO THE ENTRANCE';
        introEl.appendChild(objText);

        this._overlay.appendChild(introEl);

        setTimeout(() => { objective.style.opacity = '1'; }, 1000);
        setTimeout(() => { objText.style.opacity = '1'; }, 1500);
        setTimeout(() => {
            const el = document.getElementById('intro-overlay');
            if (el) el.style.transition = 'opacity 0.8s';
            if (el) el.style.opacity = '0';
            setTimeout(() => { if (el) el.remove(); }, 800);
        }, 3000);
    }

    destroy() {
        if (this._overlay && this._overlay.parentNode) {
            this._overlay.parentNode.removeChild(this._overlay);
        }
    }
}
