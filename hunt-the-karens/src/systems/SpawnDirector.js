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
}

export class SpawnDirector {
    constructor(sceneManager, collisionSystem, characterAssets) {
        this.sceneManager = sceneManager;
        this.collisionSystem = collisionSystem;
        this.characterAssets = characterAssets || new Map();
        this.definitions = [];
        this.spawnedEntities = [];
        this.pendingSpawns = [];
    }

    addSpawnDefinition(def) {
        this.definitions.push(def);
    }

    addSpawnDefinitions(defs) {
        for (const def of defs) {
            this.definitions.push(def);
        }
    }

    async spawnAll(KarenFactory) {
        for (const def of this.definitions) {
            if (!def.enabled) continue;

            if (def.spawnDelay > 0) {
                this.pendingSpawns.push({ def, time: def.spawnDelay, KarenFactory });
            } else {
                await this._spawnEntity(def, KarenFactory);
            }
        }
    }

    async _spawnEntity(def, KarenFactory) {
        const config = {
            patrolCenter: def.patrolCenter.clone(),
            patrolRadius: def.patrolRadius,
        };

        const karen = new KarenFactory(config);
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

        karen.onRespawn = () => {
            karen.mesh.visible = true;
        };

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
                this._spawnEntity(pending.def, pending.KarenFactory);
                this.pendingSpawns.splice(i, 1);
            }
        }
    }

    clear() {
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
}
