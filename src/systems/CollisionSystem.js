import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

const _scratchVec1 = new THREE.Vector3();
const _scratchVec2 = new THREE.Vector3();
const _scratchVec3 = new THREE.Vector3();

export class CollisionSystem {
    constructor() {
        this.enemies = [];
        this.projectileSystem = null;
        this.scoreSystem = null;
        this.hud = null;
        this.audioSystem = null;
        this.vfxSystem = null;
        this.debugEnabled = false;
        this.debugHelpers = [];
        this._hitCooldowns = new Map();
        this._onEnemyDefeated = null;
    }

    setProjectileSystem(ps) {
        this.projectileSystem = ps;
    }

    setScoreSystem(ss) {
        this.scoreSystem = ss;
    }

    setHUD(hud) {
        this.hud = hud;
    }

    setAudioSystem(audio) {
        this.audioSystem = audio;
    }

    setVFXSystem(vfx) {
        this.vfxSystem = vfx;
    }

    setDebug(enabled) {
        this.debugEnabled = enabled;
        if (!enabled) {
            for (const helper of this.debugHelpers) {
                helper.parent?.remove(helper);
            }
            this.debugHelpers = [];
        }
    }

    setOnEnemyDefeated(callback) {
        this._onEnemyDefeated = callback;
    }

    registerEnemy(enemy) {
        if (this.debugEnabled && this.enemies.includes(enemy)) {
            console.warn('[CollisionSystem] Enemy already registered:', enemy.uid);
        }
        this.enemies.push(enemy);
    }

    unregisterEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);
    }

    getEnemyCount() {
        return this.enemies.length;
    }

    update(delta, playerPosition) {
        if (!this.projectileSystem) return;

        const projectiles = this.projectileSystem.getActiveProjectiles();

        for (const proj of projectiles) {
            if (!proj.active || !proj.mesh) continue;

            for (const enemy of this.enemies) {
                if (!enemy.isAlive) continue;

                const now = performance.now();
                const cooldownKey = `${enemy.uid}-${proj}`;
                if (this._hitCooldowns.has(cooldownKey)) {
                    if (now - this._hitCooldowns.get(cooldownKey) < 200) {
                        continue;
                    }
                }

                if (this._checkProjectileEnemyCollision(proj, enemy)) {
                    this._hitCooldowns.set(cooldownKey, now);
                    this._onProjectileEnemyHit(proj, enemy);
                }
            }
        }

        for (const [key, time] of this._hitCooldowns) {
            if (performance.now() - time > 5000) {
                this._hitCooldowns.delete(key);
            }
        }
    }

    _checkProjectileEnemyCollision(proj, enemy) {
        const projBounds = proj.getBounds();
        if (!projBounds) return false;

        const enemyBounds = enemy.getBounds();

        _scratchVec1.set(
            projBounds.center.x - enemyBounds.center.x,
            0,
            projBounds.center.z - enemyBounds.center.z
        );

        const horizontalDist = _scratchVec1.length();
        const combinedRadius = projBounds.radius + enemyBounds.radius;

        if (horizontalDist <= combinedRadius) {
            const projBottom = projBounds.center.y - projBounds.radius;
            const projTop = projBounds.center.y + projBounds.radius;
            const enemyBottom = enemyBounds.center.y;
            const enemyTop = enemyBounds.center.y + enemyBounds.height;

            if (projTop >= enemyBottom && projBottom <= enemyTop) {
                return true;
            }
        }

        const segment = proj.getCollisionSegment();
        if (segment) {
            return this._sweptSphereCylinderIntersect(segment, projBounds.radius, enemyBounds);
        }

        return false;
    }

    _sweptSphereCylinderIntersect(segment, projectileRadius, enemyBounds) {
        _scratchVec1.subVectors(segment.end, segment.start);
        const lengthSq = _scratchVec1.lengthSq();

        if (lengthSq < 0.0001) return false;

        _scratchVec2.copy(_scratchVec1).normalize();

        _scratchVec3.subVectors(enemyBounds.center, segment.start);
        _scratchVec3.y = 0;

        const t = _scratchVec3.dot(_scratchVec2);

        if (t < 0 || t > Math.sqrt(lengthSq)) return false;

        _scratchVec1.copy(segment.start).addScaledVector(_scratchVec2, t);
        const dist = _scratchVec1.distanceTo(
            _scratchVec3.set(enemyBounds.center.x, _scratchVec1.y, enemyBounds.center.z)
        );

        if (dist > projectileRadius + enemyBounds.radius) return false;

        const projMinY = Math.min(segment.start.y, segment.end.y) - projectileRadius;
        const projMaxY = Math.max(segment.start.y, segment.end.y) + projectileRadius;
        const enemyBottom = enemyBounds.center.y;
        const enemyTop = enemyBounds.center.y + enemyBounds.height;

        return projMaxY >= enemyBottom && projMinY <= enemyTop;
    }

    _onProjectileEnemyHit(proj, enemy) {
        const wasAlive = enemy.isAlive;
        enemy.takeDamage(proj.damage, proj);

        const wasDefeated = wasAlive && !enemy.isAlive;

        if (this.vfxSystem) {
            const hitPos = proj.mesh.position.clone();
            const result = this.scoreSystem ? this.scoreSystem.registerHit(25) : { score: 0, earned: 25 };
            this.vfxSystem.spawnImpact(hitPos, result.score, result.earned);
        }

        if (this.audioSystem) {
            this.audioSystem.playHit();
        }

        if (this.hud) {
            const reaction = enemy.currentDialogue || 'Direct hit!';
            this.hud.showHitFeedback(reaction);
            this.hud.showHitMarker();
        }

        if (enemy.onImpact) {
            enemy.onImpact(proj);
        }

        if (wasDefeated) {
            if (this._onEnemyDefeated) {
                this._onEnemyDefeated(enemy);
            }
        }

        proj.deactivate();
    }

    clear() {
        this._hitCooldowns.clear();
        this.enemies = [];
    }
}
