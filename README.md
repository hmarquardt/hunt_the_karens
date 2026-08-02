# Hunt the Karens

A hyper-realistic but deliberately absurd browser-based first-person action game built with Three.js.

Throw Crocs at increasingly ridiculous Karen archetypes in realistic suburban environments. No one gets hurt. Everyone gets mad.

## How to Run

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000** in a modern browser.

No npm. No build step. No Node runtime. Just static files.

## Requirements

- Modern browser with ES module support (Chrome 91+, Firefox 89+, Safari 15+)
- Local HTTP server (no `file://` protocol)
- Desktop recommended

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look |
| Left Click | Throw Croc |
| R | Reset scene |
| F3 | Toggle debug overlay |

## Repository Structure

```
index.html                  Entry point
css/
    game.css                HUD and UI styles

src/
    main.js                 Bootstrap only (no monkey-patching)
    core/
        Game.js             Authoritative lifecycle + game loop
        Renderer.js         Three.js renderer setup
        SceneManager.js     Scene and object management
        InputManager.js     Keyboard and mouse input
        AssetManager.js     Texture/model/audio/character loading
    player/
        Player.js           Player entity data
        FPSController.js    First-person camera + movement
    weapons/
        Weapon.js           Base weapon class
        ProjectileWeapon.js Projectile weapon base
        CrocLauncher.js     Croc launcher implementation
    entities/
        NPC.js              Base NPC class
        Karen.js            Karen enemy base (component orchestration)
        components/
            DialogueController.js  Canvas dialogue bubble
            KarenPerception.js     Detection FOV, awareness, distance
    karens/
        ManagerKaren.js     Manager Karen archetype
        HOAKaren.js         HOA President Karen archetype
    animation/
        AnimationController.js  AnimationMixer wrapper with crossfading
        CharacterAsset.js       GLTF character loader + SkeletonUtils clone
        KarenStateMachine.js    9-state explicit state machine
    systems/
        ProjectileSystem.js Projectile physics, pooling, swept collision
        CollisionSystem.js  Hit detection only (no respawn policy)
        ScoreSystem.js      Score and combo tracking
        AudioSystem.js      Procedural audio via Web Audio API
        VFXSystem.js        Impact particles, rings, floating score text
        SpawnDirector.js    Enemy lifecycle ownership (spawn + respawn)
    levels/
        Level.js            Base level class
        TestLevel.js        Suburban retail environment
    ui/
        HUD.js              Heads-up display controller
    config/
        constants.js        Global game constants
        karenTypes.js       Karen archetype definitions (data-driven)
        weapons.js          Weapon definitions

vendor/
    three/                  Vendored Three.js r164 + addons
    VERSIONS.md             Dependency + asset manifest

assets/
    models/
        RobotExpressive.glb  Temporary character model (MIT)
    textures/               (reserved)
    audio/                  (reserved)
    environments/           (reserved)

docs/
    architecture.md         System architecture documentation
    asset-pipeline.md       Asset creation and import guide
```

## Vendored Dependencies

| Library | Version | Source |
|---------|---------|--------|
| Three.js | 0.164.0 | https://github.com/mrdoob/three.js |
| GLTFLoader | 0.164.0 | Three.js examples |
| DRACOLoader | 0.164.0 | Three.js examples |
| PointerLockControls | 0.164.0 | Three.js examples |
| EffectComposer | 0.164.0 | Three.js examples |
| RenderPass | 0.164.0 | Three.js examples |
| UnrealBloomPass | 0.164.0 | Three.js examples |
| OutputPass | 0.164.0 | Three.js examples |
| Pass | 0.164.0 | Three.js examples |
| ShaderPass | 0.164.0 | Three.js examples |
| CopyShader | 0.164.0 | Three.js examples |
| LuminosityHighPassShader | 0.164.0 | Three.js examples |
| SkeletonUtils | 0.164.0 | Three.js examples |

All dependencies are downloaded from jsdelivr CDN and vendored locally. See `vendor/VERSIONS.md` for full details.

### Character Asset

| Model | License | Purpose |
|-------|---------|---------|
| RobotExpressive.glb | MIT (Three.js examples) | Temporary animated character with 13 animation clips |

## Current Milestone

**Stabilized Vertical Slice** - Milestone 2.1

- Animated GLTF character (RobotExpressive) with skeletal animation
- AnimationMixer with crossfading between states (Idle, Walking, Punch, Death, ThumbsUp)
- Multiple independent character instances via SkeletonUtils.clone()
- Manager Karen with state-driven behavior: patrol, detect, confront, react, special ability
- HOA President Karen with distinct patrol patterns and behavior
- Perception system (range, FOV cone, awareness level)
- Explicit state machine: IDLE, PATROL, ALERT, CONFRONT, REACT, SPECIAL, STUNNED, DEFEATED, RESPAWNING
- Impact VFX: particle burst, expanding ring, floating score text
- Swept collision detection (segment-based tunneling protection)
- Projectile pooling with proper position initialization
- Enhanced suburban retail environment (curbs, sidewalks, parked cars, cart corral, signage, MEGA MART storefront)
- Configuration-driven spawn system
- Debug overlay with FPS, frame time, draw calls, triangles, textures, geometries
- Clean scene reset with timer/leak cleanup
- Data-driven dialogue and Karen configuration

## Architectural Decisions

- **No npm, no bundler**: ES modules loaded natively via `<script type="module">` and import maps
- **Custom physics**: Lightweight custom ballistic physics for projectiles; no physics engine dependency
- **Object pooling**: Both projectiles and VFX are pooled to avoid GC pressure
- **Data-driven design**: Karen types and weapons defined in config files, not hard-coded
- **Clean separation**: Appearance (GLTF asset) separated from behavior (state machine + perception)
- **SkeletonUtils**: Used for safe cloning of skinned meshes for multiple independent instances
- **Swept collision**: Segment-based detection prevents tunneling at high projectile velocities

## Known Limitations

- Character model is a robot, not a Karen (temporary placeholder)
- Accessories are still procedural meshes on the robot (not boned to skeleton)
- No custom Karen GLTF model yet; see `docs/asset-pipeline.md` for replacement guide
- No animation blending beyond crossfading
- No enemy AI pathfinding (simple direct approach)
- Single test level only
- No sound files; all audio is procedurally generated
- No weapon switching or multi-weapon support
- Special abilities are cosmetic only (animation trigger)
- No ragdoll physics; defeated Karens play death animation and hide
- Import map uses relative paths; requires server at repo root

## Next Steps

1. **Custom Karen GLTF models** - Replace the RobotExpressive placeholder with purpose-built Karen character models with appropriate clothing, hair, and accessories
2. **Implement actual special abilities** - Manager Karen's "Call the Manager" should apply a gameplay effect (slowdown, HUD obstruction, etc.); HOA Karen's "Violation Notice" should create environmental gameplay modifiers
3. **Animation blending and layers** - Add upper-body animation layer for gestures/dialogue while walking, and additive animation for hit reactions
