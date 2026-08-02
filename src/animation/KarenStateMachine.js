export const KarenState = {
    IDLE: 'idle',
    PATROL: 'patrol',
    ALERT: 'alert',
    CONFRONT: 'confront',
    REACT: 'react',
    STUNNED: 'stunned',
    DEFEATED: 'defeated',
    RESPAWNING: 'respawning',
    SPECIAL: 'special',
};

export class KarenStateMachine {
    constructor() {
        this.currentState = KarenState.IDLE;
        this.previousState = null;
        this.stateTime = 0;
        this.transitions = new Map();
        this._onTransition = null;
    }

    set onTransition(fn) {
        this._onTransition = fn;
    }

    transitionTo(newState) {
        if (newState === this.currentState) return;

        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateTime = 0;

        if (this._onTransition) {
            this._onTransition(this.previousState, newState);
        }
    }

    is(state) {
        return this.currentState === state;
    }

    isAny(...states) {
        return states.includes(this.currentState);
    }

    update(delta) {
        this.stateTime += delta;
    }

    canTransition(fromStates) {
        return fromStates.includes(this.currentState);
    }
}
