import * as THREE from 'three';

export class DialogueController {
    constructor(colliderHeight) {
        this.colliderHeight = colliderHeight || 1.6;
        this.currentDialogue = '';
        this.dialogueBubble = null;
        this._bubbleRef = null;
        this._hideTimeout = null;

        this._buildDialogueBubble();
    }

    _buildDialogueBubble() {
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
        group.visible = false;

        this.dialogueBubble = group;
        this._bubbleRef = bubble;
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

    show(text, duration) {
        if (!this.dialogueBubble) return;

        const ctx = this._bubbleRef.userData.ctx;
        const canvas = this._bubbleRef.userData.canvas;
        const texture = this._bubbleRef.userData.texture;

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

        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }

        this._hideTimeout = setTimeout(() => {
            this.hide();
        }, duration || 2500);
    }

    hide() {
        if (this.dialogueBubble) {
            this.dialogueBubble.visible = false;
        }
        this.currentDialogue = '';
    }

    updatePosition(position, cameraPos, characterMesh) {
        if (!this.dialogueBubble || !this.dialogueBubble.visible) return;

        const worldPos = new THREE.Vector3();
        if (characterMesh) {
            worldPos.setFromMatrixPosition(characterMesh.matrixWorld);
            worldPos.y += this.colliderHeight * 0.8;
        } else {
            worldPos.copy(position);
            worldPos.y += this.colliderHeight + 0.5;
        }

        this.dialogueBubble.position.copy(worldPos);
        this.dialogueBubble.position.y += 0.5;

        if (cameraPos) {
            this.dialogueBubble.lookAt(cameraPos.x, this.dialogueBubble.position.y, cameraPos.z);
        }
    }

    attachTo(mesh) {
        mesh.add(this.dialogueBubble);
    }

    dispose() {
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }
        if (this.dialogueBubble && this.dialogueBubble.parent) {
            this.dialogueBubble.parent.remove(this.dialogueBubble);
        }
    }
}
