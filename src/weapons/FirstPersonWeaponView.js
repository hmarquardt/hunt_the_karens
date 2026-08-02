import * as THREE from 'three';

export class FirstPersonWeaponView {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;
        this.mesh = null;
        this.visible = false;
        this.fireAnimTimer = 0;
        this.fireAnimDuration = 0.15;
        this.idleBobTimer = 0;
        this.idleBobAmount = 0.003;

        this._basePosition = new THREE.Vector3(0.3, -0.25, -0.5);
        this._fireOffset = new THREE.Vector3(0, 0.08, -0.1);
        this._targetPosition = this._basePosition.clone();
        this._currentPosition = this._basePosition.clone();

        this._buildMesh();
        this.hide();
    }

    _buildMesh() {
        const group = new THREE.Group();

        const geo = new THREE.BoxGeometry(
            this.config.viewScale[0],
            this.config.viewScale[1],
            this.config.viewScale[2]
        );
        const mat = new THREE.MeshStandardMaterial({
            color: this.config.viewColor,
            emissive: this.config.viewColor,
            emissiveIntensity: 0.1,
            roughness: 0.5,
            metalness: 0.3,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.castShadow = false;

        group.add(this.mesh);
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
        } else {
            this._targetPosition.copy(this._basePosition);

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
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
