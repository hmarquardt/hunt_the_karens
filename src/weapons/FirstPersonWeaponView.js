import * as THREE from 'three';
import { createCrocView, createWaterBalloon, createGardenGnome } from '../visual/WeaponModels.js';
import { createFirstPersonHand } from '../visual/FirstPersonHand.js';

const PHASE = { WINDUP: 0, RELEASE: 1, RECOVERY: 2, IDLE: 3 };

const WEAPON_ANIM = {
    croc: {
        windupDuration: 0.15,
        releaseDuration: 0.12,
        recoveryDuration: 0.25,
        windupOffset: new THREE.Vector3(0, -0.08, 0.10),
        windupRotX: -0.6,
        releaseOffset: new THREE.Vector3(0, 0.18, -0.20),
        releaseRotX: 0.2,
        recoveryRotX: 0.0,
    },
    waterBalloon: {
        windupDuration: 0.12,
        releaseDuration: 0.10,
        recoveryDuration: 0.20,
        windupOffset: new THREE.Vector3(0, -0.05, 0.06),
        windupRotX: -0.4,
        releaseOffset: new THREE.Vector3(0, 0.10, -0.12),
        releaseRotX: 0.1,
        recoveryRotX: 0.0,
    },
    gardenGnome: {
        windupDuration: 0.20,
        releaseDuration: 0.15,
        recoveryDuration: 0.30,
        windupOffset: new THREE.Vector3(0, -0.12, 0.15),
        windupRotX: -0.8,
        releaseOffset: new THREE.Vector3(0, 0.22, -0.25),
        releaseRotX: 0.3,
        recoveryRotX: 0.0,
    },
};

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
}

function smoothStep(t) {
    return t * t * (3 - 2 * t);
}

export class FirstPersonWeaponView {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;
        this.mesh = null;
        this.handGroup = null;
        this.visible = false;

        this.idleBobTimer = 0;
        this.idleBobAmount = 0.003;

        const weaponId = config.id || 'croc';
        const animDef = WEAPON_ANIM[weaponId] || WEAPON_ANIM.croc;
        this._windupDuration = animDef.windupDuration;
        this._releaseDuration = animDef.releaseDuration;
        this._recoveryDuration = animDef.recoveryDuration;
        this._totalDuration = this._windupDuration + this._releaseDuration + this._recoveryDuration;

        this._basePosition = new THREE.Vector3(0.3, -0.25, -0.5);
        this._currentPosition = this._basePosition.clone();
        this._targetPosition = this._basePosition.clone();

        this._phase = PHASE.IDLE;
        this._animElapsed = 0;
        this._windupOffset = animDef.windupOffset.clone();
        this._releaseOffset = animDef.releaseOffset.clone();
        this._windupRotX = animDef.windupRotX;
        this._releaseRotX = animDef.releaseRotX;
        this._baseRotX = -0.3;
        this._baseRotY = 0.2;
        this._baseRotZ = 0.1;

        this._buildMesh();
        this.hide();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const handResult = createFirstPersonHand({
            sleeveColor: this.config.viewSleeveColor || 0x334433,
        });
        this.handGroup = handResult.group;
        group.add(this.handGroup);

        const weaponId = this.config.id;
        let weaponResult;

        if (weaponId === 'croc') {
            weaponResult = createCrocView({
                color: this.config.viewColor || 0x2d5a27,
            });
            this.mesh = weaponResult.group;
            this.mesh.position.set(0, 0.05, 0.05);
            this.mesh.rotation.set(this._baseRotX, this._baseRotY, this._baseRotZ);
            this.mesh.scale.set(2.5, 2.5, 2.5);
        } else if (weaponId === 'waterBalloon') {
            weaponResult = createWaterBalloon({
                color: this.config.viewColor || 0x4488ff,
            });
            this.mesh = weaponResult.group;
            this.mesh.position.set(0, 0.06, 0.06);
            this.mesh.scale.set(1.5, 1.5, 1.5);
            this._baseRotX = 0;
            this._baseRotY = 0;
            this._baseRotZ = 0;
        } else if (weaponId === 'gardenGnome') {
            weaponResult = createGardenGnome();
            this.mesh = weaponResult.group;
            this.mesh.position.set(0.02, 0.02, 0.03);
            this.mesh.scale.set(1.8, 1.8, 1.8);
            this._baseRotX = 0;
            this._baseRotY = 0;
            this._baseRotZ = 0;
        } else {
            const geo = new THREE.BoxGeometry(
                this.config.viewScale[0],
                this.config.viewScale[1],
                this.config.viewScale[2]
            );
            const mat = new THREE.MeshStandardMaterial({
                color: this.config.viewColor,
                roughness: 0.5,
                metalness: 0.3,
            });
            this.mesh = new THREE.Mesh(geo, mat);
        }

        if (this.mesh) {
            this.mesh.castShadow = false;
            group.add(this.mesh);
        }

        group.position.copy(this._basePosition);

        this.camera.add(group);
        this.group = group;
    }

    show() {
        if (this.group) {
            this.group.visible = true;
        }
        this.visible = true;
        this._phase = PHASE.IDLE;
        this._currentPosition.copy(this._basePosition);
    }

    hide() {
        if (this.group) {
            this.group.visible = false;
        }
        this.visible = false;
    }

    fireAnimation() {
        this._phase = PHASE.WINDUP;
        this._animElapsed = 0;
    }

    _getAnimParams() {
        const weaponId = this.config.id || 'croc';
        const animDef = WEAPON_ANIM[weaponId] || WEAPON_ANIM.croc;
        return animDef;
    }

    update(delta) {
        if (!this.visible || !this.group) return;

        if (this._phase !== PHASE.IDLE) {
            this._animElapsed += delta;

            if (this._phase === PHASE.WINDUP) {
                const t = Math.min(this._animElapsed / this._windupDuration, 1);
                const ease = easeInOut(t);

                this._targetPosition.copy(this._basePosition).addScaledVector(this._windupOffset, ease);

                if (this.mesh) {
                    this.mesh.rotation.x = this._baseRotX + (this._windupRotX - this._baseRotX) * ease;
                    this.mesh.rotation.z = this._baseRotZ * (1 - ease * 0.5);
                }

                if (this._animElapsed >= this._windupDuration) {
                    this._phase = PHASE.RELEASE;
                    this._animElapsed = 0;
                }
            } else if (this._phase === PHASE.RELEASE) {
                const t = Math.min(this._animElapsed / this._releaseDuration, 1);
                const ease = easeOut(t);

                const offset = new THREE.Vector3().lerpVectors(this._windupOffset, this._releaseOffset, ease);
                this._targetPosition.copy(this._basePosition).add(offset);

                if (this.mesh) {
                    const rotX = this._windupRotX + (this._releaseRotX - this._windupRotX) * ease;
                    this.mesh.rotation.x = rotX;
                    this.mesh.rotation.z = this._baseRotZ * (1 - ease);
                }

                if (this._animElapsed >= this._releaseDuration) {
                    this._phase = PHASE.RECOVERY;
                    this._animElapsed = 0;
                }
            } else if (this._phase === PHASE.RECOVERY) {
                const t = Math.min(this._animElapsed / this._recoveryDuration, 1);
                const ease = smoothStep(t);

                this._targetPosition.copy(this._basePosition).addScaledVector(this._releaseOffset, 1 - ease);

                if (this.mesh) {
                    this.mesh.rotation.x = this._releaseRotX * (1 - ease);
                    this.mesh.rotation.z = this._baseRotZ;
                }

                if (this._animElapsed >= this._recoveryDuration) {
                    this._phase = PHASE.IDLE;
                    this._targetPosition.copy(this._basePosition);
                    if (this.mesh) {
                        this.mesh.rotation.set(this._baseRotX, this._baseRotY, this._baseRotZ);
                    }
                }
            }
        } else {
            this._targetPosition.copy(this._basePosition);

            if (this.mesh) {
                this.mesh.rotation.set(this._baseRotX, this._baseRotY, this._baseRotZ);
            }

            this.idleBobTimer += delta;
            this._targetPosition.y += Math.sin(this.idleBobTimer * 2) * this.idleBobAmount;
        }

        this._currentPosition.lerp(this._targetPosition, 0.2);
        this.group.position.copy(this._currentPosition);
    }

    dispose() {
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}
