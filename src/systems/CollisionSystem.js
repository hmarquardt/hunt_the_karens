import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

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
        this._respawnTimers = [];
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

    registerEnemy(enemy) {
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
                const cooldownKey = `${enemy.uid || enemy}-${proj}`;
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

        const dx = projBounds.center.x - enemyBounds.center.x;
        const dz = projBounds.center.z - enemyBounds.center.z;

        const horizontalDist = Math.sqrt(dx * dx + dz * dz);
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
            return this._sweptSphereCylinderIntersect(segment, enemyBounds, combinedRadius);
        }

        return false;
    }

    _sweptSphereCylinderIntersect(segment, enemyBounds, combinedRadius) {
        const axis = new THREE.Vector3().subVectors(segment.end, segment.start);
        const lengthSq = axis.lengthSq();

        if (lengthSq < 0.0001) return false;

        const dir = axis.clone().normalize();

        const toEnemy = new THREE.Vector3().subVectors(enemyBounds.center, segment.start);
        toEnemy.y = 0;

        const t = toEnemy.dot(dir);

        if (t < 0 || t > Math.sqrt(lengthSq)) return false;

        const closestPoint = segment.start.clone().addScaledVector(dir, t);
        const dist = closestPoint.distanceTo(new THREE.Vector3(enemyBounds.center.x, closestPoint.y, enemyBounds.center.z));

        if (dist > combinedRadius) return false;

        const projMinY = Math.min(segment.start.y, segment.end.y) - (this.projectileSystem?.getActiveProjectiles().find(p => p.mesh?.userData.isProjectile)?.radius || 0.25);
        const projMaxY = Math.max(segment.start.y, segment.end.y) + 0.25;
        const enemyBottom = enemyBounds.center.y;
        const enemyTop = enemyBounds.center.y + enemyBounds.height;

        return projMaxY >= enemyBottom && projMinY <= enemyTop;
    }

    _onProjectileEnemyHit(proj, enemy) {
        const wasAlive = enemy.isAlive;
        enemy.takeDamage(proj.damage, proj);

        if (this.vfxSystem) {
            const hitPos = proj.mesh.position.clone();
            const result = this.scoreSystem ? this.scoreSystem.registerHit(25) : { earned: 25 };
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

        if (!wasAlive && enemy.health <= 0) {
            this._onEnemyDefeated(enemy, proj);
        }

        proj.deactivate();
    }

    _onEnemyDefeated(enemy, proj) {
        if (this.audioSystem) {
            this.audioSystem.playDefeat();
        }

        if (this.scoreSystem) {
            const result = this.scoreSystem.registerDefeat(enemy.scoreValue);
            if (this.hud) {
                this.hud.showHitFeedback(`+${result.earned} ${enemy.name} DEFEATED!`);
            }
        }

        this._startRespawnTimer(enemy);
    }

    _startRespawnTimer(enemy) {
        const originalPosition = enemy.position.clone();
        const originalPatrolCenter = enemy.patrolCenter.clone();

        const timerId = setTimeout(() => {
            enemy.health = enemy.maxHealth;
            enemy.isAlive = true;
            enemy.isStunned = false;
            enemy.isRagdolling = false;
            enemy.position.copy(originalPosition);
            enemy.patrolCenter.copy(originalPatrolCenter);

            if (enemy.mesh) {
                enemy.mesh.visible = true;
                enemy.mesh.position.copy(enemy.position);
            }

            if (enemy.onRespawn) {
                enemy.onRespawn();
            }

            const idx = this._respawnTimers.indexOf(timerId);
            if (idx !== -1) this._respawnTimers.splice(idx, 1);
        }, CONSTANTS.KAREN_RESPAWN_DELAY || 5000);

        this._respawnTimers.push(timerId);
    }

    clear() {
        for (const timerId of this._respawnTimers) {
            clearTimeout(timerId);
        }
        this._respawnTimers = [];
        this._hitCooldowns.clear();

        for (const enemy of this.enemies) {
            if (enemy.mesh && enemy.mesh.parent) {
                enemy.mesh.parent.remove(enemy.mesh);
            }
        }
        this.enemies = [];
    }
}
