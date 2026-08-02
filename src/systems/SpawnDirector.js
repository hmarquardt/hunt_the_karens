import * as THREE from 'three';

export class SpawnDefinition {
    constructor(config) {
        this.karenType = config.karenType || 'manager';
        this.position = config.position || new THREE.Vector3();
        this.orientation = config.orientation || 0;
        this.patrolCenter = config.patrolCenter || config.position?.clone() || new THREE.Vector3();
        this.patrolRadius = config.patrolRadius || 3;
        this.spawnDelay = config.spawnDelay || 0;
        this.respawnEnabled = config.respawnEnabled !== false;
        this.respawnDelay = config.respawnDelay || 5000;
        this.enabled = true;
    }

    toKarenConfig() {
        return {
            karenType: this.karenType,
            patrolCenter: this.patrolCenter.clone(),
            patrolRadius: this.patrolRadius,
        };
    }
}

export class SpawnDirector {
    constructor(sceneManager, collisionSystem, characterAssets, karenRegistry) {
        this.sceneManager = sceneManager;
        this.collisionSystem = collisionSystem;
        this.characterAssets = characterAssets || new Map();
        this.karenRegistry = karenRegistry || null;
        this.definitions = [];
        this.spawnedEntities = [];
        this.pendingSpawns = [];
        this._respawnTimers = [];
    }

    setKarenRegistry(registry) {
        this.karenRegistry = registry;
    }

    addSpawnDefinition(def) {
        this.definitions.push(def);
    }

    addSpawnDefinitions(defs) {
        for (const def of defs) {
            this.definitions.push(def);
        }
    }

    async spawnAll(factoryFn) {
        for (const def of this.definitions) {
            if (!def.enabled) continue;

            if (def.spawnDelay > 0) {
                this.pendingSpawns.push({ def, time: def.spawnDelay, factoryFn });
            } else {
                await this._spawnEntity(def, factoryFn);
            }
        }
    }

    async _spawnEntity(def, factoryFn) {
        if (this.karenRegistry && !this.karenRegistry[def.karenType] && def.karenType !== 'manager') {
            console.warn('[SpawnDirector] Unknown Karen type:', def.karenType, '- defaulting to manager');
        }

        const karenConfig = def.toKarenConfig();
        const karen = factoryFn(karenConfig);

        if (!karen) {
            console.warn('[SpawnDirector] Factory returned null for type:', def.karenType);
            return null;
        }

        karen.setPosition(def.position.x, def.position.y, def.position.z);

        const assetName = karen.characterAssetName || karen._pendingAsset;
        if (assetName && this.characterAssets.has(assetName)) {
            const asset = this.characterAssets.get(assetName);
            const instance = asset.cloneInstance();
            const clips = asset.getAnimationClips();
            karen.attachCharacterAsset(instance, clips);

            if (def.orientation && karen.mesh) {
                karen.mesh.rotation.y = def.orientation;
            }

            karen.mesh.position.copy(karen.position);
        } else if (karen.mesh) {
            if (def.orientation) {
                karen.mesh.rotation.y = def.orientation;
            }
            karen.mesh.position.copy(karen.position);
        }

        karen._spawnDefinition = def;

        this.sceneManager.registerEnemy(karen);
        this.collisionSystem.registerEnemy(karen);
        this.spawnedEntities.push(karen);

        return karen;
    }

    update(delta) {
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const pending = this.pendingSpawns[i];
            pending.time -= delta * 1000;

            if (pending.time <= 0) {
                this._spawnEntity(pending.def, pending.factoryFn);
                this.pendingSpawns.splice(i, 1);
            }
        }

        for (let i = this._respawnTimers.length - 1; i >= 0; i--) {
            const timer = this._respawnTimers[i];
            timer.remaining -= delta * 1000;

            if (timer.remaining <= 0) {
                this._respawnEntity(timer);
                this._respawnTimers.splice(i, 1);
            }
        }
    }

    scheduleRespawn(enemy) {
        const def = enemy._spawnDefinition;
        if (!def || !def.respawnEnabled) return;

        for (const timer of this._respawnTimers) {
            if (timer.entity === enemy) return;
        }

        this._respawnTimers.push({
            entity: enemy,
            definition: def,
            remaining: def.respawnDelay || 5000,
        });
    }

    _respawnEntity(timer) {
        const enemy = timer.entity;
        const def = timer.definition;

        enemy.health = enemy.maxHealth;
        enemy.isAlive = true;
        enemy.isStunned = false;
        enemy.stateMachine?.transitionTo('patrol');

        enemy.position.copy(def.position);
        enemy.patrolCenter.copy(def.patrolCenter);

        if (enemy.mesh) {
            enemy.mesh.visible = true;
            enemy.mesh.position.copy(enemy.position);
        }

        if (enemy.onRespawn) {
            enemy.onRespawn();
        }
    }

    clear() {
        for (const timer of this._respawnTimers) {
            if (timer.entity) {
                timer.entity.isAlive = false;
            }
        }
        this._respawnTimers = [];

        for (const entity of this.spawnedEntities) {
            this.collisionSystem.unregisterEnemy(entity);
            this.sceneManager.unregisterEnemy(entity);
        }
        this.spawnedEntities = [];
        this.pendingSpawns = [];
    }

    getEntities() {
        return this.spawnedEntities;
    }

    getPendingCount() {
        return this.pendingSpawns.length;
    }

    getRespawnCount() {
        return this._respawnTimers.length;
    }
}
