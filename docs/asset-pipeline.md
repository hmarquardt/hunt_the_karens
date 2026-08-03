# Asset Pipeline

## Character Assets

### Karen Base Human (Procedural)
- **Source**: Created procedurally in-game using Three.js geometry
- **Author**: Hunt the Karens project
- **License**: MIT (same as project)
- **Modifications**: N/A — generated at runtime
- **Description**: Stylized low-poly adult female human silhouette with proper proportions. Built from primitive geometry with careful scaling. Includes body, head, hair, and accessory attachment points.
- **Skeleton**: None — uses simple hierarchy with named attachment points
- **Animation**: Uses animation clips from GLB assets mapped via semantic animation map

### RobotExpressive
- **Source**: Three.js examples (bundled with Three.js distribution)
- **Author**: Three.js contributors
- **URL**: https://threejs.org/
- **License**: MIT (same as Three.js)
- **Modifications**: None
- **Status**: Retained for animation reference only; not used as visible character in normal gameplay
- **Local path**: `assets/models/RobotExpressive.glb`

## Animation Assets

### RobotExpressive Animations
- **Source**: Three.js examples
- **License**: MIT
- **Clips used**: Idle, Walk, Run, ThumbsUp, Wave, Dance, Death
- **Mapping**: Semantic animation map translates gameplay actions to clip names

## Environment Textures

All environment textures are generated procedurally at runtime or use simple color materials. No external texture assets are bundled.

## Sound Assets

All sounds are generated procedurally using Web Audio API oscillators and noise buffers. No external audio files are bundled.

## 3D Models

All weapon and projectile models are built procedurally at runtime using Three.js geometry. No external model assets are bundled for weapons.
