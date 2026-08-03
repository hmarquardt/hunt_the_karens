import * as THREE from 'three';

function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export class Landscaping {
    constructor(materials, resourceTracker) {
        this.materials = materials;
        this.tracker = resourceTracker;
        this._treeSeed = 42;

        // Shared geometries for trees
        this._trunkGeo = this.tracker.trackGeometry(
            new THREE.CylinderGeometry(0.07, 0.1, 1.2, 8)
        );
        this._foliageGeo = this.tracker.trackGeometry(
            new THREE.SphereGeometry(1, 8, 6)
        );
    }

    createLandscapeIsland(x, z, width, depth, options = {}) {
        const { treeCount = 1, hasShrubs = true, rng } = options;
        const rngFn = rng || (() => Math.random());
        const group = new THREE.Group();

        // Mulch bed
        const mulchMat = this.materials.get('mulch');
        const mulch = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.15, depth),
            mulchMat
        );
        mulch.position.set(x, 0.075, z);
        mulch.receiveShadow = true;
        group.add(mulch);

        // Curb
        const concreteMat = this.materials.get('concrete');
        const curbHeight = 0.15;

        // Front/back curbs
        for (const zb of [-1, 1]) {
            const curb = new THREE.Mesh(
                new THREE.BoxGeometry(width + 0.2, curbHeight, 0.15),
                concreteMat
            );
            curb.position.set(x, curbHeight / 2, z + zb * depth / 2);
            curb.castShadow = true;
            curb.receiveShadow = true;
            group.add(curb);
        }

        // Side curbs
        for (const xb of [-1, 1]) {
            const curb = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, curbHeight, depth),
                concreteMat
            );
            curb.position.set(x + xb * width / 2, curbHeight / 2, z);
            curb.castShadow = true;
            curb.receiveShadow = true;
            group.add(curb);
        }

        // Trees
        for (let i = 0; i < treeCount; i++) {
            const tx = x + (rngFn() - 0.5) * width * 0.6;
            const tz = z + (rngFn() - 0.5) * depth * 0.6;
            const tree = this.createTree(rngFn);
            tree.position.set(tx, 0.15, tz);
            group.add(tree);
        }

        // Shrubs
        if (hasShrubs) {
            const shrubPositions = [
                [x - width / 2 + 0.5, z],
                [x + width / 2 - 0.5, z],
                [x, z - depth / 2 + 0.5],
                [x, z + depth / 2 - 0.5],
            ];
            for (const [sx, sz] of shrubPositions) {
                const shrub = this.createShrub(rngFn);
                shrub.position.set(sx, 0.15, sz);
                group.add(shrub);
            }
        }

        return group;
    }

    createTree(rng) {
        const group = new THREE.Group();
        const rngFn = rng || (() => Math.random());

        const height = 3 + rngFn() * 2;
        const trunkRadius = 0.1 + rngFn() * 0.05;
        const barkMat = this.materials.get('treeBark');
        const foliageMat = this.materials.get('foliage');
        const foliageMat2 = this.materials.get('foliageDark');

        // Trunk with shared geometry, scale for size variation
        const trunk = new THREE.Mesh(this._trunkGeo, barkMat);
        trunk.scale.set(
            trunkRadius / 0.085,
            height * 0.4 / 1.2,
            trunkRadius / 0.085
        );
        trunk.position.y = height * 0.2;
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage masses (irregular) with shared geometry
        const foliageCount = 3 + Math.floor(rngFn() * 3);
        for (let i = 0; i < foliageCount; i++) {
            const size = 0.8 + rngFn() * 1.2;
            const mat = rngFn() > 0.5 ? foliageMat : foliageMat2;
            const foliage = new THREE.Mesh(this._foliageGeo, mat);
            foliage.position.set(
                (rngFn() - 0.5) * 1.5,
                height * 0.4 + rngFn() * height * 0.4,
                (rngFn() - 0.5) * 1.5
            );
            foliage.scale.set(
                size * (0.7 + rngFn() * 0.6),
                size * (0.6 + rngFn() * 0.5),
                size * (0.7 + rngFn() * 0.6)
            );
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            group.add(foliage);
        }

        group.rotation.y = rngFn() * Math.PI * 2;

        return group;
    }

    createShrub(rng) {
        const group = new THREE.Group();
        const rngFn = rng || (() => Math.random());

        const foliageMat = this.materials.get('foliage');
        const count = 2 + Math.floor(rngFn() * 2);

        for (let i = 0; i < count; i++) {
            const size = 0.3 + rngFn() * 0.3;
            const shrub = new THREE.Mesh(this._foliageGeo, foliageMat);
            shrub.position.set(
                (rngFn() - 0.5) * 0.4,
                size * 0.6,
                (rngFn() - 0.5) * 0.4
            );
            shrub.scale.set(size, size * (0.6 + rngFn() * 0.3), size);
            shrub.castShadow = true;
            shrub.receiveShadow = true;
            group.add(shrub);
        }

        return group;
    }

    createLightPole(x, z) {
        const group = new THREE.Group();
        const poleMat = this.materials.get('metalGalvanized');
        const fixtureMat = this.materials.get('metalDark');

        const height = 8;

        // Pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, height, 8),
            poleMat
        );
        pole.position.y = height / 2;
        pole.castShadow = true;
        group.add(pole);

        // Base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.18, 0.2, 8),
            this.materials.get('concrete')
        );
        base.position.y = 0.1;
        base.castShadow = true;
        group.add(base);

        // Arm
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.06, 0.06),
            poleMat
        );
        arm.position.set(0.8, height - 0.1, 0);
        group.add(arm);

        // Lamp head
        const lampHead = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.08, 0.5),
            fixtureMat
        );
        lampHead.position.set(1.2, height - 0.2, 0);
        lampHead.castShadow = true;
        group.add(lampHead);

        // Light surface
        const lightSurface = new THREE.Mesh(
            new THREE.PlaneGeometry(1.1, 0.4),
            new THREE.MeshStandardMaterial({
                color: 0xffffee,
                emissive: 0xffffcc,
                emissiveIntensity: 0.05,
                roughness: 0.2,
            })
        );
        lightSurface.rotation.x = Math.PI / 2;
        lightSurface.position.set(1.2, height - 0.25, 0);
        group.add(lightSurface);

        group.position.set(x, 0, z);
        return group;
    }

    createDistantTree(x, z, rng) {
        const height = 4 + rng() * 4;
        const geo = this.tracker.trackGeometry(
            new THREE.ConeGeometry(1, 1, 6)
        );
        const tree = new THREE.Mesh(geo, this.materials.get('foliageDark'));
        tree.scale.set(1 + rng() * 0.5, height, 1 + rng() * 0.5);
        tree.position.set(x, height / 2, z);
        tree.castShadow = true;
        return tree;
    }

    createTreeLine(startX, z, count, spacing, rng) {
        const group = new THREE.Group();
        for (let i = 0; i < count; i++) {
            const x = startX + i * spacing + (rng() - 0.5) * 2;
            group.add(this.createDistantTree(x, z + (rng() - 0.5) * 3, rng));
        }
        return group;
    }
}
