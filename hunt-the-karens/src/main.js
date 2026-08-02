import { Game } from './core/Game.js';
import { TestLevel } from './levels/TestLevel.js';
import { SpawnDirector } from './systems/SpawnDirector.js';
import { ManagerKaren } from './karens/ManagerKaren.js';
import { HOAKaren } from './karens/HOAKaren.js';

const KAREN_FACTORIES = {
    manager: ManagerKaren,
    hoa: HOAKaren,
};

const game = new Game();

async function main() {
    console.log('[Main] Starting Hunt the Karens...');

    await game.assetManager.loadCharacterAsset('robot', './assets/models/RobotExpressive.glb');

    await game.init();

    const level = new TestLevel(game.assetManager);
    await level.build(game.sceneManager);

    game.playerController.reset(level.spawnPoint);

    const characterAssets = new Map();
    characterAssets.set('robot', game.assetManager.getCharacterAsset('robot'));

    const spawnDirector = new SpawnDirector(
        game.sceneManager,
        game.collisionSystem,
        characterAssets
    );

    const spawnDefs = level.getSpawnDefinitions();
    spawnDirector.addSpawnDefinitions(spawnDefs);

    await spawnDirector.spawnAll((config) => {
        const factory = KAREN_FACTORIES[config.karenType || 'manager'] || ManagerKaren;
        const karen = new factory(config);
        karen.setPlayerRef(game.playerController.player);
        karen.characterAssetName = 'robot';
        return karen;
    });

    game.loadLevel = function(levelInstance) {
        this.level = levelInstance;
        this.sceneManager.clear();
        this.projectileSystem.clear();
        this.vfxSystem.clear();
        this.collisionSystem.clear();
        this.scoreSystem.reset();

        levelInstance.build(this.sceneManager);
        this.playerController.reset(levelInstance.spawnPoint);

        spawnDirector.clear();
        spawnDirector.addSpawnDefinitions(levelInstance.getSpawnDefinitions());
        spawnDirector.spawnAll((config) => {
            const factory = KAREN_FACTORIES[config.karenType || 'manager'] || ManagerKaren;
            const karen = new factory(config);
            karen.setPlayerRef(this.playerController.player);
            karen.characterAssetName = 'robot';
            return karen;
        });

        this.hud.updateScore(0);
        this.hud.updateCombo(0);
    };

    game.level = level;

    game._tick = (() => {
        const originalTick = game._tick;
        return () => {
            if (!game.isRunning) return;

            requestAnimationFrame(game._tick);

            const delta = Math.min(game.clock.getDelta(), 0.1);
            game.frameCount++;
            game.fpsTime += delta;
            if (game.fpsTime >= 0.5) {
                game.currentFPS = Math.round(game.frameCount / game.fpsTime);
                game.frameCount = 0;
                game.fpsTime = 0;
            }

            if (!game.isPaused) {
                const playerPos = game.playerController.player.position;
                game.playerController.update(delta);
                game.weapon.update(delta);
                game.projectileSystem.update(delta);
                game.vfxSystem.update(delta);
                spawnDirector.update(delta);
                game.collisionSystem.update(delta, playerPos);

                const enemies = spawnDirector.getEntities();
                for (const enemy of enemies) {
                    if (enemy.updatePerception) {
                        enemy.updatePerception(delta, playerPos.clone());
                    }
                    enemy.update(delta);
                }
            }

            game.renderer.render(game.sceneManager.scene, game.renderer.camera);

            if (game.debugEnabled) {
                game.hud.updateDebug({
                    fps: game.currentFPS,
                    projectiles: game.projectileSystem.getActiveCount(),
                    enemies: spawnDirector.getEntities().length,
                    vfx: game.vfxSystem.getActiveCount(),
                });
            }
        };
    })();

    game.start();

    console.log('[Main] Game running. Click to capture pointer and begin.');
}

main().catch((err) => {
    console.error('[Main] Failed to start:', err);
    document.body.innerHTML = `
        <div style="color: #ff6b6b; padding: 40px; font-family: monospace;">
            <h1>Failed to start</h1>
            <pre>${err.message}\n${err.stack}</pre>
            <p>Make sure you are serving this with ES module support.</p>
            <p>Run: python3 -m http.server 8000</p>
        </div>
    `;
});
