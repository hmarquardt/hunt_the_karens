import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { AssetManager } from './AssetManager.js';
import { FPSController } from '../player/FPSController.js';
import { CrocLauncher } from '../weapons/CrocLauncher.js';
import { WaterBalloonLauncher } from '../weapons/WaterBalloonLauncher.js';
import { GardenGnomeLauncher } from '../weapons/GardenGnomeLauncher.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { FirstPersonWeaponView } from '../weapons/FirstPersonWeaponView.js';
import { ProjectileSystem } from '../systems/ProjectileSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { VFXSystem } from '../systems/VFXSystem.js';
import { WorldEffectSystem } from '../systems/WorldEffectSystem.js';
import { SpawnDirector } from '../systems/SpawnDirector.js';
import { GameHUD } from '../ui/GameHUD.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { WEAPON_DEFS, STATUS_DEFS } from '../config/weapons.js';
import * as CONSTANTS from '../config/constants.js';
import { LevelFlowController, PHASES, LEVEL_CONFIG } from '../gameplay/LevelFlowController.js';
import { RunStats } from '../gameplay/RunStats.js';
import { HighScore } from '../gameplay/HighScore.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = true;
        this.debugEnabled = false;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentFPS = 0;

        this.renderer = new Renderer();
        this.sceneManager = new SceneManager(this.renderer.scene);
        this.inputManager = new InputManager();
        this.assetManager = new AssetManager();
        this.audioSystem = new AudioSystem();
        this.collisionSystem = new CollisionSystem();
        this.scoreSystem = new ScoreSystem();
        this.projectileSystem = new ProjectileSystem(this.renderer.scene);
        this.vfxSystem = new VFXSystem(this.renderer.scene);
        this.worldEffectSystem = new WorldEffectSystem(this.renderer.scene);
        this.spawnDirector = null;
        this.hud = new GameHUD(this.scoreSystem);
        this.weaponManager = new WeaponManager(this.renderer.camera, this.inputManager);

        this._initAudioOnInteraction = this._initAudioOnInteraction.bind(this);

        this.playerController = null;
        this.level = null;

        // Level flow
        this.levelFlow = new LevelFlowController();
        this.runStats = new RunStats();
        this._composure = 100;
        this._weaponsRegistered = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
    }

    async init(karenRegistry) {
        await this.assetManager.loadAll();

        this.renderer.init();
        this.inputManager.init();

        this.playerController = new FPSController(
            this.renderer.camera,
            this.inputManager,
            this.sceneManager
        );
        this.playerController.init();

        this._setupWeapons();

        this.collisionSystem.setProjectileSystem(this.projectileSystem);
        this.collisionSystem.setScoreSystem(this.scoreSystem);
        this.collisionSystem.setHUD(this.hud);
        this.collisionSystem.setAudioSystem(this.audioSystem);
        this.collisionSystem.setVFXSystem(this.vfxSystem);
        this.collisionSystem.setWorldEffectSystem(this.worldEffectSystem);
        this.collisionSystem.setStatusDefs(STATUS_DEFS);
        this.collisionSystem.setScene(this.sceneManager.scene);
        this.worldEffectSystem.setStatusDefs(STATUS_DEFS);
        this.collisionSystem.setOnEnemyDefeated((enemy) => {
            this._onEnemyDefeated(enemy);
        });

        this.abilityContext = {
            worldEffectSystem: this.worldEffectSystem,
            playerStatusController: this.playerController.statusEffects,
        };

        this.scoreSystem.setHUD(this.hud);

        const characterAssets = new Map();
        for (const [name] of this.assetManager.characterAssets) {
            characterAssets.set(name, this.assetManager.getCharacterAsset(name));
        }

        this.spawnDirector = new SpawnDirector(
            this.sceneManager,
            this.collisionSystem,
            characterAssets,
            karenRegistry
        );

        this._resetInProgress = false;

        // Build HUD DOM
        this.hud.build();

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        document.addEventListener('click', this._initAudioOnInteraction, { once: true });

        window.addEventListener('resize', () => this.renderer.onResize());

        console.log('[Game] Initialized successfully');
    }

    _setupWeapons() {
        if (this._weaponsRegistered) return;
        this._weaponsRegistered = true;

        const camera = this.renderer.camera;
        const inputManager = this.inputManager;
        const projectileSystem = this.projectileSystem;
        const vfxSystem = this.vfxSystem;
        const audioSystem = this.audioSystem;

        const crocWeapon = new CrocLauncher(
            camera, inputManager, projectileSystem, vfxSystem, audioSystem,
            WEAPON_DEFS.croc
        );
        const crocView = new FirstPersonWeaponView(camera, WEAPON_DEFS.croc);
        crocWeapon.setView(crocView);
        this.weaponManager.registerWeapon('croc', crocWeapon, crocView, 0);

        const waterBalloonWeapon = new WaterBalloonLauncher(
            camera, inputManager, projectileSystem, vfxSystem, audioSystem,
            WEAPON_DEFS.waterBalloon
        );
        const waterBalloonView = new FirstPersonWeaponView(camera, WEAPON_DEFS.waterBalloon);
        waterBalloonWeapon.setView(waterBalloonView);
        this.weaponManager.registerWeapon('waterBalloon', waterBalloonWeapon, waterBalloonView, 1);

        const gardenGnomeWeapon = new GardenGnomeLauncher(
            camera, inputManager, projectileSystem, vfxSystem, audioSystem,
            WEAPON_DEFS.gardenGnome
        );
        const gardenGnomeView = new FirstPersonWeaponView(camera, WEAPON_DEFS.gardenGnome);
        gardenGnomeWeapon.setView(gardenGnomeView);
        this.weaponManager.registerWeapon('gardenGnome', gardenGnomeWeapon, gardenGnomeView, 2);

        this.weaponManager.switchTo(0);
    }

    registerKarenFactory(type, factory) {
        if (this.spawnDirector) {
            this.spawnDirector.setKarenRegistry({ [type]: factory });
        }
    }

    async loadLevel(levelInstance, factoryFn) {
        this.isPaused = true;

        if (this.level?.dispose) {
            this.level.dispose();
        }

        if (this.spawnDirector) {
            this.spawnDirector.clear();
        }

        this.collisionSystem.clear();
        this.projectileSystem.clear();
        this.vfxSystem.clear();
        this.worldEffectSystem.clear();
        this.scoreSystem.reset();
        this.weaponManager.clear();

        this.sceneManager.clear();

        await levelInstance.build(this.sceneManager);

        if (typeof levelInstance.getVehicleColliders === 'function') {
            this.collisionSystem.registerVehicleColliders(levelInstance.getVehicleColliders());
        }

        this.playerController.reset(levelInstance.spawnPoint);

        // Reset level flow
        this.levelFlow.reset();
        this.runStats.reset();
        this._composure = 100;
        this.hud.updateComposure(100);

        // Start intro
        this.hud.showIntro();
        this.hud.updateObjective(this.levelFlow.getObjective());

        // Register weapon tracking callbacks
        this._setupWeaponTracking();

        // Store factory fn
        if (factoryFn) {
            this._lastFactoryFn = factoryFn;
        }

        this.level = levelInstance;
        this._resultShown = false;
        this.hud.updateScore(0);
        this.hud.updateCombo(0);

        this.isPaused = false;

        // Start run timer after intro
        setTimeout(() => {
            this.runStats.startTimer();
        }, LEVEL_CONFIG.introDuration * 1000);
    }

    _setupWeaponTracking() {
        const origFire = this.weaponManager.getActiveWeapon?.bind(this.weaponManager);
    }

    _onEnemyDefeated(enemy) {
        if (this.audioSystem) {
            this.audioSystem.playDefeat();
        }

        // Run stats
        this.runStats.recordHit();
        this.runStats.recordCombo(this.scoreSystem.getCombo());

        // Level flow: notify enemy defeat
        this.levelFlow.onEnemyDefeated(enemy);

        // Semantic defeat text
        const defeatText = this._getDefeatText(enemy);
        if (this.scoreSystem) {
            const result = this.scoreSystem.registerDefeat(enemy.scoreValue);
            if (this.hud) {
                this.hud.showHitFeedback(`+${result.earned} ${defeatText}`);
            }
        }

        // No automatic respawn for level 1
    }

    _getDefeatText(enemy) {
        const type = enemy.karenType || enemy.type || '';
        switch (type) {
            case 'manager': return 'RAGE QUIT';
            case 'hoa': return 'JURISDICTION DISPUTED';
            case 'retail_return': return 'RETURN DENIED';
            default: return 'INCIDENT RESOLVED';
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.clock.start();
        this._tick();
        console.log('[Game] Started');
    }

    stop() {
        this.isRunning = false;
        this.clock.stop();
        console.log('[Game] Stopped');
    }

    reset() {
        if (this._resetInProgress) return;
        if (!this.level || !this._lastFactoryFn) return;

        this._resetInProgress = true;
        this.hud.hideResult();
        this.loadLevel(this.level, this._lastFactoryFn).then(() => {
            this._resetInProgress = false;
        }).catch(() => {
            this._resetInProgress = false;
        });
    }

    _showResultScreen() {
        this.runStats.stopTimer();
        this.runStats.composureRemaining = Math.max(0, this._composure);
        this.runStats.score = this.scoreSystem.getScore();
        this.runStats.victory = this.levelFlow.getPhase() === PHASES.VICTORY;
        this.runStats.incidentsResolved = this.levelFlow.getPhase() === PHASES.VICTORY ? 4 : 0;

        // Composure bonus
        if (this.runStats.victory && this._composure > 0) {
            this.runStats.addScore(Math.round(this._composure * 10));
        }

        // Sync throw counts from projectile system
        const throws = this.projectileSystem.getThrowCounts();

        const rank = this.runStats.getRank();
        const best = HighScore.save({
            score: this.runStats.score,
            time: this.runStats.totalTime,
            rank,
            combo: this.runStats.highestCombo,
        });

        this.hud.showResult({
            victory: this.runStats.victory,
            score: this.runStats.score,
            time: this.runStats.totalTime,
            accuracy: this.runStats.getAccuracy(),
            combo: this.runStats.highestCombo,
            incidents: this.runStats.incidentsResolved,
            composure: Math.round(this._composure),
            crocThrows: throws.croc,
            balloonThrows: throws.waterBalloon,
            gnomeThrows: throws.gardenGnome,
            rank,
            bestScore: best.bestScore,
            bestRank: { label: best.bestRank },
        });

        this.levelFlow.showResult();
    }

    _advancePhaseDebug() {
        if (!this.debugEnabled) return;
        const phase = this.levelFlow.getPhase();
        if (this.levelFlow.isWaveActive()) {
            // Resolve all enemies to complete wave
            const enemies = this.spawnDirector?.getEntities() || [];
            for (const e of enemies) {
                if (e.isAlive) {
                    e.isAlive = false;
                    this.levelFlow.onEnemyDefeated(e);
                }
            }
        } else if (phase === PHASES.INTRO) {
            this.levelFlow.phaseTime = LEVEL_CONFIG.introDuration + 1;
        } else if (phase.startsWith('BREATHER')) {
            this.levelFlow.phaseTime = LEVEL_CONFIG.breatherDuration + 1;
        }
    }

    _refillComposureDebug() {
        if (!this.debugEnabled) return;
        this._composure = Math.min(100, this._composure + 25);
        this.hud.updateComposure(this._composure);
    }

    toggleDebug() {
        this.debugEnabled = !this.debugEnabled;
        this.hud.toggleDebug(this.debugEnabled);
        this.collisionSystem.setDebug(this.debugEnabled);
        this.projectileSystem.setDebug(this.debugEnabled);
        console.log(`[Game] Debug ${this.debugEnabled ? 'enabled' : 'disabled'}`);
    }

    _tick = () => {
        if (!this.isRunning) return;

        requestAnimationFrame(this._tick);

        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.frameCount++;
        this.fpsTime += delta;
        if (this.fpsTime >= 0.5) {
            this.currentFPS = Math.round(this.frameCount / this.fpsTime);
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        if (!this.isPaused) {
            const playerPos = this.playerController.player.position;
            this.playerController.update(delta);
            this.weaponManager.update(delta);
            this.projectileSystem.update(delta);
            this.vfxSystem.update(delta);
            this.worldEffectSystem.update(delta, this.debugEnabled);
            this.worldEffectSystem.updatePlayer(playerPos, this.playerController.statusEffects);

            // Level flow update
            this.levelFlow.update(delta, playerPos, this._composure, this.scoreSystem);
            this.hud.updateAnnouncement(delta);
            this.hud.updateHint(delta);

            // Process level flow transitions
            const transitions = this.levelFlow.popTransitions();
            for (const t of transitions) {
                this._handleTransition(t);
            }

            // Spawn pending enemies from level flow
            if (this.spawnDirector && this.levelFlow.isWaveActive()) {
                const pending = this.levelFlow.consumePendingSpawns();
                for (const spawn of pending) {
                    this._spawnWaveEnemy(spawn);
                }
            }

            // Composure drain during waves
            if (this.levelFlow.isWaveActive() && this._composure > 0) {
                const enemies = this.spawnDirector?.getEntities() || [];
                const aliveEnemies = enemies.filter(e => e.isAlive);
                if (aliveEnemies.length > 0) {
                    const drain = aliveEnemies.length * 0.5 * delta;
                    this._composure = Math.max(0, this._composure - drain);
                    this.hud.updateComposure(Math.round(this._composure));

                    if (this._composure <= 0 && !this.levelFlow.isTerminal()) {
                        this.levelFlow.triggerDefeat();
                        this.runStats.stopTimer();
                    }
                }
            }

            // Check terminal state
            if (this.levelFlow.isTerminal() && !this._resultShown) {
                this._resultShown = true;
                setTimeout(() => this._showResultScreen(), 1500);
            }

            this.spawnDirector?.update(delta);
            this.collisionSystem.update(delta, playerPos);

            const activeWeapon = this.weaponManager.getActiveWeapon();
            if (activeWeapon) {
                this.hud.updateWeapon(activeWeapon.name, activeWeapon.ammo);
            }
            this.hud.updateWeaponSlots(this.weaponManager.activeIndex);
            this.hud.updateStatusEffects(this.playerController.statusEffects);
            this.hud.updateObjective(this.levelFlow.getObjective());

            const enemies = this.spawnDirector?.getEntities() || [];
            for (const enemy of enemies) {
                if (enemy.updatePerception) {
                    enemy.updatePerception(delta, playerPos);
                }
                if (enemy.abilityContext !== this.abilityContext && enemy.setAbilityContext) {
                    enemy.setAbilityContext(this.abilityContext);
                }
                if (enemy.updateAbilities) {
                    enemy.updateAbilities(delta);
                }
                enemy.update(delta);
            }

            this.level?.update?.(delta, playerPos);
        }

        this.renderer.render(this.sceneManager.scene, this.renderer.camera);

        if (this.debugEnabled) {
            const info = this.renderer.renderer.info;
            const envStats = this.level?.getStats?.() || {};
            const flowDebug = this.levelFlow.getDebugInfo();
            this.hud.updateDebug({
                fps: this.currentFPS,
                frameTime: delta * 1000,
                projectiles: this.projectileSystem.getActiveCount(),
                pooled: this.projectileSystem.pool.length,
                enemies: this.spawnDirector?.getEntities()?.length || 0,
                pendingSpawns: this.spawnDirector?.getPendingCount() || 0,
                pendingRespawns: this.spawnDirector?.getRespawnCount() || 0,
                vfx: this.vfxSystem.getActiveCount(),
                worldEffects: this.worldEffectSystem.getActiveCount(),
                drawCalls: info.render.calls,
                triangles: info.render.triangles,
                textures: info.memory.textures,
                geometries: info.memory.geometries,
                vehicles: envStats.vehicleCount || 0,
                carts: envStats.cartCount || 0,
                trees: envStats.treeCount || 0,
                levelPhase: flowDebug.phase,
                levelPhaseTime: flowDebug.phaseTime,
                levelEnemiesAlive: flowDebug.enemiesAlive,
                composure: Math.round(this._composure),
                runTime: this.runStats.totalTime > 0 ? this.runStats.totalTime.toFixed(1) : this.runStats.runTime.toFixed(1),
            });
        }

        if (typeof window !== 'undefined') {
            window.__HTK_DEBUG__ = {
                game: this,
                rendererInfo: () => this.renderer.renderer.info,
                enemies: () => this.spawnDirector?.getEntities() || [],
                environmentStats: () => this.level?.getStats?.() || {},
                levelFlow: () => this.levelFlow.getDebugInfo(),
                composure: this._composure,
                runStats: this.runStats,
            };
        }
    };

    _handleTransition(t) {
        switch (t.type) {
            case 'phase_announcement':
                this.hud.showAnnouncement(t.incident, t.subtitle, 3000);
                this.hud.updateObjective(t.objective);
                break;
            case 'weapon_unlock':
                this._unlockWeapon(t.type, t.text, t.weaponName, t.key);
                break;
            case 'wave_complete_bonus':
                this.scoreSystem.registerHit(t.amount);
                this.hud.showAnnouncement('INCIDENT RESOLVED', `+${t.amount}`, 2000);
                this.runStats.incidentsResolved++;
                break;
            case 'incident_resolved':
                break;
            case 'breather_start':
                this.hud.updateObjective(t.objective);
                break;
            case 'victory':
                this.runStats.victory = true;
                break;
            case 'defeat':
                this.runStats.victory = false;
                this.runStats.composureLost = true;
                break;
            case 'composure_recovery':
                this._composure = Math.min(100, this._composure + t.amount);
                this.hud.updateComposure(Math.round(this._composure));
                this.hud.showHint(`YOU FOUND A QUIET PARKING SPACE — COMPOSURE +${t.amount}`, 3000);
                break;
            case 'enemy_spawn':
                break;
            case 'show_result':
                break;
        }
    }

    _unlockWeapon(type, announcementText, weaponName, key) {
        // Enable weapon slot
        const slotMap = { waterBalloon: 1, gardenGnome: 2 };
        const slot = slotMap[type];
        if (slot !== undefined) {
            this.weaponManager._weaponSlots[slot] = type;
        }

        this.hud.showAnnouncement(announcementText, weaponName, 3000);
        this.hud.showHint(`PRESS ${key} — ${weaponName.toUpperCase()}`, 4000);
    }

    _spawnWaveEnemy(spawn) {
        if (!this.spawnDirector) return;

        const karenType = spawn.type === 'manager' ? 'manager'
            : spawn.type === 'hoa' ? 'hoa'
            : 'retail_return';

        const position = new THREE.Vector3(spawn.position.x, 0, spawn.position.z);
        const config = this.levelFlow.getFinalConfig();
        const overrides = {};
        if (config.abilityCooldownMultiplier) {
            overrides.abilityCooldownMultiplier = config.abilityCooldownMultiplier;
        }
        if (config.movementSpeedMultiplier) {
            overrides.movementSpeedMultiplier = config.movementSpeedMultiplier;
        }

        const def = {
            karenType,
            position,
            patrolCenter: position,
            patrolRadius: spawn.patrolRadius || 3,
            orientation: 0,
            respawn: false,
            ...overrides,
        };

        this.spawnDirector.addSpawnDefinitions([def]);
        this.spawnDirector.spawnSingle(def, karenType, this._lastFactoryFn).then((enemy) => {
            if (enemy) {
                this.levelFlow.onEnemySpawned(enemy);
                this.collisionSystem.registerEnemy(enemy);
            }
        });
    }

    _onKeyDown(e) {
        if (e.key === CONSTANTS.DEBUG_KEY || e.key === 'F3') {
            this.toggleDebug();
        }
        if ((e.key === CONSTANTS.RESET_KEY || e.key === 'r' || e.key === 'R') && this.levelFlow.isTerminal()) {
            e.preventDefault();
            this.reset();
            return;
        }
        if (e.key === CONSTANTS.RESET_KEY || e.key === 'r') {
            this.reset();
        }

        // Debug shortcuts
        if (this.debugEnabled) {
            if (e.key === 'F6') {
                this._advancePhaseDebug();
            }
            if (e.key === 'F7') {
                this._refillComposureDebug();
            }
        }

        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= 3) {
            const unlocks = this.levelFlow.getWeaponUnlocks();
            const slotToType = { 1: 'croc', 2: 'waterBalloon', 3: 'gardenGnome' };
            const type = slotToType[digit];
            if (type && unlocks[type]) {
                this.weaponManager.handleDigitKey(digit);
                const activeWeapon = this.weaponManager.getActiveWeapon();
                if (activeWeapon) {
                    this.hud.updateWeapon(activeWeapon.name, activeWeapon.ammo);
                }
                this.hud.updateWeaponSlots(this.weaponManager.activeIndex);
            }
        }
    }

    _onPointerLockChange() {
        this.isPaused = document.pointerLockElement !== this.renderer.renderer.domElement;
        if (!this.isPaused) {
            this.hud.showHUD?.();
        } else {
            this.hud.showBlocker?.();
        }
    }

    _initAudioOnInteraction() {
        this.audioSystem.init();
    }
}
