import * as THREE from 'three';

export class Level {
    constructor() {
        this.name = 'Unnamed Level';
        this.spawnPoint = new THREE.Vector3(0, 0, 5);
        this._enemies = [];
        this._environmentObjects = [];
    }

    build(sceneManager) {
        this._setupLighting(sceneManager);
        this._setupGround(sceneManager);
        this._setupEnvironment(sceneManager);
        this._setupEnemies(sceneManager);
    }

    _setupLighting(sceneManager) {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        sceneManager.addLight(ambient);

        const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
        sun.position.set(20, 30, 15);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        sun.shadow.bias = -0.001;
        sceneManager.addLight(sun);

        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x5a7247, 0.3);
        sceneManager.addLight(hemi);
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
        for (const enemy of this._enemies) {
            sceneManager.registerEnemy(enemy);
        }
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
}
