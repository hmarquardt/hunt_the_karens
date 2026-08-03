import * as THREE from 'three';
import { Level } from './Level.js';
import { ManagerKaren } from '../karens/ManagerKaren.js';
import { HOAKaren } from '../karens/HOAKaren.js';
import { SpawnDefinition } from '../systems/SpawnDirector.js';
import { EnvironmentMaterials } from '../environment/EnvironmentMaterials.js';
import { createAsphaltTexture, createConcreteTexture, createSignTexture, createAccessibleSignTexture } from '../environment/EnvironmentTextures.js';
import { MegaMartStore } from '../environment/MegaMartStore.js';
import { ParkingLot } from '../environment/ParkingLot.js';
import { VehicleFactory } from '../environment/VehicleFactory.js';
import { ShoppingCart, CartReturn } from '../environment/ShoppingCart.js';
import { Landscaping } from '../environment/Landscaping.js';
import { SignFactory } from '../environment/SignFactory.js';
import { ResourceTracker } from '../environment/ResourceTracker.js';

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
        this._tracker = null;
        this._store = null;
        this._parkingLot = null;
        this._vehicleFactory = null;
        this._cartFactory = null;
        this._landscaping = null;
        this._signFactory = null;

        // Motion/environment objects
        this._doors = { left: null, right: null, state: 'closed', timer: 0, target: 0 };
        this._trees = [];
        this._rollingCart = null;
        this._rollingCartState = { velocity: 0, direction: 0, paused: 0 };
        this._distantVehicle = null;
        this._distantVehicleT = 0;
        this._hvacFans = [];
        this._playerNearEntrance = false;

        // Collision proxies for vehicles
        this._vehicleColliders = [];

        // Debug stats
        this._stats = {
            vehicleCount: 0,
            cartCount: 0,
            treeCount: 0,
            instancedMeshCount: 0,
        };
    }

    async build(sceneManager) {
        this._materials = new EnvironmentMaterials();
        this._tracker = new ResourceTracker();

        // Shared textures
        this._asphaltTexture = this._tracker.trackTexture(createAsphaltTexture(512, 42));
        this._concreteTexture = this._tracker.trackTexture(createConcreteTexture(256, 123));

        this._setupLighting(sceneManager);
        this._setupSky(sceneManager);
        this._tracker.trackObject(this._skyMesh);

        // Build parking lot
        this._parkingLot = new ParkingLot(this._materials, this._tracker, this._asphaltTexture, this._concreteTexture);
        this._parkingLot.build(sceneManager);

        // Build store
        this._store = new MegaMartStore(this._materials, this._tracker);
        this._store.build(sceneManager);
        this._tracker.trackObject(this._store.group);

        // Extract door references for animation
        this._extractDoors();

        // Build vestibule/interior
        this._buildVestibule(sceneManager);

        // Extract HVAC fans for motion
        this._extractHVACFans();

        // Place vehicles
        this._placeVehicles(sceneManager);

        // Place carts
        this._placeCarts(sceneManager);

        // Place landscaping (with tree references for sway)
        this._placeLandscaping(sceneManager);

        // Place light poles
        this._placeLightPoles(sceneManager);

        // Place props
        this._placeProps(sceneManager);

        // Place signs
        this._placeSigns(sceneManager);

        // Build horizon
        this._buildHorizon(sceneManager);

        // Build distant moving vehicle
        this._buildDistantVehicle(sceneManager);

        // Atmospheric fog
        sceneManager.scene.fog = new THREE.FogExp2(0xccddbb, 0.008);
    }

    _setupSky(sceneManager) {
        const skyGeo = new THREE.SphereGeometry(80, 32, 16);
        this._tracker.trackGeometry(skyGeo);
        const skyMat = this._tracker.createMaterial(THREE.ShaderMaterial, {
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
        this._skyMesh = new THREE.Mesh(skyGeo, skyMat);
        sceneManager.add(this._skyMesh, false);
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

    _extractDoors() {
        // Find door meshes in the store group for animation
        // Doors are at x = -1 and x = 1, y = 1.4, z ≈ -9.48
        if (!this._store?.group) return;

        this._store.group.traverse((child) => {
            if (child.isMesh && Math.abs(child.position.y - 1.4) < 0.1 && Math.abs(child.position.z + 9.48) < 0.1) {
                if (Math.abs(child.position.x + 1) < 0.1) {
                    this._doors.left = child;
                    this._doors.leftBaseX = -1;
                } else if (Math.abs(child.position.x - 1) < 0.1) {
                    this._doors.right = child;
                    this._doors.rightBaseX = 1;
                }
            }
        });
    }

    _extractHVACFans() {
        // HVAC units are on the roof at y ≈ 8, z = -12
        if (!this._store?.group) return;

        this._store.group.traverse((child) => {
            if (child.isMesh && child.geometry?.type === 'BoxGeometry') {
                const p = child.position;
                if (Math.abs(p.y - 8) < 0.5 && Math.abs(p.z + 12) < 1 && p.x > -10 && p.x < 10) {
                    this._hvacFans.push({ mesh: child, phase: Math.random() * Math.PI * 2 });
                }
            }
        });
    }

    _buildVestibule(sceneManager) {
        const interiorMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x1a1a22,
            roughness: 0.9,
            metalness: 0.05,
        });

        // Floor behind glass
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 3),
            this._materials.get('concrete')
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.02, -9.5);
        floor.receiveShadow = true;
        sceneManager.add(floor, false);

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 3),
            interiorMat
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3, -9.5);
        sceneManager.add(ceiling, false);

        // Fluorescent light panels (emissive)
        const lightPanelMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xffffff,
            emissive: 0xffffee,
            emissiveIntensity: 0.6,
            roughness: 0.3,
        });

        for (const x of [-1.5, 0, 1.5]) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.03, 0.3),
                lightPanelMat
            );
            panel.position.set(x, 2.95, -9.5);
            sceneManager.add(panel, false);
        }

        // Customer service counter silhouette
        const counterMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x444444,
            roughness: 0.8,
        });
        const counter = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 0.5),
            counterMat
        );
        counter.position.set(0, 0.5, -11);
        sceneManager.add(counter, false);

        // Checkout lane silhouette (left side)
        const checkoutMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x333333,
            roughness: 0.85,
        });
        const checkout = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.8, 1),
            checkoutMat
        );
        checkout.position.set(-5, 0.4, -11);
        sceneManager.add(checkout, false);

        // Cart stack suggestion
        const cartStackMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xcccccc,
            roughness: 0.4,
            metalness: 0.8,
        });
        for (let i = 0; i < 3; i++) {
            const cart = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.8, 0.6),
                cartStackMat
            );
            cart.position.set(4, 0.4 + i * 0.05, -11);
            sceneManager.add(cart, false);
        }

        // Interior wall signage
        const interiorSignTexture = createSignTexture('WELCOME', '', {
            width: 256,
            height: 64,
            bgColor: '#cc2200',
            textColor: '#ffffff',
        });
        const interiorSign = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                map: interiorSignTexture,
                emissive: 0xff2200,
                emissiveIntensity: 0.1,
            })
        );
        interiorSign.position.set(0, 2.5, -11.9);
        sceneManager.add(interiorSign, false);

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 5),
            interiorMat
        );
        backWall.position.set(0, 2.5, -12);
        sceneManager.add(backWall, false);
    }

    _placeVehicles(sceneManager) {
        this._vehicleFactory = new VehicleFactory(this._materials, this._tracker);
        const rng = seededRandom(99);

        const stallWidth = 2.8;
        const startX = -8;

        const vehicleTypes = ['sedan', 'sedan', 'sedan', 'suv', 'suv', 'pickup', 'minivan'];
        const northRowOccupancy = [1, 1, 0, 1, 1, 1, 0, 1];
        const southRowOccupancy = [1, 1, 1, 0, 1, 1, 1, 0];

        const placeVehicle = (x, z, type, rotation, crooked = false) => {
            let vehicle;
            switch (type) {
                case 'sedan': vehicle = this._vehicleFactory.createSedan(rng); break;
                case 'suv': vehicle = this._vehicleFactory.createSUV(rng); break;
                case 'pickup': vehicle = this._vehicleFactory.createPickup(rng); break;
                case 'minivan': vehicle = this._vehicleFactory.createMinivan(rng); break;
                default: vehicle = this._vehicleFactory.createSedan(rng);
            }
            vehicle.rotation.y = crooked ? rotation + (rng() - 0.5) * 0.15 : rotation;
            vehicle.position.set(x, 0, z);
            sceneManager.add(vehicle, false);
            this._stats.vehicleCount++;

            // Create collision data object for vehicles near storefront
            if (z >= -6 && z <= 8) {
                const col = vehicle.userData.collision || { halfWidth: 1.0, halfLength: 2.1, height: 1.4 };
                this._vehicleColliders.push({
                    type: 'vehicle',
                    position: new THREE.Vector3(x, 0, z),
                    halfWidth: col.halfWidth,
                    halfLength: col.halfLength,
                    height: col.height,
                    rotation: vehicle.rotation.y,
                    vehicleRef: vehicle,
                });
            }
        };

        for (let i = 0; i < northRowOccupancy.length; i++) {
            if (!northRowOccupancy[i]) continue;
            const x = startX + i * stallWidth + stallWidth / 2;
            const type = vehicleTypes[Math.floor(rng() * vehicleTypes.length)];
            placeVehicle(x, -4, type, 0, rng() > 0.9);
        }

        for (let i = 0; i < southRowOccupancy.length; i++) {
            if (!southRowOccupancy[i]) continue;
            const x = startX + i * stallWidth + stallWidth / 2;
            const type = vehicleTypes[Math.floor(rng() * vehicleTypes.length)];
            placeVehicle(x, 6, type, Math.PI, rng() > 0.85);
        }

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

        // One car taking up 1.4 spaces
        placeVehicle(6, -4, 'pickup', 0, true);
    }

    _placeCarts(sceneManager) {
        this._cartFactory = new ShoppingCart(this._materials, this._tracker);

        const cartReturn1 = new CartReturn(this._materials, this._cartFactory, this._tracker);
        cartReturn1.group.position.set(-8, 0, -6);
        this._tracker.trackObject(cartReturn1.group);
        sceneManager.add(cartReturn1.group, false);

        const cartReturn2 = new CartReturn(this._materials, this._cartFactory, this._tracker);
        cartReturn2.group.position.set(8, 0, -6);
        this._tracker.trackObject(cartReturn2.group);
        sceneManager.add(cartReturn2.group, false);

        // Stray carts (one will be the rolling cart)
        const strayCartPositions = [
            { x: -5, z: -1, rot: 0.3, rolling: true },
            { x: 3, z: 2, rot: -0.2, rolling: false },
            { x: 10, z: 0, rot: 0.5, rolling: false },
        ];
        for (const cp of strayCartPositions) {
            const cart = this._cartFactory.create();
            cart.position.set(cp.x, 0, cp.z);
            cart.rotation.y = cp.rot;
            sceneManager.add(cart, false);
            this._stats.cartCount++;

            if (cp.rolling) {
                this._rollingCart = cart;
                this._rollingCartState = {
                    velocity: 0,
                    direction: cp.rot,
                    paused: 2 + Math.random() * 3,
                    phase: 'moving',
                };
            }
        }
    }

    _placeLandscaping(sceneManager) {
        this._landscaping = new Landscaping(this._materials, this._tracker);
        const rng = seededRandom(77);

        const islands = [
            { x: -12, z: 0, w: 3, d: 4, trees: 1 },
            { x: 12, z: 0, w: 3, d: 4, trees: 1 },
            { x: 0, z: 8, w: 4, d: 3, trees: 2 },
            { x: -6, z: 8, w: 3, d: 3, trees: 1 },
            { x: 6, z: 8, w: 3, d: 3, trees: 1 },
        ];

        for (const island of islands) {
            const group = this._landscaping.createLandscapeIsland(
                island.x, island.z, island.w, island.d,
                { treeCount: island.trees, hasShrubs: true, rng }
            );
            this._tracker.trackObject(group);
            sceneManager.add(group, false);

            // Collect tree references for sway
            group.traverse((child) => {
                if (child.isGroup || (child.isMesh && child.geometry?.type === 'CylinderGeometry' && child.position.y > 1)) {
                    // Trunk reference - find parent group for sway
                    const treeGroup = child.parent?.parent || child.parent;
                    if (treeGroup && !this._trees.includes(treeGroup)) {
                        this._trees.push({
                            group: treeGroup,
                            baseRotation: treeGroup.rotation.clone(),
                            phase: Math.random() * Math.PI * 2,
                            freq: 0.3 + Math.random() * 0.2,
                            amplitude: 0.005 + Math.random() * 0.005,
                        });
                        this._stats.treeCount++;
                    }
                }
            });
        }

        // Distant tree line
        const treeLine = this._landscaping.createTreeLine(-30, -35, 20, 3, rng);
        this._tracker.trackObject(treeLine);
        sceneManager.add(treeLine, false);
    }

    _placeLightPoles(sceneManager) {
        const positions = [[-10, -4], [10, -4], [-10, 4], [10, 4], [0, 10]];
        const count = positions.length;
        const height = 8;
        const poleMat = this._materials.get('metalGalvanized');
        const fixtureMat = this._materials.get('metalDark');
        const concreteMat = this._materials.get('concrete');
        const lightMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0xffffee,
            emissive: 0xffffcc,
            emissiveIntensity: 0.05,
            roughness: 0.2,
        });

        // Pole cylinders
        const poleGeo = this._tracker.trackGeometry(
            new THREE.CylinderGeometry(0.06, 0.08, height, 8)
        );
        const poleInstances = new THREE.InstancedMesh(poleGeo, poleMat, count);
        poleInstances.castShadow = true;
        let dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i][0], height / 2, positions[i][1]);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            poleInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(poleInstances, false);

        // Base cylinders
        const baseGeo = this._tracker.trackGeometry(
            new THREE.CylinderGeometry(0.15, 0.18, 0.2, 8)
        );
        const baseInstances = new THREE.InstancedMesh(baseGeo, concreteMat, count);
        baseInstances.castShadow = true;
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i][0], 0.1, positions[i][1]);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            baseInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(baseInstances, false);

        // Arms
        const armGeo = this._tracker.trackGeometry(
            new THREE.BoxGeometry(2, 0.06, 0.06)
        );
        const armInstances = new THREE.InstancedMesh(armGeo, poleMat, count);
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i][0] + 0.8, height - 0.1, positions[i][1]);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            armInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(armInstances, false);

        // Lamp heads
        const lampGeo = this._tracker.trackGeometry(
            new THREE.BoxGeometry(1.2, 0.08, 0.5)
        );
        const lampInstances = new THREE.InstancedMesh(lampGeo, fixtureMat, count);
        lampInstances.castShadow = true;
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i][0] + 1.2, height - 0.2, positions[i][1]);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            lampInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(lampInstances, false);

        // Light surfaces (emissive)
        const lightGeo = this._tracker.trackGeometry(
            new THREE.PlaneGeometry(1.1, 0.4)
        );
        const lightInstances = new THREE.InstancedMesh(lightGeo, lightMat, count);
        dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            dummy.position.set(positions[i][0] + 1.2, height - 0.25, positions[i][1]);
            dummy.rotation.set(Math.PI / 2, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            lightInstances.setMatrixAt(i, dummy.matrix);
        }
        sceneManager.add(lightInstances, false);
    }

    _placeProps(sceneManager) {
        const metalMat = this._materials.get('metalDark');
        const trashCanPositions = [[-3, -6.5], [3, -6.5], [-8, -6], [8, -6]];

        for (const [x, z] of trashCanPositions) {
            const trashCan = new THREE.Group();
            const canBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.22, 0.7, 8),
                metalMat
            );
            canBody.position.y = 0.35;
            canBody.castShadow = true;
            trashCan.add(canBody);

            const lid = new THREE.Mesh(
                new THREE.CylinderGeometry(0.27, 0.27, 0.04, 8),
                this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                    color: 0x225522,
                    roughness: 0.7,
                })
            );
            lid.position.y = 0.72;
            trashCan.add(lid);

            trashCan.position.set(x + (Math.random() - 0.5) * 0.2, 0, z);
            this._tracker.trackObject(trashCan);
            sceneManager.add(trashCan, false);
        }

        // Bench
        const woodMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x886644,
            roughness: 0.8,
        });
        const bench = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.4), woodMat);
        seat.position.y = 0.45;
        seat.castShadow = true;
        bench.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), woodMat);
        back.position.set(0, 0.7, -0.18);
        back.castShadow = true;
        bench.add(back);

        for (const x of [-0.6, 0.6]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.35), metalMat);
            leg.position.set(x, 0.225, 0);
            leg.castShadow = true;
            bench.add(leg);
        }
        bench.position.set(5, 0, -6.5);
        bench.rotation.y = Math.PI / 6;
        this._tracker.trackObject(bench);
        sceneManager.add(bench, false);

        // Planter with dead plant
        const planterMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x996644,
            roughness: 0.9,
        });
        const planter = new THREE.Group();
        const planterBox = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), planterMat);
        planterBox.position.y = 0.25;
        planterBox.castShadow = true;
        planter.add(planterBox);

        const soil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), this._materials.get('mulch'));
        soil.position.y = 0.5;
        planter.add(soil);

        const deadPlant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.01, 0.4, 4),
            this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                color: 0x888844,
                roughness: 0.95,
            })
        );
        deadPlant.position.set(0.1, 0.7, 0.1);
        deadPlant.rotation.z = 0.3;
        planter.add(deadPlant);

        planter.position.set(-5, 0, -6.5);
        this._tracker.trackObject(planter);
        sceneManager.add(planter, false);
    }

    _placeSigns(sceneManager) {
        this._signFactory = new SignFactory(this._materials, this._tracker);

        const stopSign = this._signFactory.createStopSign(4, 16, -Math.PI / 4);
        this._tracker.trackObject(stopSign);
        sceneManager.add(stopSign, false);

        const fireSign1 = this._signFactory.createFireLaneSign(-10, -7, 0);
        this._tracker.trackObject(fireSign1);
        sceneManager.add(fireSign1, false);

        const fireSign2 = this._signFactory.createFireLaneSign(10, -7, 0);
        this._tracker.trackObject(fireSign2);
        sceneManager.add(fireSign2, false);

        const accessibleSign = this._signFactory.createAccessibleParkingSign(-2, -6.5, 0);
        this._tracker.trackObject(accessibleSign);
        sceneManager.add(accessibleSign, false);

        const arrowSign = this._signFactory.createDirectionalArrow(-12, 10, 'left', 'PARKING →');
        this._tracker.trackObject(arrowSign);
        sceneManager.add(arrowSign, false);
    }

    _buildHorizon(sceneManager) {
        const rng = seededRandom(55);

        for (let i = 0; i < 6; i++) {
            const w = 8 + rng() * 12;
            const h = 5 + rng() * 8;
            const d = 6 + rng() * 8;
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                this._tracker.createMaterial(THREE.MeshStandardMaterial, {
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
        const towerMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3,
        });

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

        const tank = new THREE.Mesh(
            new THREE.SphereGeometry(3, 12, 8),
            this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                color: 0x6688aa,
                roughness: 0.6,
                metalness: 0.2,
            })
        );
        tank.position.y = 16;
        tank.scale.y = 0.8;
        towerGroup.add(tank);

        towerGroup.position.set(25, 0, -35);
        this._tracker.trackObject(towerGroup);
        sceneManager.add(towerGroup, false);

        // Utility poles
        for (let i = 0; i < 5; i++) {
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.07, 8, 6),
                this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                    color: 0x664422,
                    roughness: 0.9,
                })
            );
            pole.position.set(-25 + i * 12, 4, -30);
            pole.castShadow = true;
            sceneManager.add(pole, false);

            const crossBar = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.06, 0.06),
                this._tracker.createMaterial(THREE.MeshStandardMaterial, {
                    color: 0x664422,
                    roughness: 0.9,
                })
            );
            crossBar.position.set(-25 + i * 12, 7.5, -30);
            sceneManager.add(crossBar, false);
        }
    }

    _buildDistantVehicle(sceneManager) {
        // Low-detail distant car for perimeter road motion
        const bodyMat = this._tracker.createMaterial(THREE.MeshStandardMaterial, {
            color: 0x446688,
            roughness: 0.5,
            metalness: 0.3,
        });

        this._distantVehicle = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 3), bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        this._distantVehicle.add(body);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.5), bodyMat);
        cabin.position.set(0, 0.9, -0.3);
        this._distantVehicle.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
        for (const [x, z] of [[-0.6, 1], [0.6, 1], [-0.6, -1], [0.6, -1]]) {
            const wheel = new THREE.Mesh(wheelGeo, this._materials.get('rubber'));
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(x, 0.25, z);
            this._distantVehicle.add(wheel);
        }

        this._distantVehicleT = 0;
        this._tracker.trackObject(this._distantVehicle);
        sceneManager.add(this._distantVehicle, false);
    }

    update(delta, playerPosition) {
        if (!playerPosition) return;

        this._updateDoors(delta, playerPosition);
        this._updateTreeSway(delta);
        this._updateRollingCart(delta);
        this._updateDistantVehicle(delta);
        this._updateHVAC(delta);
    }

    _updateDoors(delta, playerPosition) {
        if (!this._doors.left || !this._doors.right) return;

        const distToEntrance = Math.sqrt(
            playerPosition.x * playerPosition.x +
            (playerPosition.z + 9) * (playerPosition.z + 9)
        );

        const threshold = 6;
        const closeDelay = 2;

        if (distToEntrance < threshold) {
            this._doors.target = 1;
            this._doors.timer = 0;
        } else if (this._doors.target > 0) {
            this._doors.timer += delta;
            if (this._doors.timer > closeDelay) {
                this._doors.target = 0;
            }
        }

        const openAmount = 1.2;
        const speed = 3;

        if (this._doors.left) {
            const currentLeft = this._doors.left.position.x;
            const targetLeft = this._doors.leftBaseX - openAmount * this._doors.target;
            this._doors.left.position.x += (targetLeft - currentLeft) * Math.min(speed * delta, 1);
        }
        if (this._doors.right) {
            const currentRight = this._doors.right.position.x;
            const targetRight = this._doors.rightBaseX + openAmount * this._doors.target;
            this._doors.right.position.x += (targetRight - currentRight) * Math.min(speed * delta, 1);
        }
    }

    _updateTreeSway(delta) {
        for (const tree of this._trees) {
            tree.phase += delta * tree.freq;
            tree.group.rotation.z = tree.baseRotation.z + Math.sin(tree.phase) * tree.amplitude;
        }
    }

    _updateRollingCart(delta) {
        if (!this._rollingCart) return;

        if (this._rollingCartState.paused > 0) {
            this._rollingCartState.paused -= delta;
            return;
        }

        if (this._rollingCartState.phase === 'moving') {
            this._rollingCartState.velocity = 0.3;
            this._rollingCartState.phase = 'slowing';
        } else if (this._rollingCartState.phase === 'slowing') {
            this._rollingCartState.velocity *= 0.98;
            if (this._rollingCartState.velocity < 0.01) {
                this._rollingCartState.velocity = 0;
                this._rollingCartState.paused = 3 + Math.random() * 4;
                this._rollingCartState.phase = 'paused';
            }
        } else if (this._rollingCartState.phase === 'paused') {
            if (this._rollingCartState.paused <= 0) {
                this._rollingCartState.direction += (Math.random() - 0.5) * 0.3;
                this._rollingCartState.phase = 'moving';
            }
            return;
        }

        this._rollingCart.position.x += Math.cos(this._rollingCartState.direction) * this._rollingCartState.velocity * delta;
        this._rollingCart.position.z += Math.sin(this._rollingCartState.direction) * this._rollingCartState.velocity * delta;
        this._rollingCart.rotation.y = this._rollingCartState.direction;

        // Slight wobble
        this._rollingCart.rotation.z = Math.sin(performance.now() * 0.005) * 0.02;
    }

    _updateDistantVehicle(delta) {
        if (!this._distantVehicle) return;

        this._distantVehicleT += delta * 0.15;

        // Path along south access road (z ≈ 20, x from 25 to -15 and back)
        const x = 25 - (this._distantVehicleT % 80) * 0.5;
        const z = 20;

        this._distantVehicle.position.set(x, 0, z);
        this._distantVehicle.rotation.y = Math.PI; // Facing west
    }

    _updateHVAC(delta) {
        // Subtle fan rotation suggestion via slight scale oscillation
        const time = performance.now() * 0.001;
        for (const hvac of this._hvacFans) {
            hvac.mesh.scale.x = 1 + Math.sin(time + hvac.phase) * 0.02;
            hvac.mesh.scale.z = 1 + Math.cos(time + hvac.phase) * 0.02;
        }
    }

    getVehicleColliders() {
        return this._vehicleColliders;
    }

    getStats() {
        return {
            ...this._stats,
            vehicleColliders: this._vehicleColliders.length,
            ...this._tracker?.getStats() || {},
        };
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

    dispose() {
        if (this._tracker) {
            this._tracker.dispose();
        }
        if (this._materials) {
            this._materials.dispose();
        }
        if (this._vehicleFactory) {
            this._vehicleFactory.dispose();
        }
        if (this._cartFactory) {
            this._cartFactory.dispose();
        }
        this._doors = { left: null, right: null, state: 'closed', timer: 0, target: 0 };
        this._trees = [];
        this._rollingCart = null;
        this._distantVehicle = null;
        this._vehicleColliders = [];
        this._hvacFans = [];
    }
}
