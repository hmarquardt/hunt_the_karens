# Asset Pipeline

This document describes how to create, import, and manage assets for Hunt the Karens.

## Accepted Model Formats

- **GLB** (preferred) - Binary glTF, single file, efficient
- **GLTF** (accepted) - JSON + external binary/textures, more complex

## GLB/GLTF Workflow

1. Export from DCC tool (Blender, Maya, etc.) as GLB
2. Place file in `assets/models/`
3. Load via `AssetManager.loadCharacterAsset(name, url)`
4. Reference by name in Karen archetype config (`characterAssetName`)

## Coordinate Conventions

- **Y-up** (Three.js default)
- **+Z** is forward (character faces +Z)
- **+X** is right
- Origin should be at character feet center

## Scale Conventions

- **1 unit = 1 meter**
- Average human character: ~1.6-1.8 units tall
- Karen archetypes should scale to ~1.65 units

## Model Origin Requirements

- Model origin (0,0,0) should be at the **character's feet center**
- This ensures proper ground placement and collision calculation
- The CharacterAsset will compute bounding box for collider dimensions

## Texture Conventions

- **Format**: PNG or JPEG
- **Color space**: sRGB
- **Size**: Power of 2 preferred (512, 1024, 2048)
- **Normal maps**: Use Three.js normal map conventions
- All textures should be placed in `assets/textures/`

## Animation Naming Conventions

Animation clip names in the GLB should be recognizable. The AnimationController maps them by trimmed name:

| Expected Name | Purpose |
|---------------|---------|
| `Idle` | Standing idle animation |
| `Walking` | Walk cycle |
| `Running` | Run cycle (optional) |
| `Death` | Defeat/ragdoll animation |
| `Punch` | Reaction/hit animation |
| `ThumbsUp` | Special ability animation |
| `Wave` | Greeting/alert animation |
| `Yes` / `No` | Dialogue emphasis (optional) |

Names are matched case-sensitively after trimming whitespace. If an expected name is not found, the animation is skipped gracefully.

## Karen Accessories

Accessories (phones, clipboards, tape measures, etc.) should be handled in one of two ways:

1. **Boned to skeleton** (preferred) - Accessories are child objects of specific bones in the GLB. This ensures they move naturally with the character during animation.

2. **Attached to mesh** (current approach) - Accessories are added as child meshes to the Karen Group in code (e.g., `ManagerKaren._addManagerAccessories()`). This works for placeholder geometry but will be replaced when proper GLTF models include accessories.

When replacing the temporary character model:
- Include accessories as bone children in the GLB
- Remove the corresponding code from Karen subclass `_add*Accessories()` methods
- Update the character asset to include the new model

## Replacing Placeholder Character Models

The current temporary character is `RobotExpressive.glb` from the Three.js examples repository.

To replace it:

1. Create or export your Karen model as GLB
2. Place in `assets/models/`
3. Update `main.js` to load the new asset:
   ```javascript
   await game.assetManager.loadCharacterAsset('karen', './assets/models/YourModel.glb');
   ```
4. Update the spawn callback in `main.js`:
   ```javascript
   karen.characterAssetName = 'karen';
   ```
5. Ensure the GLB has appropriate animation clips (see naming conventions)
6. Test with F3 debug mode to verify animations crossfade correctly

## Licensing and Provenance Requirements

All third-party assets must be documented in `vendor/VERSIONS.md` or `assets/ASSETS.md`:

- **Source URL** or origin
- **License type** (MIT, CC-BY, CC0, etc.)
- **Author/attribution**
- **Date acquired**

Do not include assets without clear licensing.

## Current Assets

| File | Source | License | Purpose |
|------|--------|---------|---------|
| `RobotExpressive.glb` | Three.js r164 examples | MIT | Temporary character model |

## AssetManager API

```javascript
// Load a character asset (GLB with animations)
await assetManager.loadCharacterAsset('name', './path/to/model.glb');

// Get the loaded asset
const asset = assetManager.getCharacterAsset('name');

// Clone an instance (safe for multiple characters)
const instance = asset.cloneInstance();

// Get animation clips
const clips = asset.getAnimationClips();

// Get character dimensions
const height = asset.getHeight();
const radius = asset.getRadius();
```

## SkeletonUtils

The project vendors `SkeletonUtils.js` from Three.js examples specifically for cloning skinned meshes. The `CharacterAsset.cloneInstance()` method uses `SkeletonUtils.clone()` to create independent instances of a character model, each with its own AnimationMixer state.

This allows multiple Karen instances to animate independently without sharing bone state.
