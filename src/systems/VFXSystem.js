import * as THREE from 'three';

class ImpactEffect {
    constructor() {
        this.active = false;
        this.lifetime = 0;
        this.age = 0;
        this.mesh = null;
        this.ringMesh = null;
        this.scoreText = null;
    }

    spawn(scene, position, score, points) {
        this.active = true;
        this.age = 0;
        this.lifetime = 1.0;
        this.position = position.clone();

        this._createImpactBurst(scene, position);
        this._createImpactRing(scene, position);
        this._createScoreText(scene, position, score, points);
    }

    _createImpactBurst(scene, position) {
        const count = 8;
        const particles = [];

        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.04, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xfeca57,
                transparent: true,
                opacity: 1,
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);

            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5 + 0.5,
                (Math.random() - 0.5) * 2
            ).normalize();

            particle.userData.velocity = direction.multiplyScalar(2 + Math.random() * 2);
            particle.userData.life = 0.5 + Math.random() * 0.3;
            particles.push(particle);
            scene.add(particle);
        }

        this.particles = particles;
    }

    _createImpactRing(scene, position) {
        const geo = new THREE.RingGeometry(0.1, 0.15, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
        });
        this.ringMesh = new THREE.Mesh(geo, mat);
        this.ringMesh.position.copy(position);
        this.ringMesh.position.y += 0.5;
        this.ringMesh.lookAt(position.clone().add(new THREE.Vector3(0, 1, 0)));
        scene.add(this.ringMesh);
    }

    _createScoreText(scene, position, score, points) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#feca57';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${points}`, 64, 24);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const geo = new THREE.PlaneGeometry(0.8, 0.3);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.scoreText = new THREE.Mesh(geo, mat);
        this.scoreText.position.copy(position);
        this.scoreText.position.y += 1.2;
        scene.add(this.scoreText);
    }

    update(delta) {
        if (!this.active) return;

        this.age += delta;

        if (this.age >= this.lifetime) {
            this.deactivate();
            return;
        }

        const t = this.age / this.lifetime;

        if (this.particles) {
            for (const p of this.particles) {
                p.position.addScaledVector(p.userData.velocity, delta);
                p.userData.velocity.y -= 5 * delta;
                const particleLife = p.userData.life;
                const particleT = this.age / particleLife;
                p.material.opacity = Math.max(0, 1 - particleT);
                if (this.age >= particleLife) {
                    p.visible = false;
                }
            }
        }

        if (this.ringMesh) {
            const ringScale = 1 + t * 4;
            this.ringMesh.scale.set(ringScale, ringScale, ringScale);
            this.ringMesh.material.opacity = Math.max(0, 0.8 * (1 - t));
        }

        if (this.scoreText) {
            this.scoreText.position.y += delta * 1.5;
            this.scoreText.material.opacity = Math.max(0, 1 - t);
        }
    }

    deactivate() {
        this.active = false;

        if (this.particles) {
            for (const p of this.particles) {
                if (p.parent) p.parent.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            }
            this.particles = null;
        }

        if (this.ringMesh) {
            if (this.ringMesh.parent) this.ringMesh.parent.remove(this.ringMesh);
            this.ringMesh.geometry.dispose();
            this.ringMesh.material.dispose();
            this.ringMesh = null;
        }

        if (this.scoreText) {
            if (this.scoreText.parent) this.scoreText.parent.remove(this.scoreText);
            this.scoreText.geometry.dispose();
            this.scoreText.material.dispose();
            this.scoreText = null;
        }
    }
}

export class VFXSystem {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this._poolSize = 20;
        this._initPool();
    }

    _initPool() {
        for (let i = 0; i < this._poolSize; i++) {
            this.pool.push(new ImpactEffect());
        }
    }

    spawnImpact(position, score, points) {
        let effect = this.pool.find(e => !e.active);
        if (!effect) {
            effect = new ImpactEffect();
            this.pool.push(effect);
        }

        effect.spawn(this.scene, position, score, points);
        this.active.push(effect);
        return effect;
    }

    update(delta) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const e = this.active[i];
            e.update(delta);

            if (!e.active) {
                this.active.splice(i, 1);
            }
        }
    }

    clear() {
        for (const e of this.active) {
            e.deactivate();
        }
        this.active = [];
    }

    getActiveCount() {
        return this.active.length;
    }
}
