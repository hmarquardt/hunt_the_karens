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
import { HUD } from '../ui/HUD.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { WEAPON_DEFS, STATUS_DEFS } from '../config/weapons.js';
import * as CONSTANTS from '../config/constants.js';

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
        this.hud = new HUD(this.scoreSystem);
        this.weaponManager = new WeaponManager(this.renderer.camera, this.inputManager);

        this._initAudioOnInteraction = this._initAudioOnInteraction.bind(this);

        this.playerController = null;
        this.weapon = null;
        this.level = null;

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

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        document.addEventListener('click', this._initAudioOnInteraction, { once: true });

        window.addEventListener('resize', () => this.renderer.onResize());

        console.log('[Game] Initialized successfully');
    }

    _setupWeapons() {
        const camera = this.renderer.camera;
        const inputManager = this.inputManager;
        const projectileSystem = this.projectileSystem;
        const vfxSystem = this.vfxSystem;
        const audioSystem = this.audioSystem;

        const crocWeapon = new CrocLauncher(
            camera,
            inputManager,
            projectileSystem,
            vfxSystem,
            audioSystem,
            WEAPON_DEFS.croc
        );
        const crocView = new FirstPersonWeaponView(camera, WEAPON_DEFS.croc);
        crocWeapon.setView(crocView);
        this.weaponManager.registerWeapon('croc', crocWeapon, crocView, 0);

        const waterBalloonWeapon = new WaterBalloonLauncher(
            camera,
            inputManager,
            projectileSystem,
            vfxSystem,
            audioSystem,
            WEAPON_DEFS.waterBalloon
        );
        const waterBalloonView = new FirstPersonWeaponView(camera, WEAPON_DEFS.waterBalloon);
        waterBalloonWeapon.setView(waterBalloonView);
        this.weaponManager.registerWeapon('waterBalloon', waterBalloonWeapon, waterBalloonView, 1);

        const gardenGnomeWeapon = new GardenGnomeLauncher(
            camera,
            inputManager,
            projectileSystem,
            vfxSystem,
            audioSystem,
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

        if (this.spawnDirector && factoryFn) {
            const spawnDefs = levelInstance.getSpawnDefinitions();
            this.spawnDirector.addSpawnDefinitions(spawnDefs);
            await this.spawnDirector.spawnAll(factoryFn);
        }

        this.level = levelInstance;
        this.hud.updateScore(0);
        this.hud.updateCombo(0);

        this.isPaused = false;
    }

    _onEnemyDefeated(enemy) {
        if (this.audioSystem) {
            this.audioSystem.playDefeat();
        }

        if (this.scoreSystem) {
            const result = this.scoreSystem.registerDefeat(enemy.scoreValue);
            if (this.hud) {
                this.hud.showHitFeedback(`+${result.earned} ${enemy.name} DEFEATED!`);
            }
        }

        if (this.spawnDirector) {
            this.spawnDirector.scheduleRespawn(enemy);
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
        this.loadLevel(this.level, this._lastFactoryFn).then(() => {
            this._resetInProgress = false;
        }).catch(() => {
            this._resetInProgress = false;
        });
    }

    setLastFactoryFn(fn) {
        this._lastFactoryFn = fn;
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
            this.spawnDirector?.update(delta);
            this.collisionSystem.update(delta, playerPos);

            const activeWeapon = this.weaponManager.getActiveWeapon();
            if (activeWeapon) {
                this.hud.updateWeapon(activeWeapon.name, activeWeapon.ammo);
            }
            this.hud.updateWeaponSlots(this.weaponManager.activeIndex);
            this.hud.updateStatusEffects(this.playerController.statusEffects.getActiveEffects());

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
            });
        }

        // Debug test hook
        if (typeof window !== 'undefined') {
            window.__HTK_DEBUG__ = {
                game: this,
                rendererInfo: () => this.renderer.renderer.info,
                enemies: () => this.spawnDirector?.getEntities() || [],
                environmentStats: () => this.level?.getStats?.() || {},
            };
        }
    };

    _onKeyDown(e) {
        if (e.key === CONSTANTS.DEBUG_KEY || e.key === 'F3') {
            this.toggleDebug();
        }
        if (e.key === CONSTANTS.RESET_KEY || e.key === 'r') {
            this.reset();
        }

        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= 3) {
            this.weaponManager.handleDigitKey(digit);
            const activeWeapon = this.weaponManager.getActiveWeapon();
            if (activeWeapon) {
                this.hud.updateWeapon(activeWeapon.name, activeWeapon.ammo);
            }
            this.hud.updateWeaponSlots(this.weaponManager.activeIndex);
        }
    }

    _onPointerLockChange() {
        this.isPaused = document.pointerLockElement !== this.renderer.renderer.domElement;
        if (!this.isPaused) {
            this.hud.showHUD();
        } else {
            this.hud.showBlocker();
        }
    }

    _initAudioOnInteraction() {
        this.audioSystem.init();
    }
}
