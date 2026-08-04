import * as THREE from 'three';
import { createSignTexture } from './EnvironmentTextures.js';

export class MegaMartStore {
    constructor(materials, resourceTracker) {
        this.materials = materials;
        this.tracker = resourceTracker;
        this.group = new THREE.Group();
        this.group.name = 'megaMartStore';
    }

    build(sceneManager) {
        this._build(sceneManager);
    }

    _build(sceneManager) {
        this._buildMainWall();
        this._buildParapet();
        this._buildEntranceProjection();
        this._buildGlassVestibule();
        this._buildVestibuleBarrier();
        this._buildAutomaticDoors();
        this._buildWindowPanels();
        this._buildSignage();
        this._buildServiceDoor();
        this._buildWallFixtures();
        this._buildInteriorVolume();
    }

    _buildMainWall() {
        const mat = this.materials.get('storeWall');

        // Main store body
        const mainWall = new THREE.Mesh(
            new THREE.BoxGeometry(30, 6, 0.4),
            mat
        );
        mainWall.position.set(0, 3, -12);
        mainWall.castShadow = true;
        mainWall.receiveShadow = true;
        this.group.add(mainWall);

        // Accent band
        const accentMat = this.materials.get('storeAccent');
        const band = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.6, 0.45),
            accentMat
        );
        band.position.set(0, 4.5, -12);
        band.castShadow = true;
        this.group.add(band);

        // Lower concrete base
        const concreteMat = this.materials.get('concrete');
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.8, 0.5),
            concreteMat
        );
        base.position.set(0, 0.4, -12);
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);

        // Red accent stripe
        const redMat = this.materials.get('storeRed');
        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.15, 0.48),
            redMat
        );
        stripe.position.set(0, 5.5, -12);
        this.group.add(stripe);
    }

    _buildParapet() {
        const mat = this.materials.get('storeWall');

        // Parapet wall (top edge)
        const parapet = new THREE.Mesh(
            new THREE.BoxGeometry(30.5, 1.2, 0.6),
            mat
        );
        parapet.position.set(0, 6.6, -12);
        parapet.castShadow = true;
        this.group.add(parapet);

        // Parapet cap
        const capMat = this.materials.get('concrete');
        const cap = new THREE.Mesh(
            new THREE.BoxGeometry(30.8, 0.15, 0.8),
            capMat
        );
        cap.position.set(0, 7.25, -12);
        cap.castShadow = true;
        this.group.add(cap);
    }

    _buildEntranceProjection() {
        const mat = this.materials.get('storeWall');
        const accentMat = this.materials.get('storeAccent');

        // Entrance canopy/awning
        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.2, 3),
            accentMat
        );
        canopy.position.set(0, 4, -9.5);
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        this.group.add(canopy);

        // Canopy supports
        for (const x of [-3.5, 3.5]) {
            const support = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 4, 0.15),
                this.materials.get('metalDark')
            );
            support.position.set(x, 2, -10.8);
            support.castShadow = true;
            this.group.add(support);
        }

        // Entrance recess
        const recessMat = this.materials.get('concreteDark');
        const recess = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3.5, 1),
            recessMat
        );
        recess.position.set(0, 1.75, -10.5);
        recess.receiveShadow = true;
        this.group.add(recess);

        // Customer service sign
        const csTexture = createSignTexture('CUSTOMER SERVICE', 'RETURNS • COMPLAINTS • ESCALATIONS', {
            width: 384,
            height: 96,
            bgColor: '#1a1a2e',
            textColor: '#ffffff',
            subtextColor: '#cccccc',
        });
        const csSign = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 0.75),
            new THREE.MeshStandardMaterial({
                map: csTexture,
                emissive: 0x222244,
                emissiveIntensity: 0.15,
            })
        );
        csSign.position.set(0, 3.5, -9.49);
        this.group.add(csSign);
    }

    _buildGlassVestibule() {
        const glassMat = this.materials.get('glass');
        const frameMat = this.materials.get('metalDark');

        // Side glass panels
        for (const x of [-2.5, 2.5]) {
            const glass = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 3, 2),
                glassMat
            );
            glass.position.set(x, 1.5, -9.5);
            this.group.add(glass);

            // Frame
            const frame = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 3.1, 2.1),
                frameMat
            );
            frame.position.set(x, 1.5, -9.5);
            this.group.add(frame);
        }

        // Top glass
        const topGlass = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.08, 2),
            glassMat
        );
        topGlass.position.set(0, 3, -9.5);
        this.group.add(topGlass);
    }

    _buildVestibuleBarrier() {
        const frameMat = this.materials.get('metalDark');

        // Closed interior gate at the back of the vestibule — blocks access to unfinished store interior.
        // Looks like a roll-down security gate / after-hours barrier.
        const gateHeight = 2.6;
        const gateWidth = 4.8;
        const gateZ = -10.8;

        // Gate frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(gateWidth + 0.2, gateHeight + 0.2, 0.08),
            frameMat
        );
        frame.position.set(0, gateHeight / 2, gateZ);
        frame.castShadow = true;
        this.group.add(frame);

        // Gate slats (horizontal bars suggesting a roll-down gate)
        const slatMat = this.materials.get('metalGalvanized');
        const slatCount = 12;
        for (let i = 0; i < slatCount; i++) {
            const y = 0.15 + (i / slatCount) * (gateHeight - 0.15);
            const slat = new THREE.Mesh(
                new THREE.BoxGeometry(gateWidth - 0.1, 0.06, 0.06),
                slatMat
            );
            slat.position.set(0, y, gateZ + 0.02);
            this.group.add(slat);
        }

        // "STORE CLOSED" sign
        const closedCanvas = document.createElement('canvas');
        closedCanvas.width = 256;
        closedCanvas.height = 64;
        const ctx = closedCanvas.getContext('2d');
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STORE ENTRANCE', 128, 28);
        ctx.font = '16px sans-serif';
        ctx.fillText('COMING SOON', 128, 50);
        const closedTexture = new THREE.CanvasTexture(closedCanvas);
        closedTexture.colorSpace = THREE.SRGBColorSpace;
        const closedSign = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshStandardMaterial({
                map: closedTexture,
                roughness: 0.6,
            })
        );
        closedSign.position.set(0, gateHeight + 0.3, gateZ + 0.06);
        this.group.add(closedSign);

        // Collision body for the gate
        const gateCollider = new THREE.Mesh(
            new THREE.BoxGeometry(gateWidth, gateHeight, 0.15),
            new THREE.MeshStandardMaterial({ visible: false })
        );
        gateCollider.position.set(0, gateHeight / 2, gateZ);
        gateCollider.castShadow = false;
        this.group.add(gateCollider);
    }

    _buildAutomaticDoors() {
        const glassMat = this.materials.get('glass');
        const frameMat = this.materials.get('metalDark');

        // Door frames
        for (const x of [-1, 1]) {
            const doorFrame = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 2.8, 0.1),
                frameMat
            );
            doorFrame.position.set(x, 1.4, -9.49);
            this.group.add(doorFrame);

            // Door glass
            const doorGlass = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 2.6, 0.05),
                glassMat
            );
            doorGlass.position.set(x, 1.4, -9.48);
            this.group.add(doorGlass);

            // Door handles
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.4, 0.06),
                this.materials.get('metalGalvanized')
            );
            handle.position.set(x - 0.6, 1.5, -9.44);
            this.group.add(handle);
        }

        // Door track
        const track = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.05, 0.15),
            frameMat
        );
        track.position.set(0, 2.85, -9.49);
        this.group.add(track);
    }

    _buildWindowPanels() {
        const glassMat = this.materials.get('glass');
        const frameMat = this.materials.get('metalDark');

        // Storefront windows (flanking entrance)
        for (const side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                const x = side * (4 + i * 2.2);

                // Window glass
                const windowGlass = new THREE.Mesh(
                    new THREE.BoxGeometry(1.8, 2, 0.08),
                    glassMat
                );
                windowGlass.position.set(x, 1.5, -11.79);
                this.group.add(windowGlass);

                // Window frame
                const windowFrame = new THREE.Mesh(
                    new THREE.BoxGeometry(1.9, 2.1, 0.12),
                    frameMat
                );
                windowFrame.position.set(x, 1.5, -11.79);
                this.group.add(windowFrame);
            }
        }
    }

    _buildSignage() {
        // Main MEGA MART sign on parapet
        const signTexture = createSignTexture('MEGA MART', 'EVERYTHING. EVENTUALLY.', {
            width: 1024,
            height: 256,
            bgColor: '#cc2200',
            textColor: '#ffffff',
            subtextColor: '#ffddaa',
        });

        const signMat = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: 0xff2200,
            emissiveIntensity: 0.1,
            roughness: 0.5,
            metalness: 0.2,
        });

        const mainSign = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 3),
            signMat
        );
        mainSign.position.set(0, 7, -11.69);
        this.group.add(mainSign);

        // Secondary signs
        const onlinePickup = createSignTexture('ONLINE PICKUP', 'BECAUSE YOU ALREADY PAID', {
            width: 384,
            height: 96,
            bgColor: '#1a1a2e',
            textColor: '#ffffff',
            subtextColor: '#aaaaaa',
        });

        const pickupSign = new THREE.Mesh(
            new THREE.PlaneGeometry(2.5, 0.6),
            new THREE.MeshStandardMaterial({
                map: onlinePickup,
                emissive: 0x222244,
                emissiveIntensity: 0.1,
            })
        );
        pickupSign.position.set(-10, 3, -11.69);
        this.group.add(pickupSign);

        // Management sign
        const mgmtSign = createSignTexture('MANAGEMENT', 'CURRENTLY AWARE OF THE SITUATION', {
            width: 384,
            height: 96,
            bgColor: '#2a2a2a',
            textColor: '#ffffff',
            subtextColor: '#888888',
        });

        const mgmtMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshStandardMaterial({
                map: mgmtSign,
                emissive: 0x333333,
                emissiveIntensity: 0.05,
            })
        );
        mgmtMesh.position.set(10, 3, -11.69);
        this.group.add(mgmtMesh);

        // No receipt sign near entrance
        const receiptSign = createSignTexture('NO RECEIPT?', 'GOOD LUCK', {
            width: 256,
            height: 128,
            bgColor: '#333333',
            textColor: '#ff4444',
            subtextColor: '#cccccc',
        });

        const receiptMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.5),
            new THREE.MeshStandardMaterial({
                map: receiptSign,
            })
        );
        receiptMesh.position.set(3.5, 2, -9.49);
        this.group.add(receiptMesh);
    }

    _buildServiceDoor() {
        const doorMat = this.materials.get('metalDark');

        // Service door on far right side of building
        const serviceDoor = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.5, 0.1),
            doorMat
        );
        serviceDoor.position.set(13, 1.25, -11.79);
        this.group.add(serviceDoor);

        // "EMPLOYEES ONLY" text
        const empTexture = createSignTexture('EMPLOYEES ONLY', '', {
            width: 128,
            height: 64,
            bgColor: '#222222',
            textColor: '#ffffff',
        });

        const empSign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.4),
            new THREE.MeshStandardMaterial({ map: empTexture })
        );
        empSign.position.set(13, 2.8, -11.78);
        this.group.add(empSign);
    }

    _buildWallFixtures() {
        // Light fixtures on wall
        const fixtureMat = this.materials.get('metalDark');

        for (const x of [-12, -6, 6, 12]) {
            const fixture = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.4),
                fixtureMat
            );
            fixture.position.set(x, 5, -11.7);
            this.group.add(fixture);
        }

        // HVAC units on roof suggestion
        const hvacMat = this.materials.get('metalGalvanized');
        for (let i = 0; i < 3; i++) {
            const hvac = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 1.5),
                hvacMat
            );
            hvac.position.set(-8 + i * 4, 8, -12);
            hvac.castShadow = true;
            this.group.add(hvac);
        }
    }

    _buildInteriorVolume() {
        // Dark interior behind glass
        const interiorMat = this.materials.get('glassDark');
        const interior = new THREE.Mesh(
            new THREE.BoxGeometry(20, 5, 8),
            interiorMat
        );
        interior.position.set(0, 2.5, -16);
        this.group.add(interior);
    }

    getGroup() {
        return this.group;
    }

    getCollisionMeshes() {
        return this.group.children.filter(c => c.isMesh);
    }
}
