import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

export class Player {
    constructor() {
        this.position = new THREE.Vector3(0, CONSTANTS.PLAYER_HEIGHT, 0);
        this.velocity = new THREE.Vector3();
        this.onGround = true;
        this.height = CONSTANTS.PLAYER_HEIGHT;
        this.radius = 0.3;
    }

    reset(position) {
        this.position.copy(position);
        this.position.y = CONSTANTS.PLAYER_HEIGHT;
        this.velocity.set(0, 0, 0);
        this.onGround = true;
    }

    getEyePosition() {
        return new THREE.Vector3(
            this.position.x,
            this.position.y + this.height,
            this.position.z
        );
    }

    getColliderBounds() {
        return {
            min: new THREE.Vector3(
                this.position.x - this.radius,
                this.position.y,
                this.position.z - this.radius
            ),
            max: new THREE.Vector3(
                this.position.x + this.radius,
                this.position.y + this.height,
                this.position.z + this.radius
            ),
        };
    }
}
