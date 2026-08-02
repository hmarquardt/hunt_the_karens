import * as THREE from 'three';
import * as CONSTANTS from '../config/constants.js';

export class Renderer {
    constructor() {
        this.camera = null;
        this.renderer = null;
        this.scene = new THREE.Scene();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            150
        );

        this.scene.background = new THREE.Color(CONSTANTS.ENVIRONMENT.fogColor);
        this.scene.fog = new THREE.Fog(
            CONSTANTS.ENVIRONMENT.fogColor,
            CONSTANTS.ENVIRONMENT.fogNear,
            CONSTANTS.ENVIRONMENT.fogFar
        );
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
