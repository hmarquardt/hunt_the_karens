import * as CONSTANTS from './constants.js';

export const WEAPON_DEFS = {
    croc: {
        id: 'croc',
        name: 'Croc',
        projectileModel: 'croc',
        velocity: 22,
        gravity: CONSTANTS.GRAVITY,
        mass: 0.4,
        radius: 0.25,
        drag: 0.01,
        bounce: 0.4,
        cooldown: 600,
        ammo: Infinity,
        spread: 0.02,
        baseDamage: 25,
        statusEffect: null,
        rotationSpeed: 8,
    },
};

export const PROJECTILE_MODELS = {
    croc: {
        color: 0x2d5a27,
        emissive: 0x1a3a18,
        scale: [0.35, 0.12, 0.18],
    },
};
