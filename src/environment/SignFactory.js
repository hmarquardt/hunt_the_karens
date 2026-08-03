import * as THREE from 'three';
import { createSignTexture, createAccessibleSignTexture } from './EnvironmentTextures.js';

export class SignFactory {
    constructor(materials) {
        this.materials = materials;
    }

    createStopSign(x, z, rotation = 0) {
        const group = new THREE.Group();

        // Post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6),
            this.materials.get('metalGalvanized')
        );
        post.position.y = 1.25;
        post.castShadow = true;
        group.add(post);

        // Sign face (octagonal approximation)
        const signGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 8);
        const sign = new THREE.Mesh(
            signGeo,
            new THREE.MeshStandardMaterial({
                color: 0xcc0000,
                roughness: 0.6,
                metalness: 0.1,
            })
        );
        sign.position.y = 2.5;
        sign.castShadow = true;
        group.add(sign);

        // White border
        const border = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.32, 0.045, 8),
            this.materials.get('paintWhite')
        );
        border.position.y = 2.5;
        group.add(border);

        // STOP text
        const stopTexture = createSignTexture('STOP', '', {
            width: 128,
            height: 128,
            bgColor: '#cc0000',
            textColor: '#ffffff',
        });
        const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 0.55),
            new THREE.MeshStandardMaterial({
                map: stopTexture,
                transparent: true,
            })
        );
        textPlane.position.y = 2.5;
        textPlane.position.z = 0.03;
        group.add(textPlane);

        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        return group;
    }

    createFireLaneSign(x, z, rotation = 0) {
        const group = new THREE.Group();

        // Post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 2, 6),
            this.materials.get('metalGalvanized')
        );
        post.position.y = 1;
        group.add(post);

        // Sign
        const signTexture = createSignTexture('FIRE LANE', 'NO PARKING', {
            width: 256,
            height: 128,
            bgColor: '#ffffff',
            textColor: '#cc0000',
            subtextColor: '#cc0000',
        });
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.3),
            new THREE.MeshStandardMaterial({
                map: signTexture,
                side: THREE.DoubleSide,
            })
        );
        sign.position.y = 1.9;
        group.add(sign);

        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        return group;
    }

    createAccessibleParkingSign(x, z, rotation = 0) {
        const group = new THREE.Group();

        // Post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6),
            this.materials.get('metalGalvanized')
        );
        post.position.y = 0.9;
        group.add(post);

        // Sign
        const signTexture = createAccessibleSignTexture(256);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.4, 0.4),
            new THREE.MeshStandardMaterial({
                map: signTexture,
                side: THREE.DoubleSide,
            })
        );
        sign.position.y = 1.7;
        group.add(sign);

        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        return group;
    }

    createDirectionalArrow(x, z, direction = 'forward', text = '') {
        const group = new THREE.Group();

        // Post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6),
            this.materials.get('metalGalvanized')
        );
        post.position.y = 0.75;
        group.add(post);

        const arrowTexture = createSignTexture(text || '→', '', {
            width: 128,
            height: 64,
            bgColor: '#228833',
            textColor: '#ffffff',
        });
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.25),
            new THREE.MeshStandardMaterial({
                map: arrowTexture,
                side: THREE.DoubleSide,
            })
        );
        sign.position.y = 1.4;
        group.add(sign);

        group.position.set(x, 0, z);
        return group;
    }

    createPaintedArrow(x, z, rotation = 0) {
        // Create an arrow painted on the ground
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(52, 50);
        ctx.lineTo(40, 50);
        ctx.lineTo(40, 110);
        ctx.lineTo(24, 110);
        ctx.lineTo(24, 50);
        ctx.lineTo(12, 50);
        ctx.closePath();
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const arrow = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 2),
            new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                roughness: 0.8,
            })
        );
        arrow.rotation.x = -Math.PI / 2;
        arrow.rotation.z = rotation;
        arrow.position.set(x, 0.025, z);
        return arrow;
    }

    createPaintedFireLane(x, z, length, rotation = 0) {
        const group = new THREE.Group();

        // Red painted area
        const paintMat = new THREE.MeshStandardMaterial({
            color: 0xcc4400,
            roughness: 0.8,
        });
        const paint = new THREE.Mesh(
            new THREE.PlaneGeometry(length, 0.3),
            paintMat
        );
        paint.rotation.x = -Math.PI / 2;
        paint.rotation.z = rotation;
        paint.position.set(x, 0.025, z);
        group.add(paint);

        return group;
    }
}
