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

        const stallWidth = 2.8;
        const stallLength = 4.5;
        const startX = -8;
        const endX = 8;
        const rowZ = [-2, 4];

        // Collect stripe positions/matrices
        const whiteStripes = [];
        const yellowStripes = [];

        // Center double yellow line
        yellowStripes.push({
            x: 0, z: 1, w: 0.15, d: 18, rot: 0
        });

        // Parking stall lines
        for (const rowZPos of rowZ) {
            for (let x = startX; x <= endX; x += stallWidth) {
                whiteStripes.push({
                    x,
                    z: rowZPos + (rowZPos > 0 ? stallLength / 2 : -stallLength / 2),
                    w: 0.1,
                    d: stallLength,
                    rot: 0
                });
            }
        }

        // Row end lines
        for (const rowZPos of rowZ) {
            whiteStripes.push({
                x: 0,
                z: rowZPos + (rowZPos > 0 ? stallLength : -stallLength),
                w: 18,
                d: 0.1,
                rot: 0
            });
        }

        // Directional arrows (simplified as rectangles)
        const arrowData = [
            { x: -4, z: -1, rot: Math.PI },
            { x: 4, z: 3, rot: 0 },
        ];
        for (const arrow of arrowData) {
            whiteStripes.push({
                x: arrow.x,
                z: arrow.z,
                w: 1,
                d: 2.5,
                rot: arrow.rot
            });
        }

        // Stop bar
        whiteStripes.push({
            x: 0,
            z: 15,
            w: 3,
            d: 0.2,
            rot: 0
        });

        // Create InstancedMesh for white stripes
        if (whiteStripes.length > 0) {
            const geo = this.tracker.trackGeometry(
                new THREE.PlaneGeometry(1, 1)
            );
            const instances = new THREE.InstancedMesh(geo, whiteMat, whiteStripes.length);
            const dummy = new THREE.Object3D();
            for (let i = 0; i < whiteStripes.length; i++) {
                const s = whiteStripes[i];
                dummy.position.set(s.x, 0.025, s.z);
                dummy.rotation.x = -Math.PI / 2;
                dummy.rotation.z = s.rot;
                dummy.scale.set(s.w, s.d, 1);
                dummy.updateMatrix();
                instances.setMatrixAt(i, dummy.matrix);
            }
            sceneManager.add(instances, false);
        }

        // Create InstancedMesh for yellow stripes
        if (yellowStripes.length > 0) {
            const geo = this.tracker.trackGeometry(
                new THREE.PlaneGeometry(1, 1)
            );
            const instances = new THREE.InstancedMesh(geo, yellowMat, yellowStripes.length);
            const dummy = new THREE.Object3D();
            for (let i = 0; i < yellowStripes.length; i++) {
                const s = yellowStripes[i];
                dummy.position.set(s.x, 0.025, s.z);
                dummy.rotation.x = -Math.PI / 2;
                dummy.rotation.z = s.rot;
                dummy.scale.set(s.w, s.d, 1);
                dummy.updateMatrix();
                instances.setMatrixAt(i, dummy.matrix);
            }
            sceneManager.add(instances, false);
        }
    }

    _buildAccessibleSpaces(sceneManager) {
        const whiteMat = this.materials.get('paintWhite');
        const blueMat = this.materials.get('paintBlue');

        const accessibleX = -3;
        const accessibleZ = -4;
        const stallWidth = 3.6;
        const stallLength = 4.5;

        // Boundary lines + access aisle as InstancedMesh
        const lineData = [
            { x: accessibleX - stallWidth / 2, z: accessibleZ, w: 0.12, d: stallLength, mat: whiteMat },
            { x: accessibleX + stallWidth / 2, z: accessibleZ, w: 0.12, d: stallLength, mat: whiteMat },
            { x: accessibleX + stallWidth / 2 + 0.75, z: accessibleZ, w: 1.5, d: stallLength, mat: whiteMat },
        ];

        const geo = this.tracker.trackGeometry(
            new THREE.PlaneGeometry(1, 1)
        );
        const instances = new THREE.InstancedMesh(geo, whiteMat, lineData.length);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < lineData.length; i++) {
            const l = lineData[i];
            dummy.position.set(l.x, 0.025, l.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(l.w, l.d, 1);
            dummy.updateMatrix();
            instances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(instances, false);

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

        const curbSegments = [
            { x: 0, z: -6.5, w: 22, h: 0.15, d: 0.2 },
            { x: -11, z: -8, w: 0.2, h: 0.15, d: 3 },
            { x: 11, z: -8, w: 0.2, h: 0.15, d: 3 },
        ];

        const geo = this.tracker.trackGeometry(
            new THREE.BoxGeometry(1, 1, 1)
        );
        const instances = new THREE.InstancedMesh(geo, concreteMat, curbSegments.length);
        instances.castShadow = true;
        instances.receiveShadow = true;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < curbSegments.length; i++) {
            const seg = curbSegments[i];
            dummy.position.set(seg.x, seg.h / 2, seg.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(seg.w, seg.h, seg.d);
            dummy.updateMatrix();
            instances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(instances, true);

        // Yellow painted curb (fire lane) - single mesh
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
        const whiteMat = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.5,
        });

        const positions = [
            [-4, -6.5],
            [-2.5, -6.5],
            [2.5, -6.5],
            [4, -6.5],
            [-2, -3.5],
            [2, -3.5],
        ];

        const count = positions.length;

        // Concrete base geometry (shared)
        const baseGeo = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.15, 0.18, 0.1, 8)
        );
        // Bollard body geometry (shared)
        const bollardGeo = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8)
        );
        // Reflective stripe geometry (shared)
        const stripeGeo = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.085, 0.085, 0.15, 8)
        );

        // InstancedMesh for concrete bases
        const baseInstances = new THREE.InstancedMesh(baseGeo, concreteMat, count);
        baseInstances.castShadow = false;
        baseInstances.receiveShadow = true;
        let dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(
                positions[i][0] + (Math.random() - 0.5) * 0.1,
                0.05,
                positions[i][1] + (Math.random() - 0.5) * 0.1
            );
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            baseInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(baseInstances, false);

        // InstancedMesh for bollard bodies
        const bollardInstances = new THREE.InstancedMesh(bollardGeo, yellowMat, count);
        bollardInstances.castShadow = true;
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(
                positions[i][0] + (Math.random() - 0.5) * 0.1,
                0.55,
                positions[i][1] + (Math.random() - 0.5) * 0.1
            );
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            bollardInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(bollardInstances, false);

        // InstancedMesh for reflective stripes
        const stripeInstances = new THREE.InstancedMesh(stripeGeo, whiteMat, count);
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(
                positions[i][0] + (Math.random() - 0.5) * 0.1,
                0.7,
                positions[i][1] + (Math.random() - 0.5) * 0.1
            );
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            stripeInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(stripeInstances, false);
    }

    _buildCrosswalk(sceneManager) {
        const whiteMat = this.materials.get('paintWhite');
        const geo = this.tracker.trackGeometry(
            new THREE.PlaneGeometry(1, 1)
        );
        const count = 8;
        const instances = new THREE.InstancedMesh(geo, whiteMat, count);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(-1.5 + i * 0.6, 0.026, 0);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(0.4, 3, 1);
            dummy.updateMatrix();
            instances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(instances, false);
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
