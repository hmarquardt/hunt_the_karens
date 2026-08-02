import * as CONSTANTS from '../config/constants.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        this.mouseDown = false;
        this.mouseButton = -1;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    init() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    dispose() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    isKey(key) {
        return !!this.keys[key.toLowerCase()];
    }

    consumeMouseMovement() {
        const movement = { ...this.mouseMovement };
        this.mouseMovement.x = 0;
        this.mouseMovement.y = 0;
        return movement;
    }

    consumeMouseClick() {
        if (this.mouseDown) {
            this.mouseDown = false;
            return this.mouseButton;
        }
        return -1;
    }

    _onKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
    }

    _onKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }

    _onMouseMove(e) {
        this.mouseMovement.x += e.movementX || 0;
        this.mouseMovement.y += e.movementY || 0;
    }

    _onMouseDown(e) {
        if (e.button === 0) {
            this.mouseDown = true;
            this.mouseButton = e.button;
        }
    }

    _onMouseUp(e) {
        this.mouseDown = false;
    }
}
