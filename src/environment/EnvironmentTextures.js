import * as THREE from 'three';

function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export function createAsphaltTexture(size = 512, seed = 42) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const rng = seededRandom(seed);

    // Base dark asphalt
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, size, size);

    // Aggregate noise
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (rng() - 0.5) * 20;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Lighter aggregate spots
    for (let i = 0; i < 200; i++) {
        const x = rng() * size;
        const y = rng() * size;
        const r = rng() * 2 + 0.5;
        const brightness = 50 + rng() * 30;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Subtle tire wear streaks
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) {
        const y = rng() * size;
        ctx.fillStyle = '#555555';
        ctx.fillRect(0, y, size, rng() * 3 + 1);
    }
    ctx.globalAlpha = 1;

    // Oil spots
    for (let i = 0; i < 3; i++) {
        const x = rng() * size;
        const y = rng() * size;
        const r = rng() * 20 + 10;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, 'rgba(20, 20, 25, 0.3)');
        gradient.addColorStop(1, 'rgba(20, 20, 25, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Patch repair
    const patchX = rng() * size;
    const patchY = rng() * size;
    const patchW = rng() * 40 + 30;
    const patchH = rng() * 30 + 20;
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(patchX - patchW / 2, patchY - patchH / 2, patchW, patchH);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(patchX - patchW / 2, patchY - patchH / 2, patchW, patchH);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function createConcreteTexture(size = 256, seed = 123) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const rng = seededRandom(seed);

    ctx.fillStyle = '#b0b0a8';
    ctx.fillRect(0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (rng() - 0.5) * 15;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Expansion joints
    ctx.strokeStyle = '#999990';
    ctx.lineWidth = 1;
    for (let x = 0; x < size; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x + rng() * 2, 0);
        ctx.lineTo(x + rng() * 2, size);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function createSignTexture(text, subtext, options = {}) {
    const {
        width = 512,
        height = 128,
        bgColor = '#cc2200',
        textColor = '#ffffff',
        subtextColor = '#ffffff',
        fontFamily = 'sans-serif',
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (text) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.floor(height * 0.45)}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, subtext ? height * 0.35 : height / 2);
    }

    if (subtext) {
        ctx.fillStyle = subtextColor;
        ctx.font = `${Math.floor(height * 0.2)}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subtext, width / 2, height * 0.7);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function createAccessibleSignTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Blue background
    ctx.fillStyle = '#0055a4';
    ctx.fillRect(0, 0, size, size);

    // White border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Wheelchair symbol (simplified)
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.3;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Seat
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.2);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.2);
    ctx.stroke();

    // Back
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.2);
    ctx.lineTo(cx - r * 0.4, cy - r * 0.2);
    ctx.stroke();

    // Wheels
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy + r * 0.45, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy + r * 0.45, r * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
