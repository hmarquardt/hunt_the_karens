import * as THREE from 'three';
import { NPC } from './NPC.js';
import { KAREN_BASE } from '../config/karenTypes.js';
import { KarenStateMachine, KarenState } from '../animation/KarenStateMachine.js';
import { AnimationController } from '../animation/AnimationController.js';

export class Karen extends NPC {
    constructor(config) {
        const merged = { ...KAREN_BASE, ...config };
        super(merged);

        this.karenType = config.karenType || 'unknown';
        this.name = config.name || 'Karen';
        this.scoreValue = config.scoreValue || 100;
        this.dialogue = config.dialogue || [];
        this.hitReactions = config.hitReactions || [];
        this.aggressionRange = config.aggressionRange || 10;
        this.detectionRange = config.detectionRange || 15;
        this.dialogueInterval = config.dialogueInterval || 4000;
        this.hitStunDuration = config.hitStunDuration || 800;
        this.ragdollDuration = config.ragdollDuration || 2000;
        this.characterAssetName = config.characterAssetName || null;

        this.stateMachine = new KarenStateMachine();
        this.animController = null;
        this.dialogueTimer = 0;
        this.currentDialogue = '';
        this.patrolCenter = config.patrolCenter || new THREE.Vector3();
        this.patrolRadius = config.patrolRadius || 3;
        this.targetAngle = Math.random() * Math.PI * 2;
        this.angleChangeTimer = 0;
        this.dialogueBubble = null;

        this.perception = {
            playerDetected: false,
            playerPosition: new THREE.Vector3(),
            playerDistance: Infinity,
            detectionAngle: config.detectionAngle || Math.PI * 0.6,
            lastKnownPlayerPosition: new THREE.Vector3(),
            awarenessLevel: 0,
        };

        this.confrontation = {
            targetDistance: config.confrontationDistance || 4,
            confrontationTimer: 0,
            specialAbilityCooldown: 0,
            specialAbilityInterval: config.specialAbilityInterval || 8000,
        };

        this.onImpact = null;
        this.onRespawn = null;

        if (config.playerRef) {
            this._playerRef = config.playerRef;
        }

        this._buildKarenMesh(config);
        this._setupStateMachine();
    }

    _buildKarenMesh(config) {
        if (this.characterAssetName) {
            this._setupCharacterAsset(config);
        } else {
            this._buildPlaceholderMesh(config);
        }

        this.dialogueBubble = this._createDialogueBubble();
        if (this.mesh) {
            this.mesh.add(this.dialogueBubble);
            this.dialogueBubble.visible = false;
        }

        if (this.mesh) {
            this.mesh.userData.isKaren = true;
            this.mesh.userData.karenRef = this;
        }
    }

    _setupCharacterAsset(config) {
        this.mesh = null;
        this._pendingAsset = config.characterAssetName;
    }

    attachCharacterAsset(characterInstance, animationClips) {
        if (!this.mesh) {
            this.mesh = new THREE.Group();
        }

        while (this.mesh.children.length > 0) {
            const child = this.mesh.children[0];
            if (child === this.dialogueBubble) {
                this.mesh.remove(child);
            } else {
                this.mesh.remove(child);
            }
        }

        this.mesh.add(characterInstance);
        this.characterMesh = characterInstance;

        if (animationClips && animationClips.length > 0) {
            this.animController = new AnimationController(characterInstance, animationClips);
        }

        this.colliderHeight = this.colliderHeight || 1.6;
        this.colliderRadius = this.colliderRadius || 0.4;

        if (this.dialogueBubble) {
            this.mesh.add(this.dialogueBubble);
            this.dialogueBubble.visible = false;
        }

        this.mesh.userData.isKaren = true;
        this.mesh.userData.karenRef = this;
    }

    _buildPlaceholderMesh(config) {
        const group = this.mesh;
        if (!group) return;

        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }

        const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, this.colliderHeight * 0.55, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: config.outfitColor || 0x222222,
            roughness: 0.7,
            metalness: 0.1,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = this.colliderHeight * 0.28;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const headGeo = new THREE.SphereGeometry(0.18, 12, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 0.8,
            metalness: 0.05,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = this.colliderHeight * 0.68;
        head.castShadow = true;
        group.add(head);

        if (config.hairColor) {
            const hairGeo = new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
            const hairMat = new THREE.MeshStandardMaterial({
                color: config.hairColor,
                roughness: 0.9,
                metalness: 0.0,
            });
            const hair = new THREE.Mesh(hairGeo, hairMat);
            hair.position.y = this.colliderHeight * 0.72;
            hair.castShadow = true;
            group.add(hair);

            const bobGeo = new THREE.BoxGeometry(0.32, 0.15, 0.28);
            const bobMat = new THREE.MeshStandardMaterial({
                color: config.hairColor,
                roughness: 0.85,
                metalness: 0.0,
            });
            const bob = new THREE.Mesh(bobGeo, bobMat);
            bob.position.set(0, this.colliderHeight * 0.62, -0.05);
            bob.castShadow = true;
            group.add(bob);
        }

        this.colliderHeight = this.colliderHeight || 1.6;
        this.colliderRadius = this.colliderRadius || 0.4;
    }

    _roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _createDialogueBubble() {
        const group = new THREE.Group();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this._roundedRect(ctx, 0, 0, 256, 64, 8);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('...', 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const bubbleGeo = new THREE.PlaneGeometry(1.5, 0.375);
        const bubbleMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.y = this.colliderHeight + 0.5;
        bubble.userData.canvas = canvas;
        bubble.userData.texture = texture;
        bubble.userData.ctx = ctx;

        group.add(bubble);
        return group;
    }

    updateDialogue(text) {
        if (!this.dialogueBubble || !text) return;

        const bubble = this.dialogueBubble.children[0];
        const ctx = bubble.userData.ctx;
        const canvas = bubble.userData.canvas;
        const texture = bubble.userData.texture;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this._roundedRect(ctx, 0, 0, canvas.width, canvas.height, 8);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        texture.needsUpdate = true;
        this.dialogueBubble.visible = true;
        this.currentDialogue = text;
    }

    hideDialogue() {
        if (this.dialogueBubble) {
            this.dialogueBubble.visible = false;
        }
        this.currentDialogue = '';
    }

    _setupStateMachine() {
        this.stateMachine.transitionTo(KarenState.PATROL);

        this.stateMachine.onTransition = (from, to) => {
            this._onStateEnter(from, to);
        };
    }

    _onStateEnter(from, to) {
        if (!this.animController) return;

        switch (to) {
            case KarenState.IDLE:
                this._playAnimation('Idle', { crossfade: 0.3 });
                break;
            case KarenState.PATROL:
                this._playAnimation('Walking', { crossfade: 0.3 });
                break;
            case KarenState.ALERT:
                this._playAnimation('Idle', { crossfade: 0.15 });
                this.updateDialogue(this.dialogue.length > 0 ? this.dialogue[Math.floor(Math.random() * this.dialogue.length)] : 'Hey!');
                break;
            case KarenState.CONFRONT:
                this._playAnimation('Walking', { crossfade: 0.2, timeScale: 0.8 });
                break;
            case KarenState.REACT:
                this._playAnimation('Punch', { crossfade: 0.1, clampWhenFinished: true });
                break;
            case KarenState.STUNNED:
                this._playAnimation('Death', { crossfade: 0.2, clampWhenFinished: true, timeScale: 0.5 });
                break;
            case KarenState.DEFEATED:
                this._playAnimation('Death', { crossfade: 0.1, clampWhenFinished: true });
                this.updateDialogue("I'LL SUE!!!");
                break;
            case KarenState.SPECIAL:
                this._playAnimation('ThumbsUp', { crossfade: 0.2, clampWhenFinished: true });
                break;
            case KarenState.RESPAWNING:
                break;
        }
    }

    _playAnimation(name, options) {
        if (!this.animController) return;
        const available = this.animController.getAvailableAnimations();
        if (available.includes(name)) {
            this.animController.play(name, options);
        }
    }

    setPlayerRef(playerRef) {
        this._playerRef = playerRef;
    }

    updatePerception(delta, playerPosition) {
        if (!playerPosition) return;

        const toPlayer = new THREE.Vector3().subVectors(playerPosition, this.position);
        toPlayer.y = 0;
        const distance = toPlayer.length();

        this.perception.playerPosition.copy(playerPosition);
        this.perception.playerDistance = distance;

        const inRange = distance <= this.detectionRange;

        if (inRange) {
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            forward.y = 0;
            forward.normalize();

            const toPlayerDir = toPlayer.clone().normalize();
            const dot = forward.dot(toPlayerDir);
            const angleThreshold = Math.cos(this.perception.detectionAngle / 2);

            this.perception.playerDetected = dot > angleThreshold;

            if (this.perception.playerDetected) {
                this.perception.lastKnownPlayerPosition.copy(playerPosition);
                this.perception.awarenessLevel = Math.min(1, this.perception.awarenessLevel + delta * 0.5);
            }
        } else {
            this.perception.playerDetected = false;
            this.perception.awarenessLevel = Math.max(0, this.perception.awarenessLevel - delta * 0.3);
        }
    }

    takeDamage(amount, source) {
        if (!this.isAlive) {
            if (this.stateMachine.is(KarenState.RESPAWNING)) return 0;
        }

        const remaining = super.takeDamage(amount, source);

        if (this.isAlive) {
            this.stateMachine.transitionTo(KarenState.REACT);

            setTimeout(() => {
                if (this.isAlive && this.stateMachine.is(KarenState.REACT)) {
                    this.stateMachine.transitionTo(KarenState.ALERT);
                }
            }, 800);
        }

        return remaining;
    }

    onDefeated(source) {
        super.onDefeated(source);
        this.stateMachine.transitionTo(KarenState.DEFEATED);

        if (this.mesh) {
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.visible = false;
                }
            }, this.ragdollDuration * 0.7);
        }
    }

    onSpecialAbility() {
        this.stateMachine.transitionTo(KarenState.SPECIAL);

        setTimeout(() => {
            if (this.stateMachine.is(KarenState.SPECIAL)) {
                if (this.perception.playerDetected) {
                    this.stateMachine.transitionTo(KarenState.CONFRONT);
                } else {
                    this.stateMachine.transitionTo(KarenState.PATROL);
                }
            }
        }, 2000);
    }

    update(delta) {
        this.stateMachine.update(delta);

        if (!this.isAlive) {
            if (this.animController) this.animController.update(delta);
            return;
        }

        if (this.animController) this.animController.update(delta);

        if (this.stateMachine.is(KarenState.STUNNED)) {
            return;
        }

        if (this.stateMachine.is(KarenState.REACT) || this.stateMachine.is(KarenState.SPECIAL)) {
            return;
        }

        if (this.stateMachine.is(KarenState.DEFEATED) || this.stateMachine.is(KarenState.RESPAWNING)) {
            return;
        }

        this.dialogueTimer += delta * 1000;

        switch (this.stateMachine.currentState) {
            case KarenState.IDLE:
                this._updateIdle(delta);
                break;
            case KarenState.PATROL:
                this._updatePatrol(delta);
                this._checkDetection();
                break;
            case KarenState.ALERT:
                this._updateAlert(delta);
                break;
            case KarenState.CONFRONT:
                this._updateConfront(delta);
                break;
        }

        this._updateDialogue(delta);

        this._updateDialogueBubble(delta);
    }

    _updateIdle(delta) {
        this.angleChangeTimer -= delta;
        if (this.angleChangeTimer <= 0) {
            this.angleChangeTimer = 3 + Math.random() * 4;
        }
        this._checkDetection();
    }

    _updatePatrol(delta) {
        this.angleChangeTimer -= delta;
        if (this.angleChangeTimer <= 0) {
            this.targetAngle = Math.random() * Math.PI * 2;
            this.angleChangeTimer = 2 + Math.random() * 3;
        }

        const targetX = this.patrolCenter.x + Math.cos(this.targetAngle) * this.patrolRadius;
        const targetZ = this.patrolCenter.z + Math.sin(this.targetAngle) * this.patrolRadius;

        const dir = new THREE.Vector3(targetX - this.position.x, 0, targetZ - this.position.z);
        const dist = dir.length();

        if (dist > 0.5) {
            dir.normalize();
            this.position.x += dir.x * this.speed * delta;
            this.position.z += dir.z * this.speed * delta;

            const angle = Math.atan2(dir.x, dir.z);
            if (this.mesh) {
                this.mesh.rotation.y = angle;
            }
        } else {
            this.stateMachine.transitionTo(KarenState.IDLE);
        }

        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    _checkDetection() {
        if (!this.perception.playerDetected) return;

        if (this.perception.playerDistance <= this.aggressionRange) {
            this.stateMachine.transitionTo(KarenState.CONFRONT);
        } else if (this.perception.playerDistance <= this.detectionRange) {
            this.stateMachine.transitionTo(KarenState.ALERT);
        }
    }

    _updateAlert(delta) {
        if (this.perception.playerDetected && this.perception.playerDistance <= this.aggressionRange) {
            this.stateMachine.transitionTo(KarenState.CONFRONT);
            return;
        }

        if (!this.perception.playerDetected) {
            this.stateMachine.transitionTo(KarenState.PATROL);
            return;
        }

        if (this.mesh && this.perception.playerDistance < this.detectionRange) {
            const toPlayer = new THREE.Vector3().subVectors(
                this.perception.playerPosition,
                this.position
            );
            toPlayer.y = 0;
            if (toPlayer.length() > 0.1) {
                const angle = Math.atan2(toPlayer.x, toPlayer.z);
                this.mesh.rotation.y = angle;
            }
        }
    }

    _updateConfront(delta) {
        this.confrontation.confrontationTimer += delta * 1000;

        if (!this.perception.playerDetected || this.perception.playerDistance > this.detectionRange * 1.2) {
            this.confrontation.confrontationTimer = 0;
            this.stateMachine.transitionTo(KarenState.PATROL);
            return;
        }

        const dist = this.perception.playerDistance;

        if (dist > this.confrontation.targetDistance) {
            const dir = new THREE.Vector3().subVectors(
                this.perception.playerPosition,
                this.position
            );
            dir.y = 0;
            if (dir.length() > 0.1) {
                dir.normalize();
                this.position.x += dir.x * this.speed * delta * 0.8;
                this.position.z += dir.z * this.speed * delta * 0.8;

                const angle = Math.atan2(dir.x, dir.z);
                if (this.mesh) {
                    this.mesh.rotation.y = angle;
                }
            }
        } else {
            if (this.mesh) {
                const toPlayer = new THREE.Vector3().subVectors(
                    this.perception.playerPosition,
                    this.position
                );
                toPlayer.y = 0;
                if (toPlayer.length() > 0.1) {
                    const angle = Math.atan2(toPlayer.x, toPlayer.z);
                    this.mesh.rotation.y = angle;
                }
            }
        }

        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }

        this.confrontation.specialAbilityCooldown -= delta * 1000;
        if (this.confrontation.specialAbilityCooldown <= 0) {
            this.confrontation.specialAbilityCooldown = this.confrontation.specialAbilityInterval;
            this.onSpecialAbility();
        }
    }

    _updateDialogue(delta) {
        if (!this.isAlive) return;
        if (this.dialogueTimer >= this.dialogueInterval && this.dialogue.length > 0) {
            this.dialogueTimer = 0;
            const idx = Math.floor(Math.random() * this.dialogue.length);
            this.updateDialogue(this.dialogue[idx]);

            setTimeout(() => {
                this.hideDialogue();
            }, 2500);
        }
    }

    _updateDialogueBubble(delta) {
        if (this.dialogueBubble && this.dialogueBubble.visible) {
            const worldPos = new THREE.Vector3();
            if (this.characterMesh) {
                worldPos.setFromMatrixPosition(this.characterMesh.matrixWorld);
                worldPos.y += this.colliderHeight * 0.8;
            } else {
                worldPos.copy(this.position);
                worldPos.y += this.colliderHeight + 0.5;
            }

            this.dialogueBubble.position.copy(worldPos);
            this.dialogueBubble.position.y += 0.5;

            const cameraPos = new THREE.Vector3();
            if (this._playerRef) {
                cameraPos.copy(this._playerRef.position);
            }
            this.dialogueBubble.lookAt(cameraPos.x, this.dialogueBubble.position.y, cameraPos.z);
        }
    }

    getBounds() {
        return {
            center: this.position.clone(),
            radius: this.colliderRadius,
            height: this.colliderHeight,
        };
    }
}
