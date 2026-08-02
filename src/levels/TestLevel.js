import * as THREE from 'three';
import { Level } from './Level.js';
import { ManagerKaren } from '../karens/ManagerKaren.js';
import { HOAKaren } from '../karens/HOAKaren.js';
import { SpawnDefinition } from '../systems/SpawnDirector.js';

export class TestLevel extends Level {
    constructor(assetManager) {
        super();
        this.name = 'Test Level - Suburban Retail';
        this.spawnPoint = new THREE.Vector3(0, 0, 10);
        this.assetManager = assetManager;
        this.spawnDirector = null;
    }

    async build(sceneManager) {
        this._setupLighting(sceneManager);
        this._setupGround(sceneManager);
        this._setupEnvironment(sceneManager);
    }

    _setupEnvironment(sceneManager) {
        this._buildParkingLot(sceneManager);
        this._buildStorefront(sceneManager);
        this._buildProps(sceneManager);
        this._buildLandscaping(sceneManager);
        this._buildCurbsAndSidewalks(sceneManager);
        this._buildSignage(sceneManager);
    }

    _buildParkingLot(sceneManager) {
        const lotGeo = new THREE.PlaneGeometry(24, 20);
        const lotMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.95,
            metalness: 0,
        });
        const lot = new THREE.Mesh(lotGeo, lotMat);
        lot.rotation.x = -Math.PI / 2;
        lot.position.set(0, 0.01, 0);
        lot.receiveShadow = true;
        sceneManager.add(lot, true);

        this._addParkingLines(sceneManager);
        this._addParkingStops(sceneManager);
    }

    _addParkingLines(sceneManager) {
        const lineMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0,
        });

        for (let row = -1; row <= 1; row += 2) {
            for (let i = -3; i <= 3; i++) {
                const lineGeo = new THREE.PlaneGeometry(0.12, 3.5);
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.rotation.x = -Math.PI / 2;
                line.position.set(i * 2.8, 0.02, row * 2);
                line.receiveShadow = true;
                sceneManager.add(line, false);
            }
        }

        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
        });
        for (let x of [-6, 0, 6]) {
            const arrowGeo = new THREE.PlaneGeometry(0.3, 0.8);
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.rotation.x = -Math.PI / 2;
            arrow.rotation.z = Math.PI;
            arrow.position.set(x, 0.02, 0);
            sceneManager.add(arrow, false);
        }
    }

    _addParkingStops(sceneManager) {
        const stopMat = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.9,
            metalness: 0.1,
        });

        for (let row of [-2, 2]) {
            for (let i = -3; i <= 3; i++) {
                const stopGeo = new THREE.BoxGeometry(1.5, 0.1, 0.15);
                const stop = new THREE.Mesh(stopGeo, stopMat);
                stop.position.set(i * 2.8, 0.05, row + (row > 0 ? 0.5 : -0.5));
                stop.castShadow = true;
                stop.receiveShadow = true;
                sceneManager.add(stop, true);
            }
        }
    }

    _buildStorefront(sceneManager) {
        this.addBox(sceneManager, 0, 0, -10, 14, 4.5, 1.5, 0x8B6914, true);

        this.addBox(sceneManager, 0, 0, -10.8, 14, 5, 0.3, 0xD2B48C, true);

        this.addBox(sceneManager, 0, 3, -11, 8, 1, 0.3, 0xcc0000, false);

        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512;
        signCanvas.height = 128;
        const ctx = signCanvas.getContext('2d');
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MEGA MART', 256, 64);

        const signTexture = new THREE.CanvasTexture(signCanvas);
        signTexture.needsUpdate = true;

        const signGeo = new THREE.PlaneGeometry(6, 1.5);
        const signMat = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: 0xff0000,
            emissiveIntensity: 0.1,
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 3, -10.9);
        sceneManager.add(sign, false);

        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.5,
        });

        for (let i = -2; i <= 2; i++) {
            const winGeo = new THREE.PlaneGeometry(1.2, 1.8);
            const win = new THREE.Mesh(winGeo, windowMat);
            win.position.set(i * 2.5, 1.5, -9.2);
            win.receiveShadow = true;
            sceneManager.add(win, false);
        }

        const doorFrameGeo = new THREE.BoxGeometry(1.8, 2.6, 0.2);
        const doorFrameMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.6,
        });
        const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
        doorFrame.position.set(0, 1.3, -9.2);
        sceneManager.add(doorFrame, true);

        const doorGeo = new THREE.PlaneGeometry(1.4, 2.4);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x4488cc,
            roughness: 0.3,
            metalness: 0.5,
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.2, -9.1);
        sceneManager.add(door, false);
    }

    _buildCurbsAndSidewalks(sceneManager) {
        const curbMat = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.85,
            metalness: 0.05,
        });

        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: 0xbbbbbb,
            roughness: 0.9,
            metalness: 0,
        });

        this.addBox(sceneManager, 0, 0, -7.5, 16, 0.15, 2.5, 0xbbbbbb, true);

        const longCurbGeo = new THREE.BoxGeometry(18, 0.15, 0.2);
        const longCurb = new THREE.Mesh(longCurbGeo, curbMat);
        longCurb.position.set(0, 0.075, -6.2);
        longCurb.castShadow = true;
        longCurb.receiveShadow = true;
        sceneManager.add(longCurb, true);

        for (let x of [-9, 9]) {
            const sideCurbGeo = new THREE.BoxGeometry(0.2, 0.15, 20);
            const sideCurb = new THREE.Mesh(sideCurbGeo, curbMat);
            sideCurb.position.set(x, 0.075, 0);
            sideCurb.castShadow = true;
            sideCurb.receiveShadow = true;
            sceneManager.add(sideCurb, true);
        }
    }

    _buildSignage(sceneManager) {
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.7,
        });

        const signPositions = [
            { x: -8, z: -6, text: 'P' },
            { x: 8, z: -6, text: 'COMPACT' },
        ];

        for (const sp of signPositions) {
            const signPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
            const signPole = new THREE.Mesh(signPoleGeo, poleMat);
            signPole.position.set(sp.x, 1.25, sp.z);
            signPole.castShadow = true;
            sceneManager.add(signPole, true);

            const signBoardGeo = new THREE.BoxGeometry(0.6, 0.6, 0.04);
            const signBoardMat = new THREE.MeshStandardMaterial({
                color: 0x0044aa,
                roughness: 0.4,
                metalness: 0.3,
            });
            const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
            signBoard.position.set(sp.x, 2.6, sp.z);
            signBoard.castShadow = true;
            sceneManager.add(signBoard, false);
        }
    }

    _buildProps(sceneManager) {
        this._buildShoppingCart(sceneManager, -4, 0, -2);
        this._buildShoppingCart(sceneManager, 3, 0, -3);
        this._buildShoppingCart(sceneManager, -2, 0, 3);
        this._buildCartCorral(sceneManager, 10, 0, -4);
        this._buildBench(sceneManager, 6, 0, 2);
        this._buildTrashCan(sceneManager, -7, 0, 3);
        this._buildTrashCan(sceneManager, 7, 0, 3);
        this._buildLightPole(sceneManager, -10, 0, -5);
        this._buildLightPole(sceneManager, 10, 0, -5);
        this._buildLightPole(sceneManager, -10, 0, 5);
        this._buildLightPole(sceneManager, 10, 0, 5);
        this._buildPlanter(sceneManager, 8, 0, -1);
        this._buildPlanter(sceneManager, -8, 0, -1);
        this._buildParkedCar(sceneManager, -5.6, 0, -2);
        this._buildParkedCar(sceneManager, 5.6, 0, -2);
        this._buildParkedCar(sceneManager, -5.6, 0, 2);
    }

    _buildShoppingCart(sceneManager, x, y, z) {
        const group = new THREE.Group();

        const basketMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.7,
        });

        const basketGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = 0.55;
        basket.castShadow = true;
        group.add(basket);

        const basketBottomGeo = new THREE.BoxGeometry(0.75, 0.02, 0.45);
        const basketBottom = new THREE.Mesh(basketBottomGeo, basketMat);
        basketBottom.position.y = 0.3;
        group.add(basketBottom);

        const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0.85, -0.35);
        group.add(handle);

        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 0.4 - Math.PI * 0.2;
        sceneManager.add(group, true);
    }

    _buildCartCorral(sceneManager, x, y, z) {
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.6,
            metalness: 0.8,
        });

        const railGeo1 = new THREE.CylinderGeometry(0.03, 0.03, 3, 6);
        const rail1 = new THREE.Mesh(railGeo1, railMat);
        rail1.position.set(x, 0.5, z);
        rail1.rotation.z = Math.PI / 2;
        sceneManager.add(rail1, true);

        const railGeo2 = new THREE.CylinderGeometry(0.03, 0.03, 3, 6);
        const rail2 = new THREE.Mesh(railGeo2, railMat);
        rail2.position.set(x, 1, z);
        rail2.rotation.z = Math.PI / 2;
        sceneManager.add(rail2, true);

        for (let dx of [-1.4, 1.4]) {
            const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6);
            const post = new THREE.Mesh(postGeo, railMat);
            post.position.set(x + dx, 0.6, z);
            sceneManager.add(post, true);
        }
    }

    _buildBench(sceneManager, x, y, z) {
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8B6914,
            roughness: 0.8,
            metalness: 0.1,
        });

        this.addBox(sceneManager, x, y, z, 2, 0.08, 0.5, 0x8B6914, true);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.5 });
        for (let lx of [-0.8, 0.8]) {
            const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45);
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x + lx, 0.225, z);
            leg.castShadow = true;
            sceneManager.add(leg, true);
        }
    }

    _buildTrashCan(sceneManager, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.25, 0.2, 0.8, 12);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.7,
            metalness: 0.3,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.4, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        sceneManager.add(mesh, true);
    }

    _buildLightPole(sceneManager, x, y, z) {
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.8,
        });

        const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 5, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 2.5, z);
        pole.castShadow = true;
        sceneManager.add(pole, true);

        const armGeo = new THREE.BoxGeometry(1.5, 0.06, 0.06);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(x, 5, z);
        arm.castShadow = true;
        sceneManager.add(arm, true);

        const lightGeo = new THREE.BoxGeometry(1.2, 0.1, 0.4);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffffee,
            emissive: 0xffffcc,
            emissiveIntensity: 0.3,
            roughness: 0.3,
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(x, 4.95, z);
        light.castShadow = true;
        sceneManager.add(light, true);
    }

    _buildPlanter(sceneManager, x, y, z) {
        this.addBox(sceneManager, x, y, z, 1.2, 0.6, 1.2, 0x8B4513, true);

        const plantMat = new THREE.MeshStandardMaterial({
            color: 0x2d7a27,
            roughness: 0.9,
            metalness: 0,
        });

        for (let i = 0; i < 4; i++) {
            const bushGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 8, 6);
            const bush = new THREE.Mesh(bushGeo, plantMat);
            bush.position.set(
                x + (Math.random() - 0.5) * 0.6,
                0.75 + Math.random() * 0.1,
                z + (Math.random() - 0.5) * 0.6
            );
            bush.castShadow = true;
            sceneManager.add(bush, false);
        }
    }

    _buildParkedCar(sceneManager, x, y, z) {
        const group = new THREE.Group();

        const bodyColors = [0xcc0000, 0x0044aa, 0x333333, 0xdddddd, 0x224422];
        const bodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];

        const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 3.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.7,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);

        const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 1.8);
        const cabinMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.7,
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.y = 0.95;
        cabin.position.z = -0.3;
        cabin.castShadow = true;
        group.add(cabin);

        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x668899,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.6,
        });

        const windshieldGeo = new THREE.PlaneGeometry(1.4, 0.5);
        const windshield = new THREE.Mesh(windshieldGeo, windowMat);
        windshield.position.set(0, 0.95, 0.65);
        windshield.rotation.x = -0.2;
        group.add(windshield);

        for (let wx of [-0.85, 0.85]) {
            const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
            for (let wz of [-1.2, 1.2]) {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(wx, 0.25, wz);
                wheel.castShadow = true;
                group.add(wheel);
            }
        }

        group.position.set(x, y, z);
        group.rotation.y = z < 0 ? Math.PI : 0;
        sceneManager.add(group, true);
    }

    _buildLandscaping(sceneManager) {
        const treePositions = [
            { x: -14, z: -7 },
            { x: 14, z: -7 },
            { x: -12, z: 5 },
            { x: 16, z: 3 },
            { x: -16, z: 0 },
            { x: 12, z: 8 },
            { x: -10, z: -8 },
            { x: 10, z: -8 },
        ];

        for (const pos of treePositions) {
            this._buildTree(sceneManager, pos.x, 0, pos.z);
        }

        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x4a7247,
            roughness: 0.95,
            metalness: 0,
        });
        const grassGeo = new THREE.PlaneGeometry(30, 30);
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(0, 0.005, 0);
        grass.receiveShadow = true;
        sceneManager.add(grass, false);
    }

    _buildTree(sceneManager, x, y, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.9,
            metalness: 0,
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 1.5, z);
        trunk.castShadow = true;
        sceneManager.add(trunk, true);

        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x2d6a1e,
            roughness: 0.85,
            metalness: 0,
        });

        for (let i = 0; i < 3; i++) {
            const size = 1.5 - i * 0.3;
            const foliageGeo = new THREE.SphereGeometry(size, 8, 6);
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.set(
                x + (Math.random() - 0.5) * 0.5,
                3 + i * 0.8,
                z + (Math.random() - 0.5) * 0.5
            );
            foliage.castShadow = true;
            sceneManager.add(foliage, true);
        }
    }

    getEnemies() {
        return [];
    }

    getSpawnDefinitions() {
        return [
            new SpawnDefinition({
                karenType: 'manager',
                position: new THREE.Vector3(2, 0, -3),
                patrolCenter: new THREE.Vector3(2, 0, -3),
                patrolRadius: 3,
                orientation: 0,
            }),
            new SpawnDefinition({
                karenType: 'manager',
                position: new THREE.Vector3(-5, 0, 0),
                patrolCenter: new THREE.Vector3(-5, 0, 0),
                patrolRadius: 2,
                orientation: Math.PI / 4,
            }),
            new SpawnDefinition({
                karenType: 'hoa',
                position: new THREE.Vector3(6, 0, 2),
                patrolCenter: new THREE.Vector3(6, 0, 2),
                patrolRadius: 2.5,
                orientation: -Math.PI / 3,
            }),
        ];
    }
}
