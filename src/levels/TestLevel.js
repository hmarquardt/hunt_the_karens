import * as THREE from 'three';
import { Level } from './Level.js';
import { ManagerKaren } from '../karens/ManagerKaren.js';
import { HOAKaren } from '../karens/HOAKaren.js';
import { SpawnDefinition } from '../systems/SpawnDirector.js';
import { EnvironmentMaterials } from '../environment/EnvironmentMaterials.js';
import { MegaMartStore } from '../environment/MegaMartStore.js';
import { ParkingLot } from '../environment/ParkingLot.js';
import { VehicleFactory } from '../environment/VehicleFactory.js';
import { ShoppingCart, CartReturn } from '../environment/ShoppingCart.js';
import { Landscaping } from '../environment/Landscaping.js';
import { SignFactory } from '../environment/SignFactory.js';

function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export class TestLevel extends Level {
    constructor(assetManager) {
        super();
        this.name = 'MEGA MART - Suburban Retail Parking Lot';
        this.spawnPoint = new THREE.Vector3(0, 1.6, 12);
        this.assetManager = assetManager;
        this._materials = null;
        this._disposables = [];
    }

    async build(sceneManager) {
        this._materials = new EnvironmentMaterials();

        this._setupLighting(sceneManager);
        this._setupSky(sceneManager);

        const parkingLot = new ParkingLot(this._materials);
        parkingLot.build(sceneManager);
        this._disposables.push(parkingLot.asphaltTexture, parkingLot.concreteTexture);

        const store = new MegaMartStore(this._materials);
        sceneManager.add(store.getGroup(), false);
        for (const mesh of store.getCollisionMeshes()) {
            sceneManager.add(mesh, true);
        }

        this._placeVehicles(sceneManager);
        this._placeCarts(sceneManager);
        this._placeLandscaping(sceneManager);
        this._placeLightPoles(sceneManager);
        this._placeProps(sceneManager);
        this._placeSigns(sceneManager);
        this._buildHorizon(sceneManager);
        this._addAtmosphericFog(sceneManager);

        this._parkingLot = parkingLot;
    }

    _setupSky(sceneManager) {
        const skyGeo = new THREE.SphereGeometry(80, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x5588bb) },
                bottomColor: { value: new THREE.Color(0xddccaa) },
                offset: { value: 10 },
                exponent: { value: 0.4 },
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide,
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sceneManager.add(sky, false);
    }

    _setupLighting(sceneManager) {
        const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
        sceneManager.add(ambient, false);

        const hemi = new THREE.HemisphereLight(0x88aacc, 0x444422, 0.5);
        sceneManager.add(hemi, false);

        const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
        sun.position.set(15, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        sun.shadow.bias = -0.001;
        sceneManager.add(sun, false);
        sceneManager.add(sun.target, false);
    }

    _placeVehicles(sceneManager) {
        const factory = new VehicleFactory(this._materials);
        this._disposables.push(factory);
        const rng = seededRandom(99);

        // Parking rows: rowZ = [-2 (north-facing), 4 (south-facing)]
        // Stalls from x = -8 to 8, spacing 2.8
        const stallWidth = 2.8;
        const startX = -8;

        // Vehicle type distribution
        const vehicleTypes = ['sedan', 'sedan', 'sedan', 'suv', 'suv', 'pickup', 'minivan'];

        // Occupancy pattern (1 = parked, 0 = empty)
        // Denser near entrance, sparser farther out
        const northRowOccupancy = [1, 1, 0, 1, 1, 1, 0, 1];  // row at z = -2
        const southRowOccupancy = [1, 1, 1, 0, 1, 1, 1, 0];  // row at z = 4

        const placeVehicle = (x, z, type, rotation, crooked = false) => {
            let vehicle;
            switch (type) {
                case 'sedan': vehicle = factory.createSedan(rng); break;
                case 'suv': vehicle = factory.createSUV(rng); break;
                case 'pickup': vehicle = factory.createPickup(rng); break;
                case 'minivan': vehicle = factory.createMinivan(rng); break;
                default: vehicle = factory.createSedan(rng);
            }
            vehicle.rotation.y = rotation;
            if (crooked) {
                vehicle.rotation.y += (rng() - 0.5) * 0.15;
            }
            vehicle.position.set(x, 0, z);
            sceneManager.add(vehicle, false);
        };

        // North row (facing south, rotation = 0)
        for (let i = 0; i < northRowOccupancy.length; i++) {
            if (!northRowOccupancy[i]) continue;
            const x = startX + i * stallWidth + stallWidth / 2;
            const type = vehicleTypes[Math.floor(rng() * vehicleTypes.length)];
            const crooked = rng() > 0.9;
            placeVehicle(x, -4, type, 0, crooked);
        }

        // South row (facing north, rotation = PI)
        for (let i = 0; i < southRowOccupancy.length; i++) {
            if (!southRowOccupancy[i]) continue;
            const x = startX + i * stallWidth + stallWidth / 2;
            const type = vehicleTypes[Math.floor(rng() * vehicleTypes.length)];
            const crooked = rng() > 0.85;
            placeVehicle(x, 6, type, Math.PI, crooked);
        }

        // Additional cars on sides
        const sideVehicles = [
            { x: -14, z: -2, type: 'suv', rot: Math.PI / 2 },
            { x: -14, z: 2, type: 'pickup', rot: Math.PI / 2 },
            { x: 14, z: -2, type: 'minivan', rot: -Math.PI / 2 },
            { x: 14, z: 2, type: 'sedan', rot: -Math.PI / 2 },
            { x: 14, z: 6, type: 'suv', rot: -Math.PI / 2 },
        ];
        for (const v of sideVehicles) {
            placeVehicle(v.x, v.z, v.type, v.rot);
        }

        // One car taking up 1.4 spaces (tiny joke)
        placeVehicle(6, -4, 'pickup', 0, true);
    }

    _placeCarts(sceneManager) {
        const cartFactory = new ShoppingCart(this._materials);
        this._disposables.push(cartFactory);

        // Parked cart clusters near cart returns
        const cartReturn1 = new CartReturn(this._materials, cartFactory);
        cartReturn1.group.position.set(-8, 0, -6);
        sceneManager.add(cartReturn1.group, false);

        const cartReturn2 = new CartReturn(this._materials, cartFactory);
        cartReturn2.group.position.set(8, 0, -6);
        sceneManager.add(cartReturn2.group, false);

        // Stray carts
        const strayCartPositions = [
            { x: -5, z: -1, rot: 0.3 },
            { x: 3, z: 2, rot: -0.2 },
            { x: 10, z: 0, rot: 0.5 },
        ];
        for (const cp of strayCartPositions) {
            const cart = cartFactory.create();
            cart.position.set(cp.x, 0, cp.z);
            cart.rotation.y = cp.rot;
            sceneManager.add(cart, false);
        }
    }

    _placeLandscaping(sceneManager) {
        const landscaping = new Landscaping(this._materials);
        const rng = seededRandom(77);

        // Landscape islands
        const islands = [
            { x: -12, z: 0, w: 3, d: 4, trees: 1 },
            { x: 12, z: 0, w: 3, d: 4, trees: 1 },
            { x: 0, z: 8, w: 4, d: 3, trees: 2 },
            { x: -6, z: 8, w: 3, d: 3, trees: 1 },
            { x: 6, z: 8, w: 3, d: 3, trees: 1 },
        ];

        for (const island of islands) {
            const group = landscaping.createLandscapeIsland(
                island.x, island.z, island.w, island.d,
                { treeCount: island.trees, hasShrubs: true }
            );
            sceneManager.add(group, false);
        }

        // Distant tree line
        const treeLine = landscaping.createTreeLine(-30, -35, 20, 3, rng);
        sceneManager.add(treeLine, false);
    }

    _placeLightPoles(sceneManager) {
        const landscaping = new Landscaping(this._materials);

        const polePositions = [
            [-10, -4],
            [10, -4],
            [-10, 4],
            [10, 4],
            [0, 10],
        ];

        for (const [x, z] of polePositions) {
            const pole = landscaping.createLightPole(x, z);
            sceneManager.add(pole, false);
        }
    }

    _placeProps(sceneManager) {
        const concreteMat = this.materials?.get('concrete') || this._materials.get('concrete');
        const metalMat = this.materials?.get('metalDark') || this._materials.get('metalDark');

        // Trash cans
        const trashCanPositions = [
            [-3, -6.5],
            [3, -6.5],
            [-8, -6],
            [8, -6],
        ];

        for (const [x, z] of trashCanPositions) {
            const trashCan = new THREE.Group();

            // Can body
            const canBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.22, 0.7, 8),
                metalMat
            );
            canBody.position.y = 0.35;
            canBody.castShadow = true;
            trashCan.add(canBody);

            // Lid
            const lid = new THREE.Mesh(
                new THREE.CylinderGeometry(0.27, 0.27, 0.04, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x225522,
                    roughness: 0.7,
                })
            );
            lid.position.y = 0.72;
            trashCan.add(lid);

            trashCan.position.set(x + (Math.random() - 0.5) * 0.2, 0, z);
            sceneManager.add(trashCan, false);
        }

        // Bench near entrance
        const bench = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x886644,
            roughness: 0.8,
        });

        // Seat
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.06, 0.4),
            woodMat
        );
        seat.position.y = 0.45;
        seat.castShadow = true;
        bench.add(seat);

        // Back
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.5, 0.05),
            woodMat
        );
        back.position.set(0, 0.7, -0.18);
        back.castShadow = true;
        bench.add(back);

        // Legs
        for (const x of [-0.6, 0.6]) {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.45, 0.35),
                metalMat
            );
            leg.position.set(x, 0.225, 0);
            leg.castShadow = true;
            bench.add(leg);
        }

        bench.position.set(5, 0, -6.5);
        bench.rotation.y = Math.PI / 6;
        sceneManager.add(bench, false);

        // Planter near entrance
        const planter = new THREE.Group();
        const planterMat = new THREE.MeshStandardMaterial({
            color: 0x996644,
            roughness: 0.9,
        });

        const planterBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.5, 1),
            planterMat
        );
        planterBox.position.y = 0.25;
        planterBox.castShadow = true;
        planter.add(planterBox);

        // Empty soil
        const soil = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.05, 0.9),
            this._materials.get('mulch')
        );
        soil.position.y = 0.5;
        planter.add(soil);

        // Dead/dry plant suggestion
        const deadPlant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.01, 0.4, 4),
            new THREE.MeshStandardMaterial({
                color: 0x888844,
                roughness: 0.95,
            })
        );
        deadPlant.position.set(0.1, 0.7, 0.1);
        deadPlant.rotation.z = 0.3;
        planter.add(deadPlant);

        planter.position.set(-5, 0, -6.5);
        sceneManager.add(planter, false);
    }

    _placeSigns(sceneManager) {
        const signFactory = new SignFactory(this._materials);

        // Stop sign at entrance
        const stopSign = signFactory.createStopSign(4, 16, -Math.PI / 4);
        sceneManager.add(stopSign, false);

        // Fire lane signs
        const fireSign1 = signFactory.createFireLaneSign(-10, -7, 0);
        sceneManager.add(fireSign1, false);
        const fireSign2 = signFactory.createFireLaneSign(10, -7, 0);
        sceneManager.add(fireSign2, false);

        // Accessible parking sign
        const accessibleSign = signFactory.createAccessibleParkingSign(-2, -6.5, 0);
        sceneManager.add(accessibleSign, false);

        // Directional arrow
        const arrowSign = signFactory.createDirectionalArrow(-12, 10, 'left', 'PARKING →');
        sceneManager.add(arrowSign, false);
    }

    _buildHorizon(sceneManager) {
        const rng = seededRandom(55);
        const silhouetteMat = new THREE.MeshStandardMaterial({
            color: 0x556655,
            roughness: 0.9,
            metalness: 0,
        });

        // Distant retail boxes
        for (let i = 0; i < 6; i++) {
            const w = 8 + rng() * 12;
            const h = 5 + rng() * 8;
            const d = 6 + rng() * 8;
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0.4 + rng() * 0.15, 0.4 + rng() * 0.1, 0.35 + rng() * 0.1),
                    roughness: 0.85,
                    metalness: 0.05,
                })
            );
            building.position.set(-20 + i * 8, h / 2, -40 - rng() * 10);
            building.castShadow = true;
            sceneManager.add(building, false);
        }

        // Water tower
        const towerGroup = new THREE.Group();
        const towerMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3,
        });

        // Support legs
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.15, 15, 6),
                towerMat
            );
            const angle = (i / 4) * Math.PI * 2;
            leg.position.set(Math.cos(angle) * 2, 7.5, Math.sin(angle) * 2);
            leg.rotation.x = Math.cos(angle) * 0.1;
            leg.rotation.z = Math.sin(angle) * 0.1;
            towerGroup.add(leg);
        }

        // Tank
        const tank = new THREE.Mesh(
            new THREE.SphereGeometry(3, 12, 8),
            new THREE.MeshStandardMaterial({
                color: 0x6688aa,
                roughness: 0.6,
                metalness: 0.2,
            })
        );
        tank.position.y = 16;
        tank.scale.y = 0.8;
        towerGroup.add(tank);

        towerGroup.position.set(25, 0, -35);
        sceneManager.add(towerGroup, false);

        // Utility poles
        for (let i = 0; i < 5; i++) {
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.07, 8, 6),
                new THREE.MeshStandardMaterial({
                    color: 0x664422,
                    roughness: 0.9,
                })
            );
            pole.position.set(-25 + i * 12, 4, -30);
            pole.castShadow = true;
            sceneManager.add(pole, false);

            // Cross bar
            const crossBar = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.06, 0.06),
                new THREE.MeshStandardMaterial({
                    color: 0x664422,
                    roughness: 0.9,
                })
            );
            crossBar.position.set(-25 + i * 12, 7.5, -30);
            sceneManager.add(crossBar, false);
        }
    }

    _addAtmosphericFog(sceneManager) {
        sceneManager.scene.fog = new THREE.FogExp2(0xccddbb, 0.008);
    }

    getSpawnDefinitions() {
        return [
            new SpawnDefinition({
                karenType: 'manager',
                position: new THREE.Vector3(-2, 0, -5),
                patrolCenter: new THREE.Vector3(-2, 0, -5),
                patrolRadius: 3,
                orientation: 0,
            }),
            new SpawnDefinition({
                karenType: 'manager',
                position: new THREE.Vector3(3, 0, -3),
                patrolCenter: new THREE.Vector3(3, 0, -3),
                patrolRadius: 2.5,
                orientation: Math.PI / 6,
            }),
            new SpawnDefinition({
                karenType: 'hoa',
                position: new THREE.Vector3(12, 0, 0),
                patrolCenter: new THREE.Vector3(12, 0, 0),
                patrolRadius: 3,
                orientation: -Math.PI / 3,
            }),
            new SpawnDefinition({
                karenType: 'retail_return',
                position: new THREE.Vector3(-8, 0, -3),
                patrolCenter: new THREE.Vector3(-8, 0, -3),
                patrolRadius: 2.5,
                orientation: Math.PI / 4,
            }),
        ];
    }
}
