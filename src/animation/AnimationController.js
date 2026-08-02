import * as THREE from 'three';

const DEFAULT_CROSSFADE_DURATION = 0.2;

export class AnimationController {
    constructor(mesh, clips) {
        this.mesh = mesh;
        this.mixer = new THREE.AnimationMixer(mesh);
        this.actions = new Map();
        this.currentAction = null;
        this.currentClipName = null;
        this._clips = clips || [];
        this._crossfadeDuration = DEFAULT_CROSSFADE_DURATION;

        this._buildActions();
    }

    _buildActions() {
        for (const clip of this._clips) {
            const name = clip.name.trim();
            const action = this.mixer.clipAction(clip);
            action.enabled = false;
            this.actions.set(name, action);
        }
    }

    play(name, options = {}) {
        const action = this.actions.get(name);
        if (!action) {
            console.warn(`[AnimationController] Unknown animation: ${name}`);
            return null;
        }

        const crossfade = options.crossfade !== undefined ? options.crossfade : this._crossfadeDuration;
        const loop = options.loop !== undefined ? options.loop : THREE.LoopRepeat;
        const clampWhenFinished = options.clampWhenFinished !== undefined ? options.clampWhenFinished : false;
        const timeScale = options.timeScale !== undefined ? options.timeScale : 1.0;

        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(crossfade);
        }

        action.reset();
        action.setLoop(loop, 1);
        action.clampWhenFinished = clampWhenFinished;
        action.enabled = true;
        action.timeScale = timeScale;
        action.fadeIn(crossfade);
        action.play();

        this.currentAction = action;
        this.currentClipName = name;

        return action;
    }

    stop(name) {
        const action = this.actions.get(name);
        if (action) {
            action.fadeOut(0.1);
        }
        if (this.currentClipName === name) {
            this.currentAction = null;
            this.currentClipName = null;
        }
    }

    stopAll() {
        for (const [, action] of this.actions) {
            action.fadeOut(0.05);
        }
        this.currentAction = null;
        this.currentClipName = null;
    }

    setCrossfadeDuration(duration) {
        this._crossfadeDuration = duration;
    }

    setTimeScale(scale) {
        if (this.currentAction) {
            this.currentAction.timeScale = scale;
        }
    }

    update(delta) {
        if (delta > 0) {
            this.mixer.update(delta);
        }
    }

    getAvailableAnimations() {
        return Array.from(this.actions.keys());
    }

    getCurrentAnimation() {
        return this.currentClipName;
    }

    dispose() {
        this.stopAll();
        this.mixer.stopAllAction();
        this.actions.clear();
    }
}
