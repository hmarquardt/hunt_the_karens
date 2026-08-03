import * as THREE from 'three';

export class ShoppingCart {
    constructor(materials) {
        this.materials = materials;
        this._metalMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.4,
            metalness: 0.8,
        });
        this._handleMat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            roughness: 0.6,
            metalness: 0.3,
        });
        this._wheelMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.1,
        });
    }

    create() {
        const group = new THREE.Group();

        // Basket (simplified wire basket as solid shape)
        const basket = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.4, 0.7),
            new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                roughness: 0.5,
                metalness: 0.7,
                transparent: true,
                opacity: 0.6,
            })
        );
        basket.position.set(0, 0.7, 0.15);
        basket.castShadow = true;
        group.add(basket);

        // Basket rim
        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.03, 0.75),
            this._metalMat
        );
        rim.position.set(0, 0.92, 0.15);
        group.add(rim);

        // Lower rack
        const lowerRack = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.02, 0.55),
            this._metalMat
        );
        lowerRack.position.set(0, 0.35, 0.15);
        group.add(lowerRack);

        // Handle bar
        const handleBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6),
            this._metalMat
        );
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(0, 0.95, -0.25);
        group.add(handleBar);

        // Handle grip
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.04, 0.04),
            this._handleMat
        );
        grip.position.set(0, 0.95, -0.25);
        group.add(grip);

        // Handle supports
        for (const side of [-1, 1]) {
            const support = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6),
                this._metalMat
            );
            support.position.set(side * 0.28, 0.83, -0.15);
            support.rotation.x = 0.3;
            group.add(support);
        }

        // Wheels
        for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.55], [0.25, 0.55]]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8),
                this._wheelMat
            );
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(x, 0.04, z);
            group.add(wheel);

            // Wheel fork
            const fork = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6),
                this._metalMat
            );
            fork.position.set(x, 0.1, z);
            group.add(fork);
        }

        // Vertical supports
        for (const [x, z] of [[-0.28, -0.2], [0.28, -0.2], [-0.28, 0.5], [0.28, 0.5]]) {
            const support = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.85, 6),
                this._metalMat
            );
            support.position.set(x, 0.48, z);
            group.add(support);
        }

        return group;
    }

    dispose() {
        this._metalMat.dispose();
        this._handleMat.dispose();
        this._wheelMat.dispose();
    }
}

export class CartReturn {
    constructor(materials, cartFactory) {
        this.materials = materials;
        this.cartFactory = cartFactory;
        this.group = new THREE.Group();
        this.group.name = 'cartReturn';
        this._build();
    }

    _build() {
        const metalMat = this.materials.get('metalGalvanized');
        const signMat = this.materials.get('metalDark');

        // Base rails (U-shape)
        const railLength = 2.5;
        const railHeight = 0.9;

        // Left rail
        const leftRail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, railLength, 6),
            metalMat
        );
        leftRail.rotation.z = Math.PI / 2;
        leftRail.position.set(-0.5, railHeight, 0);
        leftRail.castShadow = true;
        this.group.add(leftRail);

        // Right rail
        const rightRail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, railLength, 6),
            metalMat
        );
        rightRail.rotation.z = Math.PI / 2;
        rightRail.position.set(0.5, railHeight, 0);
        rightRail.castShadow = true;
        this.group.add(rightRail);

        // Front cross bar
        const frontBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 1, 6),
            metalMat
        );
        frontBar.position.set(0, railHeight, -railLength / 2);
        this.group.add(frontBar);

        // Back cross bar
        const backBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 1, 6),
            metalMat
        );
        backBar.position.set(0, railHeight, railLength / 2);
        this.group.add(backBar);

        // Vertical posts
        for (const [x, z] of [[-0.5, -railLength / 2], [0.5, -railLength / 2], [-0.5, railLength / 2], [0.5, railLength / 2]]) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, railHeight, 6),
                metalMat
            );
            post.position.set(x, railHeight / 2, z);
            post.castShadow = true;
            this.group.add(post);
        }

        // Sign post
        const signPost = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6),
            metalMat
        );
        signPost.position.set(0, 1.1, 0);
        signPost.castShadow = true;
        this.group.add(signPost);

        // Sign
        const signTexture = createCartSignTexture();
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.8),
            new THREE.MeshStandardMaterial({
                map: signTexture,
                side: THREE.DoubleSide,
            })
        );
        sign.position.set(0, 1.8, 0);
        this.group.add(sign);

        // Small roof/canopy
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.05, 0.8),
            signMat
        );
        roof.position.set(0, 2.2, 0);
        roof.castShadow = true;
        this.group.add(roof);

        // Roof support
        const roofSupport = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6),
            metalMat
        );
        roofSupport.position.set(0, 2, 0);
        this.group.add(roofSupport);

        // Parked carts inside
        for (let i = 0; i < 2; i++) {
            const cart = this.cartFactory.create();
            cart.position.set(-0.1 + i * 0.2, 0, -0.3 + i * 0.6);
            cart.rotation.y = 0.05;
            this.group.add(cart);
        }
    }

    getGroup() {
        return this.group;
    }

    getCollisionMeshes() {
        return this.group.children.filter(c => c.isMesh && c.geometry?.parameters?.radius > 0.02);
    }
}

function createCartSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 320);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 312);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLEASE RETURN', 128, 80);
    ctx.fillText('CARTS', 128, 120);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('YES, THIS MEANS YOU', 128, 200);

    // Cart icon
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 240, 96, 50);
    ctx.beginPath();
    ctx.moveTo(80, 255);
    ctx.lineTo(176, 255);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(100, 280, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(156, 280, 8, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
