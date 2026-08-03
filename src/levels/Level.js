import * as THREE from 'three';

export class Level {
    constructor() {
        this.name = 'Unnamed Level';
        this.spawnPoint = new THREE.Vector3(0, 0, 5);
        this._enemies = [];
        this._environmentObjects = [];
    }

    async build(sceneManager) {
        this._setupLighting(sceneManager);
        this._setupGround(sceneManager);
        this._setupEnvironment(sceneManager);
        this._setupEnemies(sceneManager);
    }

    _setupLighting(sceneManager) {
        // Warm late-afternoon sun
        const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
        sun.position.set(15, 25, -10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 100;
        sun.shadow.camera.left = -35;
        sun.shadow.camera.right = 35;
        sun.shadow.camera.top = 35;
        sun.shadow.camera.bottom = -35;
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 0.02;
        sceneManager.addLight(sun);

        // Soft ambient fill
        const ambient = new THREE.AmbientLight(0x8899bb, 0.35);
        sceneManager.addLight(ambient);

        // Hemisphere for sky/ground color separation
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x5a4a3a, 0.5);
        sceneManager.addLight(hemi);

        // Subtle warm fill from opposite side
        const fill = new THREE.DirectionalLight(0xffccaa, 0.3);
        fill.position.set(-10, 5, 15);
        sceneManager.addLight(fill);
    }

    _setupGround(sceneManager) {
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x5a7247,
            roughness: 0.9,
            metalness: 0,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        sceneManager.add(ground, true);
    }

    _setupEnvironment(sceneManager) {
        // Override in subclass
    }

    _setupEnemies(sceneManager) {
        // Enemy spawning is handled by SpawnDirector, not the Level.
        // This method is kept for backward compatibility.
    }

    getEnemies() {
        return this._enemies;
    }

    addBox(sceneManager, x, y, z, w, h, d, color, isCollidable = true) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        sceneManager.add(mesh, isCollidable);
        return mesh;
    }

    update(delta, playerPosition) {
        // Override in subclass for environmental motion
    }

    dispose() {
        // Override in subclass for resource cleanup
    }
}
