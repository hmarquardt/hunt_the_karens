import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { AssetManager } from './AssetManager.js';
import { FPSController } from '../player/FPSController.js';
import { CrocLauncher } from '../weapons/CrocLauncher.js';
import { ProjectileSystem } from '../systems/ProjectileSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { VFXSystem } from '../systems/VFXSystem.js';
import { HUD } from '../ui/HUD.js';
import { AudioSystem } from '../systems/AudioSystem.js';
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
        this.hud = new HUD(this.scoreSystem);

        this._initAudioOnInteraction = this._initAudioOnInteraction.bind(this);

        this.playerController = null;
        this.weapon = null;
        this.level = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
    }

    async init() {
        await this.assetManager.loadAll();

        this.renderer.init();
        this.inputManager.init();

        this.playerController = new FPSController(
            this.renderer.camera,
            this.inputManager,
            this.sceneManager
        );
        this.playerController.init();

        this.weapon = new CrocLauncher(
            this.renderer.camera,
            this.inputManager,
            this.projectileSystem,
            this.audioSystem
        );
        this.weapon.init();

        this.collisionSystem.setProjectileSystem(this.projectileSystem);
        this.collisionSystem.setScoreSystem(this.scoreSystem);
        this.collisionSystem.setHUD(this.hud);
        this.collisionSystem.setAudioSystem(this.audioSystem);
        this.collisionSystem.setVFXSystem(this.vfxSystem);

        this.scoreSystem.setHUD(this.hud);

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        document.addEventListener('click', this._initAudioOnInteraction, { once: true });

        window.addEventListener('resize', () => this.renderer.onResize());

        console.log('[Game] Initialized successfully');
    }

    loadLevel(levelInstance) {
        this.level = levelInstance;
        this.sceneManager.clear();
        this.projectileSystem.clear();
        this.vfxSystem.clear();
        this.collisionSystem.clear();
        this.scoreSystem.reset();

        levelInstance.build(this.sceneManager);
        this.playerController.reset(levelInstance.spawnPoint);

        const enemies = levelInstance.getEnemies();
        for (const enemy of enemies) {
            this.collisionSystem.registerEnemy(enemy);
        }

        this.hud.updateScore(0);
        this.hud.updateCombo(0);
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
        if (this.level) {
            this.loadLevel(this.level);
        }
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
            this.weapon.update(delta);
            this.projectileSystem.update(delta);
            this.vfxSystem.update(delta);
            this.collisionSystem.update(delta, playerPos);

            const enemies = this.sceneManager.getEnemies();
            for (const enemy of enemies) {
                if (enemy.updatePerception) {
                    enemy.updatePerception(delta, playerPos.clone());
                }
                enemy.update(delta);
            }
        }

        this.renderer.render(this.sceneManager.scene, this.renderer.camera);

        if (this.debugEnabled) {
            const info = this.renderer.renderer.info;
            this.hud.updateDebug({
                fps: this.currentFPS,
                frameTime: delta * 1000,
                projectiles: this.projectileSystem.getActiveCount(),
                pooled: this.projectileSystem.pool.length,
                enemies: this.collisionSystem.getEnemyCount(),
                vfx: this.vfxSystem.getActiveCount(),
                drawCalls: info.render.calls,
                triangles: info.render.triangles,
                textures: info.memory.textures,
                geometries: info.memory.geometries,
            });
        }
    };

    _onKeyDown(e) {
        if (e.key === CONSTANTS.DEBUG_KEY || e.key === 'F3') {
            this.toggleDebug();
        }
        if (e.key === CONSTANTS.RESET_KEY || e.key === 'R') {
            this.reset();
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
