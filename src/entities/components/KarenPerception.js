import * as THREE from 'three';

const _scratchToPlayer = new THREE.Vector3();
const _scratchForward = new THREE.Vector3();
const _scratchPlayerDir = new THREE.Vector3();

export class KarenPerception {
    constructor(config) {
        this.detectionRange = config.detectionRange || 15;
        this.detectionAngle = config.detectionAngle || Math.PI * 0.6;
        this.aggressionRange = config.aggressionRange || 10;

        this.playerDetected = false;
        this.playerPosition = new THREE.Vector3();
        this.playerDistance = Infinity;
        this.lastKnownPlayerPosition = new THREE.Vector3();
        this.awarenessLevel = 0;
    }

    update(karenPosition, karenQuaternion, playerPosition) {
        if (!playerPosition) {
            this.playerDetected = false;
            this.playerDistance = Infinity;
            return;
        }

        _scratchToPlayer.subVectors(playerPosition, karenPosition);
        _scratchToPlayer.y = 0;
        const distance = _scratchToPlayer.length();

        this.playerPosition.copy(playerPosition);
        this.playerDistance = distance;

        const inRange = distance <= this.detectionRange;

        if (inRange) {
            _scratchForward.set(0, 0, 1).applyQuaternion(karenQuaternion);
            _scratchForward.y = 0;
            _scratchForward.normalize();

            _scratchPlayerDir.copy(_scratchToPlayer).normalize();
            const dot = _scratchForward.dot(_scratchPlayerDir);
            const angleThreshold = Math.cos(this.detectionAngle / 2);

            this.playerDetected = dot > angleThreshold;

            if (this.playerDetected) {
                this.lastKnownPlayerPosition.copy(playerPosition);
                this.awarenessLevel = Math.min(1, this.awarenessLevel + 0.008);
            }
        } else {
            this.playerDetected = false;
            this.awarenessLevel = Math.max(0, this.awarenessLevel - 0.005);
        }
    }

    shouldConfront() {
        return this.playerDetected && this.playerDistance <= this.aggressionRange;
    }

    shouldAlert() {
        return this.playerDetected && this.playerDistance <= this.detectionRange;
    }

    shouldDisengage() {
        return !this.playerDetected || this.playerDistance > this.detectionRange * 1.2;
    }
}
