import * as THREE from 'three';

const CAR_COLORS = [
    0x2244aa, 0xcc2200, 0x222222, 0xffffff, 0x888888,
    0x446644, 0xaa8844, 0x664488, 0x4488aa, 0x886644,
    0x333333, 0xbbbbbb, 0x555555, 0x774422, 0x447766,
];

function randomCarColor(rng) {
    return CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)];
}

export class VehicleFactory {
    constructor(materials) {
        this.materials = materials;
        this._geometries = {};
        this._createSharedGeometries();
    }

    _createSharedGeometries() {
        // Wheel (shared across all vehicles)
        this._geometries.wheel = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
        this._geometries.wheelTire = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12);
    }

    createSedan(rng) {
        const group = new THREE.Group();
        const bodyColor = randomCarColor(rng);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.6,
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.1,
            metalness: 0.4,
            transparent: true,
            opacity: 0.5,
        });
        const rubberMat = this.materials.get('rubber');

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

        // Windshield front
        const windshieldFront = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.65),
            glassMat
        );
        windshieldFront.position.set(0, 1.05, 0.85);
        windshieldFront.rotation.x = -0.3;
        group.add(windshieldFront);

        // Windshield rear
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
                new THREE.MeshStandardMaterial({
                    color: 0xffffcc,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.1,
                })
            );
            headlight.position.set(x, 0.5, 2.12);
            group.add(headlight);
        }

        // Taillights
        for (const x of [-0.7, 0.7]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0xff2200,
                    emissive: 0xff1100,
                    emissiveIntensity: 0.1,
                })
            );
            taillight.position.set(x, 0.5, -2.12);
            group.add(taillight);
        }

        // Wheels
        this._addWheels(group, rubberMat, [
            [-0.85, 0.3, 1.3],
            [0.85, 0.3, 1.3],
            [-0.85, 0.3, -1.3],
            [0.85, 0.3, -1.3],
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

        return group;
    }

    createSUV(rng) {
        const group = new THREE.Group();
        const bodyColor = randomCarColor(rng);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.6,
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x778899,
            roughness: 0.1,
            metalness: 0.4,
            transparent: true,
            opacity: 0.5,
        });
        const rubberMat = this.materials.get('rubber');

        // Body lower (taller)
        const bodyLower = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.8, 4.5),
            bodyMat
        );
        bodyLower.position.y = 0.6;
        bodyLower.castShadow = true;
        group.add(bodyLower);

        // Cabin (taller, boxier)
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.9, 2.8),
            bodyMat
        );
        cabin.position.set(0, 1.35, -0.3);
        cabin.castShadow = true;
        group.add(cabin);

        // Roof rack suggestion
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

        // Side windows
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
                new THREE.MeshStandardMaterial({
                    color: 0xffffcc,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.1,
                })
            );
            headlight.position.set(x, 0.6, 2.27);
            group.add(headlight);
        }

        // Taillights
        for (const x of [-0.8, 0.8]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.2, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0xff2200,
                    emissive: 0xff1100,
                    emissiveIntensity: 0.1,
                })
            );
            taillight.position.set(x, 0.6, -2.27);
            group.add(taillight);
        }

        // Wheels (larger)
        this._addWheels(group, rubberMat, [
            [-0.9, 0.35, 1.4],
            [0.9, 0.35, 1.4],
            [-0.9, 0.35, -1.4],
            [0.9, 0.35, -1.4],
        ]);

        return group;
    }

    createPickup(rng) {
        const group = new THREE.Group();
        const bodyColor = randomCarColor(rng);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.35,
            metalness: 0.5,
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.1,
            metalness: 0.4,
            transparent: true,
            opacity: 0.5,
        });
        const rubberMat = this.materials.get('rubber');

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
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.9,
                metalness: 0.1,
            })
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
                new THREE.MeshStandardMaterial({
                    color: 0xffffcc,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.1,
                })
            );
            headlight.position.set(x, 0.7, 2.02);
            group.add(headlight);
        }

        // Wheels
        this._addWheels(group, rubberMat, [
            [-0.85, 0.35, 1.2],
            [0.85, 0.35, 1.2],
            [-0.85, 0.35, -1.5],
            [0.85, 0.35, -1.5],
        ]);

        return group;
    }

    createMinivan(rng) {
        const group = new THREE.Group();
        const bodyColor = randomCarColor(rng);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.5,
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.45,
        });
        const rubberMat = this.materials.get('rubber');

        // Body (boxy)
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 4.5),
            bodyMat
        );
        body.position.y = 0.7;
        body.castShadow = true;
        group.add(body);

        // Sloped hood
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

        // Side windows (sliding door area)
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
                new THREE.MeshStandardMaterial({
                    color: 0xffffcc,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.1,
                })
            );
            headlight.position.set(x, 0.65, 2.8);
            group.add(headlight);
        }

        // Taillights (vertical)
        for (const side of [-1, 1]) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.5, 0.15),
                new THREE.MeshStandardMaterial({
                    color: 0xff2200,
                    emissive: 0xff1100,
                    emissiveIntensity: 0.1,
                })
            );
            taillight.position.set(side * 0.95, 0.8, -2.26);
            group.add(taillight);
        }

        // Wheels
        this._addWheels(group, rubberMat, [
            [-0.85, 0.33, 1.4],
            [0.85, 0.33, 1.4],
            [-0.85, 0.33, -1.4],
            [0.85, 0.33, -1.4],
        ]);

        return group;
    }

    _addWheels(group, rubberMat, positions) {
        const rimMat = this.materials.get('metalGalvanized');

        for (const [x, y, z] of positions) {
            // Tire
            const tire = new THREE.Mesh(this._geometries.wheelTire, rubberMat);
            tire.rotation.x = Math.PI / 2;
            tire.position.set(x, y, z);
            tire.castShadow = true;
            group.add(tire);

            // Rim
            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.22, 8),
                rimMat
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.set(x, y, z);
            group.add(rim);
        }
    }

    dispose() {
        for (const geo of Object.values(this._geometries)) {
            geo.dispose();
        }
    }
}
