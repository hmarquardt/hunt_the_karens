import * as THREE from 'three';

export class SceneManager {
    constructor(scene) {
        this.scene = scene;
        this.collidables = [];
        this.enemies = [];
        this.projectiles = [];
        this._lights = [];
    }

    add(mesh, isCollidable = false) {
        this.scene.add(mesh);
        if (isCollidable) {
            this.collidables.push(mesh);
        }
        return mesh;
    }

    remove(mesh) {
        this.scene.remove(mesh);
        const idx = this.collidables.indexOf(mesh);
        if (idx !== -1) this.collidables.splice(idx, 1);
    }

    addLight(light) {
        this.scene.add(light);
        this._lights.push(light);
        return light;
    }

    registerEnemy(enemy) {
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);
    }

    unregisterEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);
        this.scene.remove(enemy.mesh);
    }

    registerProjectile(projectile) {
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
    }

    unregisterProjectile(projectile) {
        const idx = this.projectiles.indexOf(projectile);
        if (idx !== -1) this.projectiles.splice(idx, 1);
        this.scene.remove(projectile.mesh);
    }

    clear() {
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            this.scene.remove(this.scene.children[i]);
        }
        this.collidables = [];
        this.enemies = [];
        this.projectiles = [];
        this._lights = [];
    }

    getCollidables() {
        return this.collidables;
    }

    getEnemies() {
        return this.enemies;
    }

    getProjectiles() {
        return this.projectiles;
    }
}
