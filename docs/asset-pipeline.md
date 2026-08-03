# Asset Pipeline

## Character Assets

### ProceduralHuman (Procedural — Primary)
- **Source**: Created procedurally at runtime using Three.js geometry
- **Author**: Hunt the Karens project
- **URL**: N/A (generated in `src/visual/ProceduralHuman.js`)
- **License**: MIT (same as project)
- **Modifications**: N/A
- **Description**: Stylized low-poly adult female human with proper proportions. Built from primitive geometry with careful scaling. Includes body, head, limbs, hands, feet, and attachment points for hair/accessories. Supports configurable skin tone, outfit color, shoe color, and body type (petite/average/curvy/tall).
- **Location**: `src/visual/ProceduralHuman.js`

### Karen Hair — Asymmetric Bob (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **URL**: N/A (generated in `src/visual/KarenHair.js`)
- **License**: MIT
- **Modifications**: N/A
- **Description**: Signature Karen asymmetric bob with stacked back volume, shorter rear, longer front sweep, side burns, and highlight layer. Variants: blonde (default), platinum, brunette, auburn.
- **Location**: `src/visual/KarenHair.js`

### RobotExpressive (Fallback/Reference)
- **Source**: Three.js examples (bundled with Three.js distribution)
- **Author**: Three.js contributors
- **URL**: https://threejs.org/
- **License**: MIT
- **Modifications**: None
- **Status**: Retained for animation reference only; not used as visible character in normal gameplay
- **Local path**: `assets/models/RobotExpressive.glb`

## Animation Assets

### RobotExpressive Animations
- **Source**: Three.js examples
- **License**: MIT
- **Clips used**: Idle, Walk, Run, ThumbsUp, Wave, Dance, Death
- **Mapping**: Semantic animation map translates gameplay actions to clip names

## Visual Models

### Croc (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Generic foam/rubber clog with toe box, ventilation holes, heel strap, sole with tread pattern. Separate view model and projectile representation.
- **Location**: `src/visual/WeaponModels.js`

### Water Balloon (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Semi-translucent stretched sphere with tied neck, knot, internal water color variation, and subtle highlight.
- **Location**: `src/visual/WeaponModels.js`

### Garden Gnome (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Original stylized garden gnome with red pointed hat, white beard, blue shirt, belt with buckle, brown boots, hands, nose, and eyes.
- **Location**: `src/visual/WeaponModels.js`

### First-Person Hand (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Simple forearm with sleeve, palm, four fingers, and thumb. Supports weapon holding position.
- **Location**: `src/visual/FirstPersonHand.js`

## Environment

### Sky Dome (Procedural Shader)
- **Source**: Custom gradient shader
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Sphere with custom vertex/fragment shader creating blue-to-warm-green gradient atmosphere.
- **Location**: `src/levels/TestLevel.js` (embedded)

### Distant Silhouettes (Procedural)
- **Source**: Created procedurally at runtime
- **Author**: Hunt the Karens project
- **License**: MIT
- **Description**: Distant tree line (cone shapes) and commercial building silhouettes (box shapes) providing horizon context.
- **Location**: `src/levels/TestLevel.js`

## Textures

All environment textures are generated procedurally at runtime or use simple color materials. No external texture assets are bundled.

## Sound Assets

All sounds are generated procedurally using Web Audio API oscillators and noise buffers. No external audio files are bundled.

## 3D Models

All weapon and projectile models are built procedurally at runtime using Three.js geometry. No external model assets are bundled for weapons.
