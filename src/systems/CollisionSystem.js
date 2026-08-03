import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

const _scratchVec1 = new THREE.Vector3();
const _scratchVec2 = new THREE.Vector3();
const _scratchVec3 = new THREE.Vector3();
const _scratchVec4 = new THREE.Vector3();

const VEHICLE_HIT_MESSAGES = [
    'INSURANCE CLAIM PENDING',
    'THAT\'LL BUFF OUT',
    'PARKING LOT JUSTICE',
];

export class CollisionSystem {
    constructor() {
        this.enemies = [];
        this.projectileSystem = null;
        this.scoreSystem = null;
        this.hud = null;
        this.audioSystem = null;
        this.vfxSystem = null;
        this.worldEffectSystem = null;
        this.statusDefs = null;
        this.debugEnabled = false;
        this.debugHelpers = [];
        this._hitCooldowns = new Map();
        this._onEnemyDefeated = null;
        this.vehicleColliders = [];
        this._lastVehicleHitMsg = 0;
    }

    registerVehicleColliders(colliders) {
        this.vehicleColliders = colliders || [];
    }

    clearVehicleColliders() {
        this.vehicleColliders = [];
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

    setWorldEffectSystem(wes) {
        this.worldEffectSystem = wes;
    }

    setStatusDefs(defs) {
        this.statusDefs = defs;
    }

    setDebug(enabled) {
        this.debugEnabled = enabled;
        if (!enabled) {
            for (const helper of this.debugHelpers) {
                helper.parent?.remove(helper);
            }
            this.debugHelpers = [];
        } else {
            this._buildDebugHelpers();
        }
    }

    _buildDebugHelpers() {
        this.debugHelpers = [];
        for (const col of this.vehicleColliders) {
            const hw = col.halfWidth;
            const hl = col.halfLength;
            const h = col.height;
            const geo = new THREE.BoxGeometry(hw * 2, h, hl * 2);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.3,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(col.position.x, h / 2, col.position.z);
            mesh.rotation.y = col.rotation;
            this.debugHelpers.push(mesh);
        }
    }

    _updateDebugHelpers() {
        for (const helper of this.debugHelpers) {
            if (helper.parent && !helper.parent.visible) {
                helper.visible = false;
            }
        }
    }

    setOnEnemyDefeated(callback) {
        this._onEnemyDefeated = callback;
    }

    registerEnemy(enemy) {
        if (this.enemies.includes(enemy)) {
            if (this.debugEnabled) {
                console.warn('[CollisionSystem] Enemy already registered:', enemy.uid);
            }
            return;
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

            // Check vehicle collisions first (swept)
            for (const collider of this.vehicleColliders) {
                const result = this._sweptProjectileVehicleCollision(proj, collider);
                if (result.hit) {
                    this._onProjectileVehicleHit(proj, collider, result);
                    break;
                }
            }

            if (!proj.active) continue;

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

        if (this.debugEnabled && this.debugHelpers.length > 0) {
            this._updateDebugHelpers();
        }
    }

    _sweptProjectileVehicleCollision(proj, collider) {
        const projBounds = proj.getBounds();
        if (!projBounds) return { hit: false };

        const segment = proj.getCollisionSegment();
        if (!segment) {
            // Fallback: current position test
            return this._pointProjectileVehicleCollision(proj, collider);
        }

        const col = collider;
        const hw = col.halfWidth;
        const hl = col.halfLength;
        const h = col.height;
        const r = projBounds.radius;

        // Expanded AABB in vehicle-local space
        const min = _scratchVec1.set(-hw - r, -r, -hl - r);
        const max = _scratchVec2.set(hw + r, h + r, hl + r);

        // Transform segment start/end into vehicle-local space
        const sinR = Math.sin(col.rotation);
        const cosR = Math.cos(col.rotation);

        const sx = segment.start.x - col.position.x;
        const sz = segment.start.z - col.position.z;
        const localStart = _scratchVec3.set(
            sx * cosR + sz * sinR,
            segment.start.y,
            -sx * sinR + sz * cosR
        );

        const ex = segment.end.x - col.position.x;
        const ez = segment.end.z - col.position.z;
        const localEnd = _scratchVec4.set(
            ex * cosR + ez * sinR,
            segment.end.y,
            -ex * sinR + ez * cosR
        );

        // Slab intersection (segment vs AABB)
        const dir = _scratchVec1.subVectors(localEnd, localStart);
        const lenSq = dir.lengthSq();
        if (lenSq < 0.0001) {
            return this._pointProjectileVehicleCollision(proj, collider);
        }

        const invDir = _scratchVec2.set(
            dir.x !== 0 ? 1 / dir.x : Number.MAX_VALUE,
            dir.y !== 0 ? 1 / dir.y : Number.MAX_VALUE,
            dir.z !== 0 ? 1 / dir.z : Number.MAX_VALUE,
        );

        let tMin = 0;
        let tMax = 1;

        for (let i = 0; i < 3; i++) {
            const axis = i === 0 ? 'x' : i === 1 ? 'y' : 'z';
            const minVal = min[axis];
            const maxVal = max[axis];
            const startVal = localStart[axis];
            const invD = invDir[axis];

            let t0 = (minVal - startVal) * invD;
            let t1 = (maxVal - startVal) * invD;

            if (invD < 0) {
                const tmp = t0;
                t0 = t1;
                t1 = tmp;
            }

            if (t0 > tMin) tMin = t0;
            if (t1 < tMax) tMax = t1;

            if (tMin > tMax) return { hit: false };
        }

        if (tMin < 0 || tMin > 1) return { hit: false };

        // Compute hit point in world space
        const hitLocal = _scratchVec1.copy(localStart).addScaledVector(dir, tMin);
        const hitWorld = _scratchVec2.set(
            col.position.x + hitLocal.x * cosR - hitLocal.z * sinR,
            hitLocal.y,
            col.position.z + hitLocal.x * sinR + hitLocal.z * cosR
        );

        // Compute approximate surface normal
        // Find which face was hit (closest to min/max boundary)
        const distToMinX = Math.abs(hitLocal.x - min.x);
        const distToMaxX = Math.abs(hitLocal.x - max.x);
        const distToMinY = Math.abs(hitLocal.y - min.y);
        const distToMaxY = Math.abs(hitLocal.y - max.y);
        const distToMinZ = Math.abs(hitLocal.z - min.z);
        const distToMaxZ = Math.abs(hitLocal.z - max.z);

        const minDist = Math.min(distToMinX, distToMaxX, distToMinY, distToMaxY, distToMinZ, distToMaxZ);

        let localNormal = _scratchVec3.set(0, 0, 0);
        if (minDist === distToMinX) localNormal.set(-1, 0, 0);
        else if (minDist === distToMaxX) localNormal.set(1, 0, 0);
        else if (minDist === distToMinY) localNormal.set(0, -1, 0);
        else if (minDist === distToMaxY) localNormal.set(0, 1, 0);
        else if (minDist === distToMinZ) localNormal.set(0, 0, -1);
        else localNormal.set(0, 0, 1);

        // Transform normal to world space
        const worldNormal = _scratchVec4.set(
            localNormal.x * cosR - localNormal.z * sinR,
            localNormal.y,
            localNormal.x * sinR + localNormal.z * cosR
        ).normalize();

        return {
            hit: true,
            point: hitWorld.clone(),
            normal: worldNormal.clone(),
        };
    }

    _pointProjectileVehicleCollision(proj, collider) {
        const projBounds = proj.getBounds();
        if (!projBounds) return { hit: false };

        const col = collider;
        const hw = col.halfWidth;
        const hl = col.halfLength;
        const h = col.height;
        const r = projBounds.radius;

        // Transform projectile center into vehicle-local space
        const dx = projBounds.center.x - col.position.x;
        const dz = projBounds.center.z - col.position.z;
        const cosR = Math.cos(col.rotation);
        const sinR = Math.sin(col.rotation);

        const localX = dx * cosR + dz * sinR;
        const localZ = -dx * sinR + dz * cosR;
        const localY = projBounds.center.y;

        const inX = Math.abs(localX) <= hw + r;
        const inZ = Math.abs(localZ) <= hl + r;
        const inY = localY >= -r && localY <= h + r;

        if (!inX || !inZ || !inY) return { hit: false };

        // Approximate hit point: project onto nearest face
        const distToMinX = Math.abs(localX) - hw;
        const distToMaxX = hw + r - Math.abs(localX);
        const distToMinZ = Math.abs(localZ) - hl;
        const distToMaxZ = hl + r - Math.abs(localZ);

        const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

        let hitLocal = _scratchVec1.set(localX, localY, localZ);
        if (minDist === distToMinX) hitLocal.x = Math.sign(localX) * (hw + r);
        else if (minDist === distToMaxX) hitLocal.x = Math.sign(localX) * (hw + r);
        else if (minDist === distToMinZ) hitLocal.z = Math.sign(localZ) * (hl + r);
        else hitLocal.z = Math.sign(localZ) * (hl + r);

        const hitWorld = _scratchVec2.set(
            col.position.x + hitLocal.x * cosR - hitLocal.z * sinR,
            hitLocal.y,
            col.position.z + hitLocal.x * sinR + hitLocal.z * cosR
        );

        let localNormal = _scratchVec3.set(0, 0, 0);
        if (minDist === distToMinX) localNormal.set(-Math.sign(localX), 0, 0);
        else if (minDist === distToMaxX) localNormal.set(Math.sign(localX), 0, 0);
        else if (minDist === distToMinZ) localNormal.set(0, 0, -Math.sign(localZ));
        else localNormal.set(0, 0, Math.sign(localZ));

        const worldNormal = _scratchVec4.set(
            localNormal.x * cosR - localNormal.z * sinR,
            localNormal.y,
            localNormal.x * sinR + localNormal.z * cosR
        ).normalize();

        return {
            hit: true,
            point: hitWorld.clone(),
            normal: worldNormal.clone(),
        };
    }

    _onProjectileVehicleHit(proj, collider, result) {
        const hitPos = result.point || proj.mesh.position.clone();
        const impactType = proj.impactEffect || 'thud';

        if (this.vfxSystem) {
            if (impactType === 'splash') {
                this.vfxSystem.spawnImpact(hitPos, 0, 0, 'splash');
            } else if (impactType === 'ceramic') {
                this.vfxSystem.spawnImpact(hitPos, 0, 0, 'ceramic');
            } else {
                this.vfxSystem.spawnImpact(hitPos, 0, 0, 'spark');
            }
        }

        if (this.audioSystem) {
            if (impactType === 'splash') {
                this.audioSystem.playSplash();
            } else if (impactType === 'ceramic') {
                this.audioSystem.playGnomeImpact();
            } else {
                this.audioSystem.playHit();
            }
        }

        // Occasional comedic HUD feedback (not on every hit)
        if (this.hud) {
            const now = performance.now();
            if (now - this._lastVehicleHitMsg > 3000) {
                this._lastVehicleHitMsg = now;
                const msg = VEHICLE_HIT_MESSAGES[Math.floor(Math.random() * VEHICLE_HIT_MESSAGES.length)];
                this.hud.showHitFeedback(msg);
            }
        }

        proj.deactivate();
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
            this.vfxSystem.spawnImpact(hitPos, result.score, result.earned, proj.impactEffect, proj.statusEffect);
        }

        if (this.audioSystem) {
            if (proj.impactEffect === 'splash') {
                this.audioSystem.playSplash();
            } else if (proj.impactEffect === 'ceramic') {
                this.audioSystem.playGnomeImpact();
            } else {
                this.audioSystem.playHit();
            }
        }

        if (this.hud) {
            const reaction = enemy.currentDialogue || 'Direct hit!';
            this.hud.showHitFeedback(reaction);
            this.hud.showHitMarker();
        }

        if (proj.statusEffect && enemy.statusEffects && proj.statusDuration > 0) {
            enemy.statusEffects.add({
                id: proj.statusEffect,
                name: proj.statusEffect.toUpperCase(),
                duration: proj.statusDuration,
                ...this.statusDefs?.[proj.statusEffect],
            });
        }

        if (proj.splashRadius > 0) {
            this._applySplashEffect(proj, enemy);
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

    _applySplashEffect(proj, hitEnemy) {
        const hitPos = proj.mesh?.position || hitEnemy.position;
        const splashRadius = proj.splashRadius;

        for (const enemy of this.enemies) {
            if (enemy === hitEnemy || !enemy.isAlive) continue;

            const dist = enemy.position.distanceTo(hitPos);
            if (dist <= splashRadius) {
                if (proj.statusEffect && enemy.statusEffects) {
                    enemy.statusEffects.add({
                        id: proj.statusEffect,
                        name: proj.statusEffect.toUpperCase(),
                        duration: proj.statusDuration,
                        ...this.statusDefs?.[proj.statusEffect],
                    });
                }

                enemy.takeDamage(proj.damage * 0.5, proj);
                this._checkDefeatAndRoute(enemy);
            }
        }
    }

    _checkDefeatAndRoute(enemy) {
        if (!enemy.isAlive && this._onEnemyDefeated) {
            this._onEnemyDefeated(enemy);
        }
    }

    clear() {
        this._hitCooldowns.clear();
        this.enemies = [];
        this.vehicleColliders = [];
        for (const helper of this.debugHelpers) {
            helper.parent?.remove(helper);
        }
        this.debugHelpers = [];
    }
}
