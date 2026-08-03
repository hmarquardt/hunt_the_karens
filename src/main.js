import { Game } from './core/Game.js';
import { TestLevel } from './levels/TestLevel.js';
import { ManagerKaren } from './karens/ManagerKaren.js';
import { HOAKaren } from './karens/HOAKaren.js';
import { RetailReturnKaren } from './entities/RetailReturnKaren.js';

const KAREN_REGISTRY = {
    manager: (config) => {
        const karen = new ManagerKaren(config);
        karen.setPlayerRef(game.playerController.player);
        karen.onImpact = (proj) => {
            game.playerController.applyHitFeedback(proj?.weaponType || 'croc');
        };
        return karen;
    },
    hoa: (config) => {
        const karen = new HOAKaren(config);
        karen.setPlayerRef(game.playerController.player);
        karen.onImpact = (proj) => {
            game.playerController.applyHitFeedback(proj?.weaponType || 'croc');
        };
        return karen;
    },
    retail_return: (config) => {
        const karenConfig = {
            ...config,
            karenType: 'retail_return',
            name: 'Retail Return Karen',
            scoreValue: 150,
        };
        const karen = new RetailReturnKaren(karenConfig);
        karen.setPlayerRef(game.playerController.player);
        karen.onImpact = (proj) => {
            game.playerController.applyHitFeedback(proj?.weaponType || 'croc');
        };
        return karen;
    },
};

const game = new Game();

function createKarenFactory(config) {
    const factory = KAREN_REGISTRY[config.karenType] || KAREN_REGISTRY.manager;
    return factory(config);
}

async function main() {
    console.log('[Main] Starting Hunt the Karens...');

    await game.init(KAREN_REGISTRY);

    const level = new TestLevel(game.assetManager);

    await game.loadLevel(level, createKarenFactory);

    game.setLastFactoryFn(createKarenFactory);

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
