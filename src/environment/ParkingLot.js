import * as THREE from 'three';

export class ParkingLot {
    constructor(materials, resourceTracker, asphaltTexture, concreteTexture) {
        this.materials = materials;
        this.tracker = resourceTracker;
        this.asphaltTexture = asphaltTexture;
        this.concreteTexture = concreteTexture;
        this._collidables = [];
    }

    build(sceneManager) {
        this._buildAsphalt(sceneManager);
        this._buildAccessRoad(sceneManager);
        this._buildStriping(sceneManager);
        this._buildAccessibleSpaces(sceneManager);
        this._buildFireLane(sceneManager);
        this._buildSidewalks(sceneManager);
        this._buildCurbs(sceneManager);
        this._buildBollards(sceneManager);
        this._buildCrosswalk(sceneManager);
        this._buildEntranceDrive(sceneManager);
    }

    _buildAsphalt(sceneManager) {
        const mat = new THREE.MeshStandardMaterial({
            map: this.asphaltTexture,
            roughness: 0.95,
            metalness: 0,
        });

        // Main parking lot (40m x 35m)
        const lot = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 35),
            mat
        );
        lot.rotation.x = -Math.PI / 2;
        lot.position.set(0, 0.01, -2);
        lot.receiveShadow = true;
        sceneManager.add(lot, false);
    }

    _buildAccessRoad(sceneManager) {
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.9,
            metalness: 0,
        });

        // Outer access road (perimeter)
        const roadSegments = [
            // North-south on east side
            { x: 22, z: 0, w: 6, h: 40 },
            // East-west at south end
            { x: 10, z: 20, w: 28, h: 5 },
            // East-west at north end (behind store)
            { x: 10, z: -22, w: 28, h: 5 },
        ];

        for (const seg of roadSegments) {
            const road = new THREE.Mesh(
                new THREE.PlaneGeometry(seg.w, seg.h),
                roadMat
            );
            road.rotation.x = -Math.PI / 2;
            road.position.set(seg.x, 0.015, seg.z);
            road.receiveShadow = true;
            sceneManager.add(road, false);
        }
    }

    _buildStriping(sceneManager) {
        const whiteMat = this.materials.get('paintWhite');
        const yellowMat = this.materials.get('paintYellow');

        // Parking stall lines (two rows facing each other)
        const stallWidth = 2.8;
        const stallLength = 4.5;
        const startX = -8;
        const endX = 8;
        const rowZ = [-2, 4];

        // Center double yellow line between rows
        const centerY = new THREE.Mesh(
            new THREE.PlaneGeometry(0.15, 18),
            yellowMat
        );
        centerY.rotation.x = -Math.PI / 2;
        centerY.position.set(0, 0.025, 1);
        sceneManager.add(centerY, false);

        // Parking stall lines
        for (const rowZPos of rowZ) {
            for (let x = startX; x <= endX; x += stallWidth) {
                // Vertical stall divider
                const line = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.1, stallLength),
                    whiteMat
                );
                line.rotation.x = -Math.PI / 2;
                line.position.set(x, 0.025, rowZPos + (rowZPos > 0 ? stallLength / 2 : -stallLength / 2));
                sceneManager.add(line, false);
            }
        }

        // Row end lines
        for (const rowZPos of rowZ) {
            const endLine = new THREE.Mesh(
                new THREE.PlaneGeometry(18, 0.1),
                whiteMat
            );
            endLine.rotation.x = -Math.PI / 2;
            endLine.position.set(0, 0.025, rowZPos + (rowZPos > 0 ? stallLength : -stallLength));
            sceneManager.add(endLine, false);
        }

        // Directional arrows on driving lanes
        const arrowPositions = [
            { x: -4, z: -1, rot: Math.PI },
            { x: 4, z: 3, rot: 0 },
        ];
        for (const arrow of arrowPositions) {
            const arrowPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 2.5),
                whiteMat
            );
            arrowPlane.rotation.x = -Math.PI / 2;
            arrowPlane.rotation.z = arrow.rot;
            arrowPlane.position.set(arrow.x, 0.025, arrow.z);
            sceneManager.add(arrowPlane, false);
        }

        // Stop bar at entrance
        const stopBar = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 0.2),
            whiteMat
        );
        stopBar.rotation.x = -Math.PI / 2;
        stopBar.position.set(0, 0.025, 15);
        sceneManager.add(stopBar, false);
    }

    _buildAccessibleSpaces(sceneManager) {
        const whiteMat = this.materials.get('paintWhite');
        const blueMat = this.materials.get('paintBlue');

        // Accessible spaces near entrance (closest to store, x = -3 to -1)
        const accessibleX = -3;
        const accessibleZ = -4;

        // Wider stall
        const stallWidth = 3.6;
        const stallLength = 4.5;

        // Boundary lines
        const leftLine = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, stallLength),
            whiteMat
        );
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(accessibleX - stallWidth / 2, 0.025, accessibleZ);
        sceneManager.add(leftLine, false);

        const rightLine = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, stallLength),
            whiteMat
        );
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(accessibleX + stallWidth / 2, 0.025, accessibleZ);
        sceneManager.add(rightLine, false);

        // Access aisle (hashed area)
        const aisle = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, stallLength),
            whiteMat
        );
        aisle.rotation.x = -Math.PI / 2;
        aisle.position.set(accessibleX + stallWidth / 2 + 0.75, 0.025, accessibleZ);
        sceneManager.add(aisle, false);

        // Blue wheelchair symbol on asphalt
        const symbolCanvas = document.createElement('canvas');
        symbolCanvas.width = 128;
        symbolCanvas.height = 128;
        const ctx = symbolCanvas.getContext('2d');
        ctx.fillStyle = '#0055a4';
        ctx.fillRect(0, 0, 128, 128);

        // Simple wheelchair icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(64, 55, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(44, 75);
        ctx.lineTo(84, 75);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(48, 95, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(78, 95, 10, 0, Math.PI * 2);
        ctx.stroke();

        const symbolTexture = new THREE.CanvasTexture(symbolCanvas);
        symbolTexture.colorSpace = THREE.SRGBColorSpace;
        const symbol = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 1.5),
            new THREE.MeshStandardMaterial({
                map: symbolTexture,
                transparent: true,
            })
        );
        symbol.rotation.x = -Math.PI / 2;
        symbol.position.set(accessibleX, 0.026, accessibleZ);
        sceneManager.add(symbol, false);
    }

    _buildFireLane(sceneManager) {
        // Red curb paint along front of store
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xcc2200,
            roughness: 0.8,
        });

        const fireLane = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 0.3),
            redMat
        );
        fireLane.rotation.x = -Math.PI / 2;
        fireLane.position.set(0, 0.025, -7);
        sceneManager.add(fireLane, false);

        // "FIRE LANE" text
        const fireLaneCanvas = document.createElement('canvas');
        fireLaneCanvas.width = 512;
        fireLaneCanvas.height = 64;
        const ctx = fireLaneCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FIRE LANE - NO PARKING', 256, 32);

        const fireLaneTexture = new THREE.CanvasTexture(fireLaneCanvas);
        fireLaneTexture.colorSpace = THREE.SRGBColorSpace;
        const fireLaneText = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 0.5),
            new THREE.MeshStandardMaterial({
                map: fireLaneTexture,
                transparent: true,
            })
        );
        fireLaneText.rotation.x = -Math.PI / 2;
        fireLaneText.position.set(0, 0.026, -5);
        sceneManager.add(fireLaneText, false);
    }

    _buildSidewalks(sceneManager) {
        const concreteMat = new THREE.MeshStandardMaterial({
            map: this.concreteTexture,
            roughness: 0.85,
            metalness: 0.05,
        });

        // Main sidewalk along store front
        const sidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(22, 0.12, 3),
            concreteMat
        );
        sidewalk.position.set(0, 0.06, -8);
        sidewalk.castShadow = true;
        sidewalk.receiveShadow = true;
        sceneManager.add(sidewalk, true);
        this._collidables.push(sidewalk);

        // Sidewalk extension to parking
        const walkway = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.12, 5),
            concreteMat
        );
        walkway.position.set(0, 0.06, -5);
        walkway.castShadow = true;
        walkway.receiveShadow = true;
        sceneManager.add(walkway, true);

        // Curb ramp at walkway end
        const ramp = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.06, 1.5),
            concreteMat
        );
        ramp.position.set(0, 0.03, -2);
        ramp.receiveShadow = true;
        sceneManager.add(ramp, false);

        // Tactile paving suggestion (truncated domes - simplified)
        const tactileCanvas = document.createElement('canvas');
        tactileCanvas.width = 64;
        tactileCanvas.height = 64;
        const ctx = tactileCanvas.getContext('2d');
        ctx.fillStyle = '#cccc44';
        ctx.fillRect(0, 0, 64, 64);
        for (let x = 8; x < 64; x += 16) {
            for (let y = 8; y < 64; y += 16) {
                ctx.fillStyle = '#aaaa22';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        const tactileTexture = new THREE.CanvasTexture(tactileCanvas);
        tactileTexture.colorSpace = THREE.SRGBColorSpace;
        const tactile = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 1),
            new THREE.MeshStandardMaterial({
                map: tactileTexture,
                roughness: 0.9,
            })
        );
        tactile.rotation.x = -Math.PI / 2;
        tactile.position.set(0, 0.065, -2);
        sceneManager.add(tactile, false);
    }

    _buildCurbs(sceneManager) {
        const concreteMat = this.materials.get('concrete');
        const yellowMat = this.materials.get('curbYellow');

        // Curb along sidewalk edge
        const curbSegments = [
            // Front of sidewalk
            { x: 0, z: -6.5, w: 22, h: 0.15, d: 0.2 },
            // Side curbs
            { x: -11, z: -8, w: 0.2, h: 0.15, d: 3 },
            { x: 11, z: -8, w: 0.2, h: 0.15, d: 3 },
        ];

        for (const seg of curbSegments) {
            const curb = new THREE.Mesh(
                new THREE.BoxGeometry(seg.w, seg.h, seg.d),
                concreteMat
            );
            curb.position.set(seg.x, seg.h / 2, seg.z);
            curb.castShadow = true;
            curb.receiveShadow = true;
            sceneManager.add(curb, true);
            this._collidables.push(curb);
        }

        // Yellow painted curb (fire lane)
        const yellowCurb = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.12, 0.15),
            yellowMat
        );
        yellowCurb.position.set(0, 0.12, -7);
        yellowCurb.castShadow = true;
        sceneManager.add(yellowCurb, false);
    }

    _buildBollards(sceneManager) {
        const yellowMat = this.materials.get('bollardYellow');
        const concreteMat = this.materials.get('bollardConcrete');

        // Bollards near entrance
        const bollardPositions = [
            [-4, -6.5],
            [-2.5, -6.5],
            [2.5, -6.5],
            [4, -6.5],
            // Extra bollards along walkway
            [-2, -3.5],
            [2, -3.5],
        ];

        for (const [x, z] of bollardPositions) {
            const group = new THREE.Group();

            // Concrete base
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.18, 0.1, 8),
                concreteMat
            );
            base.position.y = 0.05;
            group.add(base);

            // Steel bollard
            const bollard = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
                yellowMat
            );
            bollard.position.y = 0.55;
            bollard.castShadow = true;
            group.add(bollard);

            // Reflective stripe
            const stripe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.085, 0.085, 0.15, 8),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.3,
                    metalness: 0.5,
                })
            );
            stripe.position.y = 0.7;
            group.add(stripe);

            // Slight position variation for realism
            group.position.set(x + (Math.random() - 0.5) * 0.1, 0, z + (Math.random() - 0.5) * 0.1);
            sceneManager.add(group, true);
            this._collidables.push(bollard);
        }
    }

    _buildCrosswalk(sceneManager) {
        const whiteMat = this.materials.get('paintWhite');

        // Crosswalk stripes across the driving lane
        for (let i = 0; i < 8; i++) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, 3),
                whiteMat
            );
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-1.5 + i * 0.6, 0.026, 0);
            sceneManager.add(stripe, false);
        }
    }

    _buildEntranceDrive(sceneManager) {
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.9,
        });

        // Entry drive from south
        const entryDrive = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 8),
            roadMat
        );
        entryDrive.rotation.x = -Math.PI / 2;
        entryDrive.position.set(0, 0.018, 17);
        entryDrive.receiveShadow = true;
        sceneManager.add(entryDrive, false);

        // Curb cuts
        const concreteMat = this.materials.get('concrete');
        for (const side of [-1, 1]) {
            const curbCut = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.08, 8),
                concreteMat
            );
            curbCut.position.set(side * 3, 0.04, 17);
            curbCut.receiveShadow = true;
            sceneManager.add(curbCut, false);
        }
    }

    getCollidables() {
        return this._collidables;
    }
}
