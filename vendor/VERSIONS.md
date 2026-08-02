# Vendored Dependencies

This file documents every vendored third-party dependency in this repository.

## Three.js

| Field | Value |
|-------|-------|
| **Library** | Three.js |
| **Version** | 0.164.0 |
| **License** | MIT |
| **Source** | https://github.com/mrdoob/three.js |
| **Release** | https://github.com/mrdoob/three.js/releases/tag/r164 |

### Files Retained

| File | Upstream Path |
|------|---------------|
| `three.module.js` | `build/three.module.js` |
| `GLTFLoader.js` | `examples/jsm/loaders/GLTFLoader.js` |
| `DRACOLoader.js` | `examples/jsm/loaders/DRACOLoader.js` |
| `PointerLockControls.js` | `examples/jsm/controls/PointerLockControls.js` |
| `EffectComposer.js` | `examples/jsm/postprocessing/EffectComposer.js` |
| `RenderPass.js` | `examples/jsm/postprocessing/RenderPass.js` |
| `UnrealBloomPass.js` | `examples/jsm/postprocessing/UnrealBloomPass.js` |
| `OutputPass.js` | `examples/jsm/postprocessing/OutputPass.js` |
| `Pass.js` | `examples/jsm/postprocessing/Pass.js` |
| `ShaderPass.js` | `examples/jsm/postprocessing/ShaderPass.js` |
| `CopyShader.js` | `examples/jsm/shaders/CopyShader.js` |
| `LuminosityHighPassShader.js` | `examples/jsm/shaders/LuminosityHighPassShader.js` |
| `SkeletonUtils.js` | `examples/jsm/utils/SkeletonUtils.js` |

### Download URLs

All files were downloaded from jsdelivr CDN:

```
https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/loaders/GLTFLoader.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/loaders/DRACOLoader.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/controls/PointerLockControls.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/EffectComposer.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/RenderPass.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/UnrealBloomPass.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/OutputPass.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/Pass.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/postprocessing/ShaderPass.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/shaders/CopyShader.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/shaders/LuminosityHighPassShader.js
https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/utils/SkeletonUtils.js
```

### Replacement

To upgrade or replace Three.js:

1. Download the new version from the same CDN URLs (changing version number)
2. Replace all files in `vendor/three/`
3. Update this file with the new version
4. Verify the import map in `index.html` still resolves correctly

### License

```
The MIT License

Copyright (c) 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Asset Models

| File | Source | License | Purpose |
|------|--------|---------|---------|
| `RobotExpressive.glb` | Three.js r164 examples (`examples/models/gltf/RobotExpressive/`) | MIT | Temporary character model with skeletal animations |

### RobotExpressive Model

- **Source URL**: https://github.com/mrdoob/three.js/tree/r164/examples/models/gltf/RobotExpressive
- **Animations included**: Idle, Walking, Running, Dance, Death, Sitting, Standing, Jump, Yes, No, Wave, Punch, ThumbsUp
- **Mapped to Karen states**: Idle, Walking (patrol/confront), Death (defeated), Punch (reaction), ThumbsUp (special ability)
- **Size**: ~454 KB
- **License**: MIT (same as Three.js)
