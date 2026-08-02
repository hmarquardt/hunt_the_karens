# Architecture

## Overview

Hunt the Karens is a browser-based first-person action game built with Three.js and vanilla ES modules. The architecture is modular with clear responsibility boundaries between subsystems.

## System Diagram

```
main.js (bootstrap + spawn orchestration)
  │
  └── Game.js
        ├── Renderer.js          (Three.js setup, render loop, tone mapping)
        ├── SceneManager.js      (scene graph, object tracking)
        ├── InputManager.js      (keyboard, mouse, pointer lock)
        ├── AssetManager.js      (textures, models, character assets, audio)
        ├── AudioSystem.js       (procedural Web Audio API)
        ├── FPSController        (player movement, camera, speed modifier)
        │     ├── Player.js
        │     └── PointerLockControls
        ├── CrocLauncher         (weapon, fire input)
        │     ├── ProjectileWeapon
        │     └── Weapon
        ├── ProjectileSystem     (projectile physics, pooling, swept collision)
        ├── CollisionSystem      (hit detection, swept sphere-cylinder, VFX trigger)
        ├── VFXSystem            (impact particles, rings, floating score)
        ├── ScoreSystem          (score, combos)
        ├── HUD                  (UI overlay, debug stats)
        ├── SpawnDirector        (configuration-driven spawning)
        │     └── SpawnDefinition
        └── TestLevel            (environment, spawn definitions)
              ├── Level
              ├── ManagerKaren ──┐
              └── HOAKaren ──────┤
                                 ├── Karen (base)
                                 │     ├── NPC
                                 │     ├── KarenStateMachine
                                 │     └── AnimationController
                                 └── CharacterAsset (GLTF loader + SkeletonUtils)
```

## Core Modules

### Game (`src/core/Game.js`)

The central orchestrator. Initializes all subsystems, runs the game loop, and handles global state.

**Responsibilities:**
- Subsystem initialization order
- Game loop with delta time
- Level loading and reset
- Debug toggle
- Input routing for global keys
- Per-frame enemy update (perception + state machine + animation)

**Does NOT:**
- Handle rendering directly (delegates to Renderer)
- Manage scene objects directly (delegates to SceneManager)
- Spawn enemies directly (delegates to SpawnDirector)

### Renderer (`src/core/Renderer.js`)

Wraps Three.js renderer, camera, and scene configuration.

**Responsibilities:**
- WebGL renderer creation and configuration
- ACES filmic tone mapping
- sRGB color space output
- PCF soft shadow maps
- Fog and background color
- Window resize handling
- Scene created in constructor (fixes null reference defect from MVP)

### SceneManager (`src/core/SceneManager.js`)

Manages the Three.js scene graph and tracks object categories.

**Responsibilities:**
- Adding/removing meshes from scene
- Tracking collidable objects
- Tracking active enemies
- Tracking active projectiles
- Scene clearing

### InputManager (`src/core/InputManager.js`)

Centralized input handling for keyboard and mouse.

**Responsibilities:**
- Key state tracking
- Mouse movement accumulation
- Mouse click detection
- Consumable input (movement/clicks consumed once per frame)

### AssetManager (`src/core/AssetManager.js`)

Handles loading of textures, GLTF models, character assets, and audio files.

**Responsibilities:**
- Parallel asset loading
- Texture caching
- GLTF model loading via GLTFLoader
- Character asset loading (GLTF + animation extraction)
- Audio buffer loading

## Player System

### Player (`src/player/Player.js`)

Pure data object representing player state.

**Responsibilities:**
- Position and velocity tracking
- Collider bounds calculation
- Ground state tracking

### FPSController (`src/player/FPSController.js`)

First-person camera controller with WASD movement.

**Responsibilities:**
- Pointer lock integration (uses PointerLockControls.isLocked, no duplicate listeners)
- Mouse-look rotation
- WASD movement relative to camera direction
- Simple gravity and ground detection
- AABB collision resolution against environment
- Speed multiplier support (for slowdown effects)

## Weapon System

### Weapon (`src/weapons/Weapon.js`)

Abstract base class for all weapons.

**Responsibilities:**
- Cooldown tracking
- Fire permission checking

### ProjectileWeapon (`src/weapons/ProjectileWeapon.js`)

Base class for weapons that launch physical projectiles.

**Responsibilities:**
- Aim direction calculation from camera
- Weapon spread application
- Projectile spawning via ProjectileSystem
- Audio trigger on fire

### CrocLauncher (`src/weapons/CrocLauncher.js`)

Concrete implementation of the Croc weapon.

**Responsibilities:**
- Mouse click input consumption
- Croc-specific configuration from weapons.js

## Animation System

### CharacterAsset (`src/animation/CharacterAsset.js`)

Handles loading, caching, and cloning of GLTF character models.

**Responsibilities:**
- GLTF loading via GLTFLoader
- Animation clip extraction and naming
- Safe instance cloning via SkeletonUtils.clone()
- Bounding box calculation for collider dimensions
- Multiple instances animate independently

### AnimationController (`src/animation/AnimationController.js`)

Wraps THREE.AnimationMixer for state-based animation management.

**Responsibilities:**
- Animation clip to action mapping
- Crossfading between animations
- Playback control (play, stop, timeScale, loop mode)
- Current animation tracking

### KarenStateMachine (`src/animation/KarenStateMachine.js`)

Explicit state machine for Karen behavior.

**States:**
| State | Description | Animation |
|-------|-------------|-----------|
| `IDLE` | Standing still, looking around | Idle |
| `PATROL` | Walking patrol route | Walking |
| `ALERT` | Noticed player, watching | Idle |
| `CONFRONT` | Approaching player | Walking (0.8x) |
| `REACT` | Just hit, flinching | Punch |
| `SPECIAL` | Using special ability | ThumbsUp |
| `STUNNED` | Temporarily disabled | Death (0.5x) |
| `DEFEATED` | Downed, awaiting respawn | Death |
| `RESPAWNING` | Re-materializing | None |

**Transitions:** Triggered by perception checks, damage, timers, and ability cooldowns.

## Projectile System

### ProjectileSystem (`src/systems/ProjectileSystem.js`)

Manages all active projectiles with object pooling.

**Responsibilities:**
- Projectile object pooling
- Ballistic physics (gravity, drag, bounce)
- Projectile rotation during flight
- Lifetime management
- Position initialization on spawn (fixes MVP defect)
- Previous position tracking for swept collision
- Debug trajectory visualization

**Physics model:**
```
velocity += gravity * delta
velocity *= (1 - drag * delta * 60)
position += velocity * delta
```

Bounces are limited (max 3) with decreasing energy. Projectiles deactivate when velocity drops below threshold.

## Collision System

### CollisionSystem (`src/systems/CollisionSystem.js`)

Handles projectile-enemy collision detection and response.

**Responsibilities:**
- Per-frame collision checks between active projectiles and living enemies
- Instantaneous sphere-cylinder intersection test
- **Swept collision**: Segment-based detection between previous and current projectile positions
- Hit cooldown to prevent double-hits
- Damage delegation to enemy
- VFX trigger on impact
- Score registration
- Audio trigger on hit
- Hit feedback via HUD
- Enemy respawn timer with cleanup tracking
- Full clear() for scene reset (cancels timers, removes references)

**Swept collision algorithm:**
1. Get projectile movement segment (previous position → current position)
2. Find closest point on segment to enemy center (horizontal plane)
3. Check if closest point is within combined radius
4. Check vertical overlap between segment bounds and enemy cylinder height

## VFX System

### VFXSystem (`src/systems/VFXSystem.js`)

Manages visual impact effects with object pooling.

**Responsibilities:**
- Particle burst (8 particles, randomized directions, gravity)
- Expanding impact ring
- Floating score text (+N canvas texture)
- Object pooling for effect reuse
- Automatic cleanup on lifetime expiry

## Entity System

### NPC (`src/entities/NPC.js`)

Base class for all non-player characters.

**Responsibilities:**
- Unique ID (uid) for collision tracking
- Mesh construction (placeholder)
- Health tracking
- Damage processing
- Collider bounds

### Karen (`src/entities/Karen.js`)

Base class for Karen enemies, extending NPC.

**Responsibilities:**
- State machine management
- Animation controller integration
- Perception system (range, FOV cone, awareness)
- Confrontation behavior (approach, maintain distance)
- Special ability triggering
- Dialogue system with canvas-based speech bubbles
- GLTF character asset attachment
- Placeholder mesh fallback
- Hit stun and defeat state management
- Defeat handling with respawn callback

**Perception model:**
```
detection: player within detectionRange AND within detectionAngle cone
awareness: 0→1 over time while detected, decays when not detected
alert: awareness > threshold, triggers state transition
confront: player within aggressionRange, approach to confrontationDistance
```

**States flow:**
```
PATROL → (detects player) → ALERT → (player close enough) → CONFRONT
CONFRONT → (player escapes) → PATROL
CONFRONT → (special ability cooldown) → SPECIAL → (ability done) → CONFRONT/PATROL
Any → (hit) → REACT → (recovery timer) → ALERT/CONFRONT
Any → (health <= 0) → DEFEATED → (respawn timer) → RESPAWNING → PATROL
```

### ManagerKaren (`src/karens/ManagerKaren.js`)

Concrete Karen archetype.

**Responsibilities:**
- Manager-specific accessories (phone, clipboard, paper)
- Type-specific dialogue pool
- Special ability: CALL THE MANAGER (triggers ThumbsUp animation)
- Inherited perception and confrontation behavior

### HOAKaren (`src/karens/HOAKaren.js`)

Concrete Karen archetype.

**Responsibilities:**
- HOA-specific accessories (clipboard, tape measure, sun visor)
- Distinct dialogue pool (regulation violations, bylaws)
- Special ability: VIOLATION NOTICE (triggers ThumbsUp animation)
- Larger detection range, slower speed, higher score value
- Different confrontation distance (stands further back)

## Spawn System

### SpawnDirector (`src/systems/SpawnDirector.js`)

Configuration-driven enemy spawning.

**Responsibilities:**
- Parse SpawnDefinition objects
- Instantiate Karen entities via factory function
- Attach character assets
- Delayed spawning
- Entity tracking and cleanup
- Integration with SceneManager and CollisionSystem

### SpawnDefinition

Data object defining a spawn:
- karenType
- position, orientation
- patrolCenter, patrolRadius
- spawnDelay
- respawnEnabled, respawnDelay

## Score System

### ScoreSystem (`src/systems/ScoreSystem.js`)

Tracks score, combos, and statistics.

**Responsibilities:**
- Score accumulation
- Combo tracking with timeout (3 seconds)
- Combo multiplier: `1 + (combo - 1) * 0.25`
- Hit and defeat registration
- HUD updates

## Audio System

### AudioSystem (`src/systems/AudioSystem.js`)

Procedural audio generation using Web Audio API.

**Responsibilities:**
- Audio context management (lazy init on user gesture)
- Procedural sound synthesis (no audio files)
- Shoot, hit, defeat, and bounce sounds

## Level System

### Level (`src/levels/Level.js`)

Base class for game levels.

**Responsibilities:**
- Lighting setup (ambient, directional sun, hemisphere)
- Ground plane
- Environment building helper methods

### TestLevel (`src/levels/TestLevel.js`)

MVP test environment, enhanced for Milestone 2.

**Contents:**
- Parking lot with painted lines, arrows, and parking stops
- MEGA MART storefront with sign, windows, door
- Curbs and sidewalks
- Shopping carts and cart corral
- Bench, trash cans
- Light poles with arms
- Planters with bushes
- Parked car placeholders
- Trees around perimeter
- Signage poles
- Spawn definitions for 2 Manager Karens + 1 HOA Karen

## UI System

### HUD (`src/ui/HUD.js`)

DOM-based heads-up display.

**Responsibilities:**
- Score display
- Combo display with animation
- Weapon/ammo display
- Hit feedback text
- Hit marker animation
- Debug overlay with full renderer.info stats
- Blocker/instructions screen

## Data Flow

```
InputManager
    │
    ├── WASD → FPSController → Player.position
    ├── Mouse → FPSController → Camera rotation
    └── Click → CrocLauncher → ProjectileSystem.spawnProjectile()
                                      │
                                      └── Projectile update (physics + position tracking)
                                              │
                                    CollisionSystem.update(playerPos)
                                              │
                              ┌───────────────┼────────────────┐
                              │               │                │
                      swept collision    VFXSystem      ScoreSystem
                      sphere-cylinder    spawnImpact    registerHit
                              │               │                │
                      Karen.takeDamage  particles+ring   HUD update
                              │               │
                      stateMachine      floating text
                      → REACT
                              │
                      animController
                      → play("Punch")
```

## Configuration

All tunable values live in `src/config/`:

- `constants.js` - Global physics, timing, and rendering constants
- `karenTypes.js` - Karen archetype definitions (health, speed, dialogue, detection, abilities)
- `weapons.js` - Weapon definitions (velocity, damage, cooldown, projectile model)

Adding a new Karen type requires only a config entry and optionally a subclass for accessories.

## Known Architectural Defects Fixed (MVP → Milestone 2)

| Defect | Description | Fix |
|--------|-------------|-----|
| Null scene | SceneManager received `null` scene from Renderer constructor | Scene created in Renderer constructor |
| Projectile spawn position | Mesh never positioned at spawn origin | Set `mesh.position` in `Projectile.init()` |
| Respawn timer leaks | `setTimeout` not cancellable on reset | Track timers in CollisionSystem, `clear()` cancels all |
| Duplicate pointerlock listeners | Both FPSController and PointerLockControls registered listeners | Use `controls.isLocked` property instead |
| No pooled position reset | Recycled projectiles spawned at (0,0,0) | Set position in `init()`, track `previousPosition` |
| No swept collision | Fast projectiles tunneled through targets | Segment-based detection in CollisionSystem |
