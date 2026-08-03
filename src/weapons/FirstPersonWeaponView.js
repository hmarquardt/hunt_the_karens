import * as THREE from 'three';
import { createCrocView, createWaterBalloon, createGardenGnome } from './WeaponModels.js';
import { createFirstPersonHand } from './FirstPersonHand.js';

export class FirstPersonWeaponView {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;
        this.mesh = null;
        this.handGroup = null;
        this.visible = false;
        this.fireAnimTimer = 0;
        this.fireAnimDuration = 0.2;
        this.idleBobTimer = 0;
        this.idleBobAmount = 0.003;

        this._basePosition = new THREE.Vector3(0.3, -0.25, -0.5);
        this._fireOffset = new THREE.Vector3(0, 0.12, -0.15);
        this._targetPosition = this._basePosition.clone();
        this._currentPosition = this._basePosition.clone();

        this._buildMesh();
        this.hide();
    }

    _buildMesh() {
        const group = new THREE.Group();

        // Create hand
        const handResult = createFirstPersonHand({
            sleeveColor: this.config.viewSleeveColor || 0x334433,
        });
        this.handGroup = handResult.group;
        group.add(this.handGroup);

        // Create weapon model based on type
        const weaponId = this.config.id;
        let weaponResult;

        if (weaponId === 'croc') {
            weaponResult = createCrocView({
                color: this.config.viewColor || 0x2d5a27,
            });
            this.mesh = weaponResult.group;
            this.mesh.position.set(0, 0.05, 0.05);
            this.mesh.rotation.set(-0.3, 0.2, 0.1);
            this.mesh.scale.set(2.5, 2.5, 2.5);
        } else if (weaponId === 'waterBalloon') {
            weaponResult = createWaterBalloon({
                color: this.config.viewColor || 0x4488ff,
            });
            this.mesh = weaponResult.group;
            this.mesh.position.set(0, 0.06, 0.06);
            this.mesh.scale.set(1.5, 1.5, 1.5);
        } else if (weaponId === 'gardenGnome') {
            weaponResult = createGardenGnome();
            this.mesh = weaponResult.group;
            this.mesh.position.set(0.02, 0.02, 0.03);
            this.mesh.scale.set(1.8, 1.8, 1.8);
        } else {
            // Fallback box
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
        this._currentPosition.copy(this._basePosition);
    }

    hide() {
        if (this.group) {
            this.group.visible = false;
        }
        this.visible = false;
    }

    fireAnimation() {
        this.fireAnimTimer = this.fireAnimDuration;
    }

    update(delta) {
        if (!this.visible || !this.group) return;

        if (this.fireAnimTimer > 0) {
            this.fireAnimTimer -= delta;
            const t = this.fireAnimTimer / this.fireAnimDuration;
            const ease = t * t;

            this._targetPosition.copy(this._basePosition).addScaledVector(this._fireOffset, ease);

            // Subtle weapon rotation during throw
            if (this.mesh) {
                this.mesh.rotation.x = -0.3 + ease * 0.5;
                this.mesh.rotation.z = 0.1 - ease * 0.3;
            }
        } else {
            this._targetPosition.copy(this._basePosition);

            if (this.mesh) {
                // Reset rotation
                if (this.config.id === 'croc') {
                    this.mesh.rotation.set(-0.3, 0.2, 0.1);
                } else if (this.config.id === 'waterBalloon') {
                    this.mesh.rotation.set(0, 0, 0);
                } else if (this.config.id === 'gardenGnome') {
                    this.mesh.rotation.set(0, 0, 0);
                }
            }

            this.idleBobTimer += delta;
            this._targetPosition.y += Math.sin(this.idleBobTimer * 2) * this.idleBobAmount;
        }

        this._currentPosition.lerp(this._targetPosition, 0.15);
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
