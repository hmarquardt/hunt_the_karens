import * as THREE from 'three';

const CAR_COLORS = [
    0x2244aa, 0xcc2200, 0x222222, 0xffffff, 0x888888,
    0x446644, 0xaa8844, 0x664488, 0x4488aa, 0x886644,
    0x333333, 0xbbbbbb, 0x555555, 0x774422, 0x447766,
];

export class VehicleFactory {
    constructor(materials, resourceTracker) {
        this.materials = materials;
        this.tracker = resourceTracker;
        this._sharedGeometries = {};
        this._carPaintMaterials = {};
        this._sharedVehicleGlass = null;
        this._sharedHeadlightMat = null;
        this._sharedTaillightMat = null;
        this._createSharedResources();
    }

    _createSharedResources() {
        // Shared geometries
        this._sharedGeometries.wheelTire = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12)
        );
        this._sharedGeometries.wheelRim = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.2, 0.2, 0.22, 8)
        );

        // Shared vehicle glass
        this._sharedVehicleGlass = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x8899aa,
            roughness: 0.1,
            metalness: 0.4,
            transparent: true,
            opacity: 0.5,
        });

        // Shared headlight/taillight materials
        this._sharedHeadlightMat = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xffffcc,
            emissive: 0xffffaa,
            emissiveIntensity: 0.1,
        });
        this._sharedTaillightMat = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xff2200,
            emissive: 0xff1100,
            emissiveIntensity: 0.1,
        });

        // Car paint materials (one per color, shared across all vehicles)
        for (const color of CAR_COLORS) {
            const key = color.toString(16);
            this._carPaintMaterials[key] = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
                color,
                roughness: 0.3,
                metalness: 0.6,
            });
        }
    }

    _getCarPaintMaterial(color) {
        const key = color.toString(16);
        return this._carPaintMaterials[key] || this._carPaintMaterials['2244aa'];
    }

    _randomCarColor(rng) {
        return CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)];
    }

    _addWheels(group, positions) {
        const rubberMat = this.materials.get('rubber');
        const rimMat = this.materials.get('metalGalvanized');

        for (const [x, y, z] of positions) {
            const tire = new THREE.Mesh(this._sharedGeometries.wheelTire, rubberMat);
            tire.rotation.x = Math.PI / 2;
            tire.position.set(x, y, z);
            tire.castShadow = true;
            group.add(tire);

            const rim = new THREE.Mesh(this._sharedGeometries.wheelRim, rimMat);
            rim.rotation.x = Math.PI / 2;
            rim.position.set(x, y, z);
            group.add(rim);
        }
    }

    createSedan(rng) {
        const group = new THREE.Group();
        const bodyColor = this._randomCarColor(rng);
        const bodyMat = this._getCarPaintMaterial(bodyColor);
        const glassMat = this._sharedVehicleGlass;

        // Body lower
        const bodyLower = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.6, 4.2),
            bodyMat
        );
        bodyLower.position.y = 0.5;
        bodyLower.castShadow = true;
        group.add(bodyLower);

        // Cabin
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.7, 2.2),
            bodyMat
        );
        cabin.position.set(0, 1.05, -0.2);
        cabin.castShadow = true;
        group.add(cabin);

        // Windshields
        const windshieldFront = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.65),
            glassMat
        );
        windshieldFront.position.set(0, 1.05, 0.85);
        windshieldFront.rotation.x = -0.3;
        group.add(windshieldFront);

        const windshieldRear = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.6),
            glassMat
        );
        windshieldRear.position.set(0, 1.05, -1.25);
        windshieldRear.rotation.x = 0.3;
        group.add(windshieldRear);

        // Side windows
        for (const side of [-1, 1]) {
            const sideWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.55),
                glassMat
            );
            sideWindow.position.set(side * 0.86, 1.05, -0.2);
            sideWindow.rotation.y = side * Math.PI / 2;
            group.add(sideWindow);
        }

        // Headlights
        for (const x of [-0.7, 0.7]) {
            const headlight = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.05),
                this._sharedHeadlightMat
            );
            headlight.position.set(x, 0.5, 2.12);
            group.add(headlight);
        }

        // Taillights
        for (const x of [-0.7, 0.7]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.05),
                this._sharedTaillightMat
            );
            taillight.position.set(x, 0.5, -2.12);
            group.add(taillight);
        }

        // Wheels
        this._addWheels(group, [
            [-0.85, 0.3, 1.3], [0.85, 0.3, 1.3],
            [-0.85, 0.3, -1.3], [0.85, 0.3, -1.3],
        ]);

        // Mirrors
        for (const side of [-1, 1]) {
            const mirror = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.12, 0.1),
                bodyMat
            );
            mirror.position.set(side * 0.95, 0.9, 0.5);
            group.add(mirror);
        }

        // Store collision proxy
        group.userData.isVehicle = true;
        group.userData.collisionRadius = 2.1;
        group.userData.collisionLength = 4.2;

        return group;
    }

    createSUV(rng) {
        const group = new THREE.Group();
        const bodyColor = this._randomCarColor(rng);
        const bodyMat = this._getCarPaintMaterial(bodyColor);
        const glassMat = this._sharedVehicleGlass;

        // Body lower
        const bodyLower = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.8, 4.5),
            bodyMat
        );
        bodyLower.position.y = 0.6;
        bodyLower.castShadow = true;
        group.add(bodyLower);

        // Cabin
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.9, 2.8),
            bodyMat
        );
        cabin.position.set(0, 1.35, -0.3);
        cabin.castShadow = true;
        group.add(cabin);

        // Roof rack
        const rack = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.05, 1.5),
            this.materials.get('metalDark')
        );
        rack.position.set(0, 1.82, -0.3);
        group.add(rack);

        // Windshields
        const windshieldFront = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 0.8),
            glassMat
        );
        windshieldFront.position.set(0, 1.3, 0.95);
        windshieldFront.rotation.x = -0.25;
        group.add(windshieldFront);

        for (const side of [-1, 1]) {
            const sideWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(2.5, 0.7),
                glassMat
            );
            sideWindow.position.set(side * 0.96, 1.3, -0.3);
            sideWindow.rotation.y = side * Math.PI / 2;
            group.add(sideWindow);
        }

        // Headlights
        for (const x of [-0.8, 0.8]) {
            const headlight = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.2, 0.05),
                this._sharedHeadlightMat
            );
            headlight.position.set(x, 0.6, 2.27);
            group.add(headlight);
        }

        // Taillights
        for (const x of [-0.8, 0.8]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.2, 0.05),
                this._sharedTaillightMat
            );
            taillight.position.set(x, 0.6, -2.27);
            group.add(taillight);
        }

        this._addWheels(group, [
            [-0.9, 0.35, 1.4], [0.9, 0.35, 1.4],
            [-0.9, 0.35, -1.4], [0.9, 0.35, -1.4],
        ]);

        group.userData.isVehicle = true;
        group.userData.collisionRadius = 2.2;
        group.userData.collisionLength = 4.5;

        return group;
    }

    createPickup(rng) {
        const group = new THREE.Group();
        const bodyColor = this._randomCarColor(rng);
        const bodyMat = this._getCarPaintMaterial(bodyColor);
        const glassMat = this._sharedVehicleGlass;
        const bedMat = this.tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1,
        });

        // Cab
        const cab = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.8, 2),
            bodyMat
        );
        cab.position.set(0, 0.8, 1);
        cab.castShadow = true;
        group.add(cab);

        // Cab roof
        const cabRoof = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.7, 1.8),
            bodyMat
        );
        cabRoof.position.set(0, 1.45, 1);
        cabRoof.castShadow = true;
        group.add(cabRoof);

        // Bed
        const bed = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.5, 2.5),
            bedMat
        );
        bed.position.set(0, 0.55, -1);
        bed.castShadow = true;
        group.add(bed);

        // Bed rails
        for (const side of [-1, 1]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.3, 2.5),
                bodyMat
            );
            rail.position.set(side * 0.9, 0.8, -1);
            group.add(rail);
        }

        // Windshield
        const windshield = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 0.65),
            glassMat
        );
        windshield.position.set(0, 1.3, 1.95);
        windshield.rotation.x = -0.2;
        group.add(windshield);

        // Headlights
        for (const x of [-0.7, 0.7]) {
            const headlight = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.05),
                this._sharedHeadlightMat
            );
            headlight.position.set(x, 0.7, 2.02);
            group.add(headlight);
        }

        this._addWheels(group, [
            [-0.85, 0.35, 1.2], [0.85, 0.35, 1.2],
            [-0.85, 0.35, -1.5], [0.85, 0.35, -1.5],
        ]);

        group.userData.isVehicle = true;
        group.userData.collisionRadius = 2.0;
        group.userData.collisionLength = 4.5;

        return group;
    }

    createMinivan(rng) {
        const group = new THREE.Group();
        const bodyColor = this._randomCarColor(rng);
        const bodyMat = this._getCarPaintMaterial(bodyColor);
        const glassMat = this._sharedVehicleGlass;

        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 4.5),
            bodyMat
        );
        body.position.y = 0.7;
        body.castShadow = true;
        group.add(body);

        // Hood
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.4, 1),
            bodyMat
        );
        hood.position.set(0, 0.9, 2.5);
        hood.rotation.x = -0.15;
        group.add(hood);

        // Windshield
        const windshield = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 0.85),
            glassMat
        );
        windshield.position.set(0, 1.1, 2.05);
        windshield.rotation.x = -0.35;
        group.add(windshield);

        // Side windows
        for (const side of [-1, 1]) {
            const sideWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(2.5, 0.6),
                glassMat
            );
            sideWindow.position.set(side * 1.01, 1.05, 0.3);
            sideWindow.rotation.y = side * Math.PI / 2;
            group.add(sideWindow);
        }

        // Rear window
        const rearWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 0.7),
            glassMat
        );
        rearWindow.position.set(0, 1.1, -2.26);
        rearWindow.rotation.y = Math.PI;
        group.add(rearWindow);

        // Headlights
        for (const x of [-0.7, 0.7]) {
            const headlight = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.05),
                this._sharedHeadlightMat
            );
            headlight.position.set(x, 0.65, 2.8);
            group.add(headlight);
        }

        // Taillights (vertical)
        for (const side of [-1, 1]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.5, 0.15),
                this._sharedTaillightMat
            );
            taillight.position.set(side * 0.95, 0.8, -2.26);
            group.add(taillight);
        }

        this._addWheels(group, [
            [-0.85, 0.33, 1.4], [0.85, 0.33, 1.4],
            [-0.85, 0.33, -1.4], [0.85, 0.33, -1.4],
        ]);

        group.userData.isVehicle = true;
        group.userData.collisionRadius = 2.0;
        group.userData.collisionLength = 4.5;

        return group;
    }

    dispose() {
        // Geometries and materials tracked by ResourceTracker
    }
}
