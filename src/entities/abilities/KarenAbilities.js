import * as THREE from 'three';
import { KarenAbility } from './KarenAbility.js';

function disposeVfxEntry(vfx) {
    if (vfx.mesh.parent) vfx.mesh.parent.remove(vfx.mesh);
    if (vfx.geometry && !vfx._shared) vfx.geometry.dispose();
    if (vfx.material) vfx.material.dispose();
}

export class CallManagerAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'call_manager',
            name: 'Call the Manager',
            cooldown: config?.cooldown || 25000,
            telegraphDuration: config?.telegraphDuration || 2000,
            executeDuration: config?.executeDuration || 1500,
        });

        this.escalatedDuration = config?.escalatedDuration || 4;
        this.selfBuffDuration = config?.selfBuffDuration || 6;
        this._vfx = [];
    }

    setContext(karen, context) {
        this.karen = karen;
        this.context = context;
        this.playerStatusController = context?.playerStatusController || null;
        this.worldEffectSystem = context?.worldEffectSystem || null;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("I'm calling the MANAGER!");
            this._createTelegraphVFX();
        }
    }

    _createTelegraphVFX() {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const rightHand = this.karen.getAttachmentPoint('rightHand');
        const attachPoint = rightHand || karenMesh;

        const pulseRingGeo = new THREE.RingGeometry(0.08, 0.12, 16);
        const pulseRingMat = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
        });
        const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
        pulseRing.position.set(0, 0.15, 0.1);
        pulseRing.lookAt(0, 0.15, 1);
        attachPoint.add(pulseRing);
        this._vfx.push({ mesh: pulseRing, material: pulseRingMat, geometry: pulseRingGeo, startTime: performance.now(), type: 'pulse' });

        const glowGeo = new THREE.SphereGeometry(0.06, 8, 6);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff6644,
            transparent: true,
            opacity: 0.4,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0.15, 0.1);
        attachPoint.add(glow);
        this._vfx.push({ mesh: glow, material: glowMat, geometry: glowGeo, startTime: performance.now(), type: 'glow' });
    }

    _onExecute() {
        this._clearTelegraphVFX();

        if (!this.playerStatusController?.add) {
            console.warn('[CallManagerAbility] Missing playerStatusController — ESCALATED not applied');
            return;
        }

        this.playerStatusController.add({
            id: 'escalated',
            name: 'ESCALATED',
            duration: this.escalatedDuration,
            modifiers: {
                speedMultiplier: 0.75,
            },
        });

        if (this.karen) {
            this.karen.statusEffects.add({
                id: 'manager_zeal',
                name: 'MANAGER_ZEAL',
                duration: 6,
                modifiers: {
                    speedMultiplier: 1.2,
                },
            });
            this._createExecuteVFX();
        }
    }

    _createExecuteVFX() {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const alertGeo = new THREE.ConeGeometry(0.15, 0.2, 3);
        const alertMat = new THREE.MeshBasicMaterial({
            color: 0xff2222,
            transparent: true,
            opacity: 0.8,
        });
        const alert = new THREE.Mesh(alertGeo, alertMat);
        alert.position.set(0, 2.0, 0);
        karenMesh.add(alert);
        this._vfx.push({ mesh: alert, material: alertMat, geometry: alertGeo, startTime: performance.now(), type: 'alert', duration: 800 });
    }

    _clearTelegraphVFX() {
        this._vfx.forEach(disposeVfxEntry);
        this._vfx = [];
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
        this._clearTelegraphVFX();
    }

    _onReset() {
        this._clearTelegraphVFX();
    }

    update(delta) {
        super.update(delta);

        const now = performance.now();
        this._vfx = this._vfx.filter((vfx) => {
            const elapsed = now - vfx.startTime;
            if (vfx.type === 'pulse') {
                const pulse = Math.sin(elapsed * 0.008) * 0.3 + 0.7;
                vfx.material.opacity = pulse;
                const scale = 1 + Math.sin(elapsed * 0.006) * 0.2;
                vfx.mesh.scale.set(scale, scale, scale);
                return true;
            } else if (vfx.type === 'glow') {
                const pulse = Math.sin(elapsed * 0.01) * 0.2 + 0.4;
                vfx.material.opacity = pulse;
                return true;
            } else if (vfx.type === 'alert' && vfx.duration) {
                const ratio = Math.max(0, 1 - elapsed / vfx.duration);
                vfx.material.opacity = ratio * 0.8;
                vfx.mesh.position.y = 2.0 + (1 - ratio) * 0.3;
                if (ratio <= 0) {
                    disposeVfxEntry(vfx);
                    return false;
                }
                return true;
            }
            return true;
        });
    }

    dispose() {
        super.dispose();
        this._clearTelegraphVFX();
    }
}

export class ViolationNoticeAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'violation_notice',
            name: 'Violation Notice',
            cooldown: config?.cooldown || 20000,
            telegraphDuration: config?.telegraphDuration || 2000,
            executeDuration: config?.executeDuration || 1000,
        });

        this.noticeDuration = config?.noticeDuration || 12;
        this.placeDistance = config?.placeDistance || 6;
        this._vfx = [];
    }

    setContext(karen, context) {
        this.karen = karen;
        this.context = context;
        this.playerStatusController = context?.playerStatusController || null;
        this.worldEffectSystem = context?.worldEffectSystem || null;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("HOA VIOLATION!");
            this._createTelegraphVFX();
        }
    }

    _createTelegraphVFX() {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const leftHand = this.karen.getAttachmentPoint('leftHand');
        const attachPoint = leftHand || karenMesh;

        const glowGeo = new THREE.SphereGeometry(0.1, 8, 6);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffcc22,
            transparent: true,
            opacity: 0.5,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0.1, 0);
        attachPoint.add(glow);
        this._vfx.push({ mesh: glow, material: glowMat, geometry: glowGeo, startTime: performance.now(), type: 'glow' });

        for (let i = 0; i < 3; i++) {
            const sparkGeo = new THREE.OctahedronGeometry(0.04, 0);
            const sparkMat = new THREE.MeshBasicMaterial({
                color: 0xffdd44,
                transparent: true,
                opacity: 0.8,
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            const angle = (i / 3) * Math.PI * 2;
            spark.position.set(Math.cos(angle) * 0.15, 0.1 + Math.sin(angle * 2) * 0.05, Math.sin(angle) * 0.15);
            attachPoint.add(spark);
            this._vfx.push({ mesh: spark, material: sparkMat, geometry: sparkGeo, startTime: performance.now(), type: 'spark', angle, index: i });
        }
    }

    _onExecute() {
        this._clearTelegraphVFX();

        if (!this.karen) return;
        if (!this.worldEffectSystem?.add) {
            console.warn('[ViolationNoticeAbility] Missing worldEffectSystem — notice not placed');
            return;
        }

        const dir = new THREE.Vector3();
        this.karen.getWorldDirection(dir);
        const placePos = this.karen.position.clone().add(dir.multiplyScalar(this.placeDistance));
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `violation_${performance.now()}`,
            position: placePos,
            duration: this.noticeDuration,
            radius: 3,
            type: 'notice',
            statusEffect: 'cited',
            statusDuration: 5,
            label: 'HOA VIOLATION',
        });

        this._createExecuteVFX(placePos);
    }

    _createExecuteVFX(placePos) {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const flashGeo = new THREE.PlaneGeometry(0.3, 0.4);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.set(0, 1.6, 0.3);
        karenMesh.add(flash);
        this._vfx.push({ mesh: flash, material: flashMat, geometry: flashGeo, startTime: performance.now(), type: 'flash', duration: 600 });
    }

    _clearTelegraphVFX() {
        this._vfx.forEach(disposeVfxEntry);
        this._vfx = [];
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
        this._clearTelegraphVFX();
    }

    _onReset() {
        this._clearTelegraphVFX();
    }

    update(delta) {
        super.update(delta);

        const now = performance.now();
        this._vfx = this._vfx.filter((vfx) => {
            const elapsed = now - vfx.startTime;
            if (vfx.type === 'glow') {
                const pulse = Math.sin(elapsed * 0.006) * 0.2 + 0.5;
                vfx.material.opacity = pulse;
                return true;
            } else if (vfx.type === 'spark') {
                const orbit = elapsed * 0.003 + vfx.angle;
                vfx.mesh.position.x = Math.cos(orbit) * 0.15;
                vfx.mesh.position.z = Math.sin(orbit) * 0.15;
                vfx.mesh.position.y = 0.1 + Math.sin(orbit * 3) * 0.05;
                vfx.material.opacity = Math.sin(elapsed * 0.01) * 0.4 + 0.4;
                return true;
            } else if (vfx.type === 'flash' && vfx.duration) {
                const ratio = Math.max(0, 1 - elapsed / vfx.duration);
                vfx.material.opacity = ratio * 0.9;
                vfx.mesh.scale.set(1 + (1 - ratio) * 0.5, 1 + (1 - ratio) * 0.5, 1);
                if (ratio <= 0) {
                    disposeVfxEntry(vfx);
                    return false;
                }
                return true;
            }
            return true;
        });
    }

    dispose() {
        super.dispose();
        this._clearTelegraphVFX();
    }
}

export class ReturnWithoutReceiptAbility extends KarenAbility {
    constructor(config) {
        super({
            id: 'return_without_receipt',
            name: 'Return Without Receipt',
            cooldown: config?.cooldown || 30000,
            telegraphDuration: config?.telegraphDuration || 2500,
            executeDuration: config?.executeDuration || 2000,
        });

        this.itemDuration = config?.itemDuration || 15;
        this.radius = config?.radius || 4;
        this._vfx = [];
    }

    setContext(karen, context) {
        this.karen = karen;
        this.context = context;
        this.playerStatusController = context?.playerStatusController || null;
        this.worldEffectSystem = context?.worldEffectSystem || null;
    }

    _onTelegraph() {
        if (this.karen) {
            this.karen.updateDialogue("I don't need a receipt!");
            this._createTelegraphVFX();
        }
    }

    _createTelegraphVFX() {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const rightHand = this.karen.getAttachmentPoint('rightHand');
        const attachPoint = rightHand || karenMesh;

        const highlightGeo = new THREE.SphereGeometry(0.08, 8, 6);
        const highlightMat = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.4,
        });
        const highlight = new THREE.Mesh(highlightGeo, highlightMat);
        highlight.position.set(0, 0.1, 0);
        attachPoint.add(highlight);
        this._vfx.push({ mesh: highlight, material: highlightMat, geometry: highlightGeo, startTime: performance.now(), type: 'highlight' });

        for (let i = 0; i < 4; i++) {
            const paperGeo = new THREE.PlaneGeometry(0.04, 0.06);
            const paperMat = new THREE.MeshBasicMaterial({
                color: 0xeeeeff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
            });
            const paper = new THREE.Mesh(paperGeo, paperMat);
            const angle = (i / 4) * Math.PI * 2;
            paper.position.set(Math.cos(angle) * 0.12, 0.15 + Math.random() * 0.1, Math.sin(angle) * 0.12);
            paper.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            attachPoint.add(paper);
            this._vfx.push({ mesh: paper, material: paperMat, geometry: paperGeo, startTime: performance.now(), type: 'paper', angle, index: i });
        }
    }

    _onExecute() {
        this._clearTelegraphVFX();

        if (!this.karen) return;
        if (!this.worldEffectSystem?.add) {
            console.warn('[ReturnWithoutReceiptAbility] Missing worldEffectSystem — returned item not placed');
            return;
        }

        const placePos = this.karen.position.clone();
        placePos.y = 0;

        this.worldEffectSystem.add({
            id: `returned_item_${performance.now()}`,
            position: placePos,
            duration: this.itemDuration,
            radius: this.radius,
            type: 'rejected_item',
            statusEffect: 'returned',
            statusDuration: 3,
            label: 'RETURNED ITEM',
        });

        this._createExecuteVFX();
    }

    _createExecuteVFX() {
        const karenMesh = this.karen.mesh;
        if (!karenMesh) return;

        const dropGeo = new THREE.PlaneGeometry(0.2, 0.3);
        const dropMat = new THREE.MeshBasicMaterial({
            color: 0xaabbcc,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
        });
        const drop = new THREE.Mesh(dropGeo, dropMat);
        drop.position.set(0, 0.8, 0.4);
        karenMesh.add(drop);
        this._vfx.push({ mesh: drop, material: dropMat, geometry: dropGeo, startTime: performance.now(), type: 'drop', duration: 500 });
    }

    _clearTelegraphVFX() {
        this._vfx.forEach(disposeVfxEntry);
        this._vfx = [];
    }

    _onComplete() {
        if (this.karen) {
            this.karen.updateDialogue('');
        }
        this._clearTelegraphVFX();
    }

    _onReset() {
        this._clearTelegraphVFX();
    }

    update(delta) {
        super.update(delta);

        const now = performance.now();
        this._vfx = this._vfx.filter((vfx) => {
            const elapsed = now - vfx.startTime;
            if (vfx.type === 'highlight') {
                const pulse = Math.sin(elapsed * 0.005) * 0.2 + 0.4;
                vfx.material.opacity = pulse;
                const scale = 1 + Math.sin(elapsed * 0.008) * 0.15;
                vfx.mesh.scale.set(scale, scale, scale);
                return true;
            } else if (vfx.type === 'paper') {
                const float = elapsed * 0.001 + vfx.index;
                vfx.mesh.position.y += Math.sin(float * 2) * 0.001;
                vfx.mesh.rotation.z += 0.02;
                vfx.material.opacity = Math.sin(elapsed * 0.005 + vfx.index) * 0.3 + 0.4;
                return true;
            } else if (vfx.type === 'drop' && vfx.duration) {
                const ratio = Math.max(0, 1 - elapsed / vfx.duration);
                vfx.material.opacity = ratio * 0.8;
                vfx.mesh.position.y = 0.8 - (1 - ratio) * 0.6;
                vfx.mesh.rotation.x = (1 - ratio) * 0.5;
                if (ratio <= 0) {
                    disposeVfxEntry(vfx);
                    return false;
                }
                return true;
            }
            return true;
        });
    }

    dispose() {
        super.dispose();
        this._clearTelegraphVFX();
    }
}
