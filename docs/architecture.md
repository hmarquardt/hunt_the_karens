# Architecture

## Overview

Hunt the Karens is a browser-based first-person action game built with Three.js and vanilla ES modules. The architecture is modular with clear responsibility boundaries between subsystems.

## System Diagram

```
main.js (bootstrap only)
   |
   v
 Game (authoritative lifecycle)
   |
   +-- Renderer
   +-- SceneManager
   +-- InputManager
   +-- AssetManager
   +-- AudioSystem
   +-- FPSController
   |      +-- Player
   +-- CrocLauncher
   |      +-- ProjectileWeapon
   |      +-- Weapon
   +-- ProjectileSystem
   +-- CollisionSystem
   +-- VFXSystem
   +-- ScoreSystem
   +-- SpawnDirector
   |      +-- SpawnDefinition
   |      +-- Karen registry/factory
   |      +-- respawn policy
   +-- HUD
   +-- Level
          +-- TestLevel
```

## Entity Behavior

```
Karen
   |
   +-- KarenStateMachine (IDLE/PATROL/ALERT/CONFRONT/REACT/SPECIAL/DEFEATED/RESPAWNING)
   +-- KarenPerception (detection range, FOV cone, awareness)
   +-- DialogueController (CanvasTexture bubble, timing, visibility)
   +-- AnimationController (AnimationMixer, crossfading)
```

## Core Modules

### Game (`src/core/Game.js`)

Authoritative orchestrator. Owns the update loop, lifecycle, and system wiring.

**Responsibilities:**
- Subsystem initialization
- Async level loading (`await game.loadLevel(level, factoryFn)`)
- Single authoritative game loop
- Enemy defeat event routing to SpawnDirector for respawn
- Debug toggle
- Reset (reloads current level with stored factory)

**Does NOT:**
- Spawn enemies directly (delegates to SpawnDirector)
- Define level content (delegates to Level)
- Monkey-patch any methods at runtime

### Renderer (`src/core/Renderer.js`)

Three.js renderer, camera, and scene configuration.

**Responsibilities:**
- WebGL setup with ACES tone mapping, sRGB, PCF soft shadows
- Fog and background color
- Window resize handling
- Scene created in constructor (not in init)

### SceneManager (`src/core/SceneManager.js`)

Manages the Three.js scene graph.

**Responsibilities:**
- Adding/removing meshes
- Tracking collidable objects
- Enemy registration/unregistration (scene graph only)
- Scene clearing

### SpawnDirector (`src/systems/SpawnDirector.js`)

Owns enemy lifecycle: creation, respawn, and collection.

**Responsibilities:**
- Parse SpawnDefinition objects
- Factory function invocation (normal function call, not `new`)
- Character asset attachment
- SpawnDefinition.toKarenConfig() preserves archetype data
- Respawn scheduling based on SpawnDefinition.respawnEnabled/respawnDelay
- Delayed spawns
- Entity collection (authoritative)
- Clear: cancels respawn timers, unregisters from all systems

### CollisionSystem (`src/systems/CollisionSystem.js`)

Hit detection and collision events only. Does NOT own respawn policy.

**Responsibilities:**
- Projectile-enemy collision detection (instantaneous + swept)
- Swept sphere-cylinder using actual projectile radius
- Hit cooldown to prevent double-hits
- Emit defeat event via `_onEnemyDefeated` callback
- No respawn scheduling (delegates to SpawnDirector)
- VFX trigger, audio trigger, HUD feedback
- Clear: resets hit cooldowns and enemy list only

### ProjectileSystem (`src/systems/ProjectileSystem.js`)

Projectile physics and pooling.

**Responsibilities:**
- Object pooling
- Ballistic physics (gravity, drag, bounce)
- Projectile rotation
- Position initialization on spawn
- Previous position tracking for swept collision
- getCollisionSegment() returns {start, end} for sweep testing

### VFXSystem (`src/systems/VFXSystem.js`)

Impact effects with pooling.

**Responsibilities:**
- Particle burst (8 particles, gravity)
- Expanding impact ring
- Floating score text
- Object pooling

### Animation System

#### CharacterAsset (`src/animation/CharacterAsset.js`)

GLTF loading and safe cloning.

#### AnimationController (`src/animation/AnimationController.js`)

AnimationMixer wrapper with crossfading.

#### KarenStateMachine (`src/animation/KarenStateMachine.js`)

9 explicit states with transition callbacks.

### Karen Components

#### DialogueController (`src/entities/components/DialogueController.js`)

Owns the CanvasTexture dialogue bubble.

**Responsibilities:**
- Canvas rendering (text, rounded rect background)
- Visibility control
- Auto-hide timer
- Position updates (character mesh or fallback position)
- Bubble attachment to Karen mesh group

#### KarenPerception (`src/entities/components/KarenPerception.js`)

Owns detection mathematics.

**Responsibilities:**
- FOV cone test (dot product with forward vector)
- Distance checks
- Awareness level (0→1 ramp/decay)
- Last known player position
- Decision helpers: shouldConfront(), shouldAlert(), shouldDisengage()
- Scratch vector reuse to avoid allocations

### Karen Base (`src/entities/Karen.js`)

Behavioral orchestration using components.

**Responsibilities:**
- State machine transitions
- Animation state mapping
- Patrol/confrontation movement
- Component coordination (perception, dialogue, animation)
- Component ownership (DialogueController, KarenPerception)

### Karen Subclasses

- `ManagerKaren` - Manager archetype with phone/clipboard accessories
- `HOAKaren` - HOA President archetype with clipboard/tape measure/sun visor

Both override `attachCharacterAsset` to add accessories after GLTF attachment.

## Level Lifecycle

```
await game.loadLevel(level, factoryFn)
   |
   1. isPaused = true
   2. spawnDirector.clear()       (cancel respawns, remove entities)
   3. collisionSystem.clear()     (clear hit cooldowns)
   4. projectileSystem.clear()    (remove active projectiles)
   5. vfxSystem.clear()           (remove active effects)
   6. scoreSystem.reset()         (reset score/combo)
   7. sceneManager.clear()        (remove all scene objects)
   8. await level.build()         (construct environment)
   9. playerController.reset()    (set spawn position)
  10. spawnDirector.addSpawnDefinitions()
  11. await spawnDirector.spawnAll(factoryFn)
  12. isPaused = false
```

## Enemy Lifecycle

```
SpawnDirector.spawnAll(factoryFn)
   |
   +-- factoryFn(karenConfig)         (KarenFactory creates Karen)
   +-- attachCharacterAsset()         (GLTF instance + animations)
   +-- sceneManager.registerEnemy()   (add to scene)
   +-- collisionSystem.registerEnemy() (add to collision list)
   +-- spawnedEntities.push()         (track in SpawnDirector)
   |
   +-- Game loop: perception + state machine + animation
   |
   +-- CollisionSystem detects hit
       |
       +-- enemy.takeDamage()
       +-- if (wasAlive && !enemy.isAlive):
           |
           +-- Game._onEnemyDefeated()
               +-- audio, score, HUD
               +-- spawnDirector.scheduleRespawn(enemy)
                   |
                   +-- SpawnDirector tracks respawn timer
                   +-- When timer expires:
                       +-- restore health, state, position
                       +-- show mesh
```

## SpawnDefinition

Data object for configuration-driven spawning:

| Field | Purpose |
|-------|---------|
| karenType | Archetype identifier (maps to registry) |
| position | Spawn position |
| orientation | Initial rotation |
| patrolCenter | Patrol route center |
| patrolRadius | Patrol route radius |
| spawnDelay | Delayed spawn (ms) |
| respawnEnabled | Whether to respawn on defeat |
| respawnDelay | Respawn delay (ms) |
| enabled | Whether to spawn at all |

`toKarenConfig()` produces the minimal config needed to instantiate a Karen.

## Debug Instrumentation (F3)

| Metric | Source |
|--------|--------|
| FPS | Game frame counter |
| Frame time | Delta time * 1000 |
| Projectiles | ProjectileSystem.getActiveCount() |
| Pooled | ProjectileSystem.pool.length |
| Enemies | SpawnDirector.getEntities().length |
| Pending spawns | SpawnDirector.getPendingCount() |
| Pending respawns | SpawnDirector.getRespawnCount() |
| VFX | VFXSystem.getActiveCount() |
| Draw calls | renderer.info.render.calls |
| Triangles | renderer.info.render.triangles |
| Textures | renderer.info.memory.textures |
| Geometries | renderer.info.memory.geometries |

## Runtime Assertions

- Warn on duplicate enemy registration (CollisionSystem)
- Warn on unknown Karen type (SpawnDirector)
- Warn on null factory return (SpawnDirector)
