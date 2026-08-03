import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';
import { segmentAabbIntersect } from '../math/CollisionMath.js';

const _scratchVec1 = new THREE.Vector3();
const _scratchVec2 = new THREE.Vector3();
const _scratchVec3 = new THREE.Vector3();

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
        this.scene = null;
    }

    setScene(scene) {
        this.scene = scene;
    }

    registerVehicleColliders(colliders) {
        this.vehicleColliders = colliders || [];
        if (this.debugEnabled) {
            this._buildDebugHelpers();
        }
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

    _clearDebugHelpers() {
        for (const helper of this.debugHelpers) {
            if (helper.parent) helper.parent.remove(helper);
            if (helper.geometry) helper.geometry.dispose();
            if (helper.material) helper.material.dispose();
        }
        this.debugHelpers = [];
    }

    setDebug(enabled) {
        if (enabled === this.debugEnabled) return;
        this.debugEnabled = enabled;
        if (enabled) {
            this._buildDebugHelpers();
        } else {
            this._clearDebugHelpers();
        }
    }

    _buildDebugHelpers() {
        this._clearDebugHelpers();
        if (!this.scene) return;
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
            this.scene.add(mesh);
            this.debugHelpers.push(mesh);
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
    }

    _sweptProjectileVehicleCollision(proj, collider) {
        const projBounds = proj.getBounds();
        if (!projBounds) return { hit: false };

        const segment = proj.getCollisionSegment();
        if (!segment) {
            return this._pointProjectileVehicleCollision(proj, collider);
        }

        const col = collider;
        const hw = col.halfWidth;
        const hl = col.halfLength;
        const h = col.height;
        const r = projBounds.radius;

        // Scalar AABB bounds (expanded by projectile radius)
        const minX = -hw - r;
        const maxX = hw + r;
        const minY = -r;
        const maxY = h + r;
        const minZ = -hl - r;
        const maxZ = hl + r;

        // Rotation
        const sinR = Math.sin(col.rotation);
        const cosR = Math.cos(col.rotation);

        // Transform segment start into vehicle-local space
        const sx = segment.start.x - col.position.x;
        const sz = segment.start.z - col.position.z;
        const localStartX = sx * cosR + sz * sinR;
        const localStartY = segment.start.y;
        const localStartZ = -sx * sinR + sz * cosR;

        // Transform segment end into vehicle-local space
        const ex = segment.end.x - col.position.x;
        const ez = segment.end.z - col.position.z;
        const localEndX = ex * cosR + ez * sinR;
        const localEndY = segment.end.y;
        const localEndZ = -ex * sinR + ez * cosR;

        const result = segmentAabbIntersect(
            { x: localStartX, y: localStartY, z: localStartZ },
            { x: localEndX, y: localEndY, z: localEndZ },
            minX, minY, minZ,
            maxX, maxY, maxZ,
        );

        if (!result.hit) return { hit: false };

        // Transform hit point to world space
        const lp = result.localPoint;
        const hitWorld = _scratchVec1.set(
            col.position.x + lp.x * cosR - lp.z * sinR,
            lp.y,
            col.position.z + lp.x * sinR + lp.z * cosR,
        );

        // Transform local normal to world space
        const ln = result.localNormal;
        const worldNormal = _scratchVec2.set(
            ln.x * cosR - ln.z * sinR,
            ln.y,
            ln.x * sinR + ln.z * cosR,
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

        const minX = -hw - r;
        const maxX = hw + r;
        const minY = -r;
        const maxY = h + r;
        const minZ = -hl - r;
        const maxZ = hl + r;

        const dx = projBounds.center.x - col.position.x;
        const dz = projBounds.center.z - col.position.z;
        const cosR = Math.cos(col.rotation);
        const sinR = Math.sin(col.rotation);

        const localX = dx * cosR + dz * sinR;
        const localZ = -dx * sinR + dz * cosR;
        const localY = projBounds.center.y;

        // Confirm inside expanded box
        if (localX < minX || localX > maxX) return { hit: false };
        if (localY < minY || localY > maxY) return { hit: false };
        if (localZ < minZ || localZ > maxZ) return { hit: false };

        // Find nearest face using actual distances to boundaries
        const distToMinX = localX - minX;
        const distToMaxX = maxX - localX;
        const distToMinY = localY - minY;
        const distToMaxY = maxY - localY;
        const distToMinZ = localZ - minZ;
        const distToMaxZ = maxZ - localZ;

        let minDist = distToMinX;
        let faceAxis = 0;
        let faceSign = -1;

        if (distToMaxX < minDist) { minDist = distToMaxX; faceAxis = 0; faceSign = 1; }
        if (distToMinY < minDist) { minDist = distToMinY; faceAxis = 1; faceSign = -1; }
        if (distToMaxY < minDist) { minDist = distToMaxY; faceAxis = 1; faceSign = 1; }
        if (distToMinZ < minDist) { minDist = distToMinZ; faceAxis = 2; faceSign = -1; }
        if (distToMaxZ < minDist) { minDist = distToMaxZ; faceAxis = 2; faceSign = 1; }

        // Surface point: project onto the nearest face
        const hitLocalX = faceAxis === 0 ? (faceSign < 0 ? minX : maxX) : localX;
        const hitLocalY = faceAxis === 1 ? (faceSign < 0 ? minY : maxY) : localY;
        const hitLocalZ = faceAxis === 2 ? (faceSign < 0 ? minZ : maxZ) : localZ;

        const hitWorld = _scratchVec1.set(
            col.position.x + hitLocalX * cosR - hitLocalZ * sinR,
            hitLocalY,
            col.position.z + hitLocalX * sinR + hitLocalZ * cosR,
        );

        // Local normal
        const localNormal = _scratchVec2.set(0, 0, 0);
        if (faceAxis === 0) localNormal.set(faceSign, 0, 0);
        else if (faceAxis === 1) localNormal.set(0, faceSign, 0);
        else localNormal.set(0, 0, faceSign);

        // World normal
        const worldNormal = _scratchVec3.set(
            localNormal.x * cosR - localNormal.z * sinR,
            localNormal.y,
            localNormal.x * sinR + localNormal.z * cosR,
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
        this._clearDebugHelpers();
    }
}

