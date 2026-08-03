import * as THREE from 'three';
import { NPC } from './NPC.js';
import { KAREN_TYPES } from '../config/karenTypes.js';
import { KarenStateMachine, KarenState } from '../animation/KarenStateMachine.js';
import { DialogueController } from './components/DialogueController.js';
import { KarenPerception } from './components/KarenPerception.js';
import { StatusEffectController } from './components/StatusEffectController.js';
import { ProceduralHuman } from '../visual/ProceduralHuman.js';
import { buildKarenBob, buildKarenPlatinumBob, buildKarenBrunetteBob, buildKarenAuburnBob } from '../visual/KarenHair.js';

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

        this.stateMachine = new KarenStateMachine();
        this.dialogueTimer = 0;
        this.patrolCenter = config.patrolCenter || new THREE.Vector3();
        this.patrolRadius = config.patrolRadius || 3;
        this.targetAngle = Math.random() * Math.PI * 2;
        this.angleChangeTimer = 0;

        this.perception = new KarenPerception({
            detectionRange: config.detectionRange || 15,
            detectionAngle: config.detectionAngle || Math.PI * 0.6,
            aggressionRange: config.aggressionRange || 10,
        });

        this.dialogueController = new DialogueController(this.colliderHeight);
        this.statusEffects = new StatusEffectController();

        this.abilities = [];
        this.abilityContext = null;
        this.abilityTryCooldown = 0;
        this.abilityTryInterval = 8;

        this.confrontation = {
            targetDistance: config.confrontationDistance || 4,
            confrontationTimer: 0,
        };

        this.onImpact = null;
        this.onRespawn = null;
        this._spawnDefinition = null;

        this.reactionRemaining = 0;
        this.defeatVisibilityRemaining = 0;

        this.proceduralAnimationState = 'idle';
        this.proceduralAnimTimer = 0;

        if (config.playerRef) {
            this._playerRef = config.playerRef;
        }

        this._buildVisual(config);
        this._setupStateMachine();
    }

    get currentDialogue() {
        return this.dialogueController?.currentDialogue || '';
    }

    getEffectiveSpeed() {
        const speedMult = this.statusEffects.getModifierValue('speedMultiplier', 1);
        return this.speed * speedMult;
    }

    _buildVisual(config) {
        const visualConfig = config.visual || {};

        this.proceduralHuman = new ProceduralHuman({
            bodyType: visualConfig.bodyType || 'average',
            skinTone: visualConfig.skinTone || 0xd4a574,
            outfitColor: visualConfig.outfitColor || 0x333333,
            shoeColor: visualConfig.shoeColor || 0x222222,
            hairColor: visualConfig.hairColor || 0xc8a864,
        });

        this.mesh = this.proceduralHuman.getGroup();
        this.mesh.position.copy(this.position);

        this._buildHair(visualConfig);

        if (this.dialogueController) {
            this.dialogueController.attachTo(this.mesh);
        }

        this.mesh.userData.isKaren = true;
        this.mesh.userData.karenRef = this;
    }

    _buildHair(visualConfig) {
        const hairStyle = visualConfig.hairStyle || 'bob';
        const hairBuilder = this._getHairBuilder(hairStyle);
        if (hairBuilder) {
            this.buildHair(hairBuilder);
        }
    }

    _getHairBuilder(style) {
        switch (style) {
            case 'platinumBob':
                return buildKarenPlatinumBob;
            case 'brunetteBob':
                return buildKarenBrunetteBob;
            case 'auburnBob':
                return buildKarenAuburnBob;
            case 'asymmetricBob':
            default:
                return buildKarenBob;
        }
    }

    addAccessory(name, mesh, parentBone) {
        if (this.proceduralHuman) {
            this.proceduralHuman.addAccessory(name, mesh, parentBone);
        }
    }

    getAttachmentPoint(name) {
        if (this.proceduralHuman) {
            return this.proceduralHuman.getBone(name);
        }
        return null;
    }

    dispose() {
        if (this.proceduralHuman) {
            this.proceduralHuman.dispose();
        }
        this.disposeAbilities();
        super.dispose?.();
    }

    updateDialogue(text) {
        if (this.dialogueController) {
            this.dialogueController.show(text);
        }
    }

    hideDialogue() {
        if (this.dialogueController) {
            this.dialogueController.hide();
        }
    }

    _setupStateMachine() {
        this.stateMachine.transitionTo(KarenState.PATROL);

        this.stateMachine.onTransition = (from, to) => {
            this._onStateEnter(from, to);
        };
    }

    _onStateEnter(from, to) {
        this.proceduralAnimationState = this._stateToAnimation(to);
        this.proceduralAnimTimer = 0;

        if (to === KarenState.ALERT) {
            if (this.dialogue.length > 0) {
                this.updateDialogue(this.dialogue[Math.floor(Math.random() * this.dialogue.length)]);
            } else {
                this.updateDialogue('Hey!');
            }
        }

        if (to === KarenState.DEFEATED) {
            this.updateDialogue("I'LL SUE!!!");
        }
    }

    _stateToAnimation(state) {
        switch (state) {
            case KarenState.IDLE:
                return 'idle';
            case KarenState.PATROL:
                return 'walk';
            case KarenState.ALERT:
                return 'confront';
            case KarenState.CONFRONT:
                return 'confront';
            case KarenState.REACT:
                return 'hit';
            case KarenState.STUNNED:
                return 'hit';
            case KarenState.DEFEATED:
                return 'defeat';
            case KarenState.SPECIAL:
                return 'ability';
            case KarenState.RESPAWNING:
                return 'idle';
            default:
                return 'idle';
        }
    }

    _playAnimation(name, options) {
        // Legacy method kept for compatibility; now driven by proceduralAnimationState
        this.proceduralAnimationState = name.toLowerCase();
        this.proceduralAnimTimer = 0;
    }

    _updateProceduralAnimation(delta) {
        if (!this.proceduralHuman) return;

        this.proceduralAnimTimer += delta;

        const isMoving = this.stateMachine.is(KarenState.PATROL) || this.stateMachine.is(KarenState.CONFRONT);
        const speed = isMoving ? this.getEffectiveSpeed() : 0;

        this.proceduralHuman.animate(this.proceduralAnimationState, this.proceduralAnimTimer, {
            isMoving,
            speed,
            isAlive: this.isAlive,
            hpRatio: this.currentHp / this.maxHp,
        });
    }

    setPlayerRef(playerRef) {
        this._playerRef = playerRef;
    }

    updatePerception(delta, playerPosition) {
        if (!playerPosition) return;
        const karenPos = this.position;
        const karenQuat = this.mesh?.quaternion || new THREE.Quaternion();
        this.perception.update(karenPos, karenQuat, playerPosition);
    }

    takeDamage(amount, source) {
        if (!this.isAlive) {
            if (this.stateMachine.is(KarenState.RESPAWNING)) return 0;
        }

        const remaining = super.takeDamage(amount, source);

        if (this.isAlive) {
            this.stateMachine.transitionTo(KarenState.REACT);
            this.reactionRemaining = 0.8;
        }

        return remaining;
    }

    onDefeated(source) {
        super.onDefeated(source);
        this.stateMachine.transitionTo(KarenState.DEFEATED);
        this.defeatVisibilityRemaining = this.ragdollDuration * 0.001 * 0.7;
    }

    update(delta) {
        this.stateMachine.update(delta);
        this.statusEffects.update(delta);

        if (this.reactionRemaining > 0) {
            this.reactionRemaining -= delta;
            if (this.reactionRemaining <= 0 && this.isAlive && this.stateMachine.is(KarenState.REACT)) {
                this.stateMachine.transitionTo(KarenState.ALERT);
            }
        }

        if (this.defeatVisibilityRemaining > 0) {
            this.defeatVisibilityRemaining -= delta;
            if (this.defeatVisibilityRemaining <= 0 && this.mesh) {
                this.mesh.visible = false;
            }
        }

        const hasActiveAbility = this._updateAbilitiesState(delta);
        if (hasActiveAbility && this.stateMachine.is(KarenState.SPECIAL)) {
            this._updateProceduralAnimation(delta);
            return;
        }

        if (!this.isAlive) {
            this._updateProceduralAnimation(delta);
            return;
        }

        this._updateProceduralAnimation(delta);

        if (this.stateMachine.is(KarenState.STUNNED)) {
            return;
        }

        if (this.stateMachine.is(KarenState.REACT)) {
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
            const effectiveSpeed = this.getEffectiveSpeed();
            this.position.x += dir.x * effectiveSpeed * delta;
            this.position.z += dir.z * effectiveSpeed * delta;

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
        if (this.perception.shouldConfront()) {
            this.stateMachine.transitionTo(KarenState.CONFRONT);
        } else if (this.perception.shouldAlert()) {
            this.stateMachine.transitionTo(KarenState.ALERT);
        }
    }

    _updateAlert(delta) {
        if (this.perception.shouldConfront()) {
            this.stateMachine.transitionTo(KarenState.CONFRONT);
            return;
        }

        if (!this.perception.shouldAlert()) {
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

        if (this.perception.shouldDisengage()) {
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
                const effectiveSpeed = this.getEffectiveSpeed();
                this.position.x += dir.x * effectiveSpeed * delta * 0.8;
                this.position.z += dir.z * effectiveSpeed * delta * 0.8;

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

        this.abilityTryCooldown -= delta;
        if (this.abilityTryCooldown <= 0 && this.abilities.length > 0) {
            this.abilityTryCooldown = this.abilityTryInterval;
            this._tryUseAbility();
        }
    }

    _updateDialogue(delta) {
        if (!this.isAlive) return;
        if (this.dialogueTimer >= this.dialogueInterval && this.dialogue.length > 0) {
            this.dialogueTimer = 0;
            const idx = Math.floor(Math.random() * this.dialogue.length);
            this.updateDialogue(this.dialogue[idx]);
        }
    }

    _updateDialogueBubble(delta) {
        if (!this.dialogueController) return;

        const cameraPos = this._playerRef?.position || null;
        this.dialogueController.updatePosition(this.position, cameraPos, this.characterMesh);
    }

    getBounds() {
        return {
            center: this.position.clone(),
            radius: this.colliderRadius,
            height: this.colliderHeight,
        };
    }

    addAbility(ability) {
        ability.karen = this;
        this.abilities.push(ability);
    }

    setAbilityContext(context) {
        this.abilityContext = context;
        for (const ability of this.abilities) {
            ability.setContext?.(this, context);
        }
    }

    updateAbilities(delta) {
        for (const ability of this.abilities) {
            ability.update(delta);
        }
    }

    _updateAbilitiesState(delta) {
        for (const ability of this.abilities) {
            if (ability.state === 'telegraphing' || ability.state === 'executing') {
                if (!this.stateMachine.is(KarenState.SPECIAL)) {
                    this.stateMachine.transitionTo(KarenState.SPECIAL);
                }
                return true;
            }
        }

        if (this.stateMachine.is(KarenState.SPECIAL)) {
            for (const ability of this.abilities) {
                if (ability.state !== 'ready') return true;
            }
            if (this.perception.playerDetected) {
                this.stateMachine.transitionTo(KarenState.CONFRONT);
            } else {
                this.stateMachine.transitionTo(KarenState.PATROL);
            }
        }
        return false;
    }

    _tryUseAbility() {
        if (!this.isAlive || this.stateMachine.is(KarenState.STUNNED)) return;
        if (this.stateMachine.is(KarenState.DEFEATED) || this.stateMachine.is(KarenState.RESPAWNING)) return;

        for (const ability of this.abilities) {
            if (ability.canUse()) {
                ability.use();
                return true;
            }
        }
        return false;
    }

    resetAbilities() {
        for (const ability of this.abilities) {
            ability.reset();
        }
        this.abilityTryCooldown = 0;
    }

    disposeAbilities() {
        for (const ability of this.abilities) {
            ability.dispose();
        }
        this.abilities = [];
    }

    resetForRespawn() {
        this.statusEffects.clear();
        this.reactionRemaining = 0;
        this.defeatVisibilityRemaining = 0;
        this.dialogueTimer = 0;
        this.angleChangeTimer = 0;
        this.abilityTryCooldown = 0;
        if (this.mesh) {
            this.mesh.visible = true;
        }
        this.resetAbilities();
    }
}
