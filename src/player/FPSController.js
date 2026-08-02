import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/PointerLockControls.js';
import { Player } from './Player.js';
import { StatusEffectController } from '../entities/components/StatusEffectController.js';
import * as CONSTANTS from '../config/constants.js';

export class FPSController {
    constructor(camera, inputManager, sceneManager) {
        this.camera = camera;
        this.inputManager = inputManager;
        this.sceneManager = sceneManager;
        this.player = new Player();
        this.controls = null;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.moveDirection = new THREE.Vector3();
        this._isLocked = false;
        this.speedMultiplier = 1.0;
        this.statusEffects = new StatusEffectController();

        this._onPointerLockError = this._onPointerLockError.bind(this);
    }

    init() {
        this.controls = new PointerLockControls(this.camera, document.body);

        document.addEventListener('pointerlockerror', this._onPointerLockError);

        document.addEventListener('click', () => {
            if (!this._isLocked) {
                this.controls.lock();
            }
        });

        this._syncLockState();

        this.reset(new THREE.Vector3(0, 0, 5));
    }

    _syncLockState() {
        this._isLocked = this.controls.isLocked;

        document.addEventListener('pointerlockchange', () => {
            this._isLocked = this.controls.isLocked;
        });
    }

    reset(position) {
        this.player.reset(position);
        this.camera.position.copy(this.player.getEyePosition());
        this.euler.set(0, 0, 0);
        this.camera.quaternion.setFromEuler(this.euler);
    }

    update(delta) {
        if (!this._isLocked) return;

        this.statusEffects.update(delta * 1000);
        this.speedMultiplier = this.statusEffects.getModifier('speedMultiplier');

        this._handleRotation();
        this._handleMovement(delta);
        this._handleGravity(delta);
        this._handleCollisions();

        this.camera.position.copy(this.player.getEyePosition());
    }

    _handleRotation() {
        const mouse = this.inputManager.consumeMouseMovement();
        this.euler.setFromQuaternion(this.camera.quaternion);

        this.euler.y -= mouse.x * CONSTANTS.MOUSE_SENSITIVITY;
        this.euler.x -= mouse.y * CONSTANTS.MOUSE_SENSITIVITY;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
    }

    _handleMovement(delta) {
        const input = this.inputManager;
        this.moveDirection.set(0, 0, 0);

        if (input.isKey('w')) this.moveDirection.z -= 1;
        if (input.isKey('s')) this.moveDirection.z += 1;
        if (input.isKey('a')) this.moveDirection.x -= 1;
        if (input.isKey('d')) this.moveDirection.x += 1;

        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();
        }

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const speed = CONSTANTS.PLAYER_SPEED * this.speedMultiplier;
        const velocity = new THREE.Vector3();
        velocity.addScaledVector(forward, -this.moveDirection.z * speed);
        velocity.addScaledVector(right, this.moveDirection.x * speed);

        this.player.position.x += velocity.x * delta;
        this.player.position.z += velocity.z * delta;
    }

    _handleGravity(delta) {
        if (!this.player.onGround) {
            this.player.velocity.y += CONSTANTS.GRAVITY * delta;
            this.player.position.y += this.player.velocity.y * delta;

            if (this.player.position.y <= CONSTANTS.FLOOR_Y) {
                this.player.position.y = CONSTANTS.FLOOR_Y;
                this.player.velocity.y = 0;
                this.player.onGround = true;
            }
        }
    }

    _handleCollisions() {
        const bounds = this.player.getColliderBounds();
        const collidables = this.sceneManager.getCollidables();

        for (const mesh of collidables) {
            const box = new THREE.Box3().setFromObject(mesh);

            if (this._boxIntersects(bounds, box)) {
                this._resolveCollision(bounds, box);
            }
        }

        this.player.position.y = Math.max(this.player.position.y, CONSTANTS.FLOOR_Y);
    }

    _boxIntersects(a, b) {
        return (
            a.min.x <= b.max.x && a.max.x >= b.min.x &&
            a.min.y <= b.max.y && a.max.y >= b.min.y &&
            a.min.z <= b.max.z && a.max.z >= b.min.z
        );
    }

    _resolveCollision(playerBounds, obstacleBox) {
        const overlapX = Math.min(playerBounds.max.x - obstacleBox.min.x, obstacleBox.max.x - playerBounds.min.x);
        const overlapZ = Math.min(playerBounds.max.z - obstacleBox.min.z, obstacleBox.max.z - playerBounds.min.z);

        if (overlapX < overlapZ) {
            const pushX = playerBounds.max.x - obstacleBox.min.x < obstacleBox.max.x - playerBounds.min.x
                ? -overlapX
                : overlapX;
            this.player.position.x += pushX;
        } else {
            const pushZ = playerBounds.max.z - obstacleBox.min.z < obstacleBox.max.z - playerBounds.min.z
                ? -overlapZ
                : overlapZ;
            this.player.position.z += pushZ;
        }
    }

    _onPointerLockError(e) {
        console.error('[FPSController] PointerLock error:', e);
    }
}
