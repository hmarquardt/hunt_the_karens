export const GRAVITY = -15;
export const PLAYER_HEIGHT = 1.7;
export const PLAYER_SPEED = 6;
export const PLAYER_JUMP_FORCE = 6;
export const MOUSE_SENSITIVITY = 0.002;
export const PROJECTILE_POOL_SIZE = 50;
export const MAX_PROJECTILE_LIFETIME = 8;
export const COLLISION_MARGIN = 0.3;
export const FLOOR_Y = 0;
export const RENDER_DISTANCE = 100;
export const SHADOW_MAP_SIZE = 2048;
export const DEBUG_KEY = 'F3';
export const RESET_KEY = 'r';
export const COMBO_TIMEOUT = 3000;
export const HIT_FEEDBACK_DURATION = 1500;
export const KAREN_RESPAWN_DELAY = 5000;
export const ENVIRONMENT = {
    fogColor: 0xc8d8e8,
    fogNear: 15,
    fogFar: 80,
    ambientIntensity: 0.4,
    sunIntensity: 1.5,
    sunColor: 0xfff4e0,
    skyColor: 0x87CEEB,
    groundColor: 0x5a7247,
};
export const CROC = {
    velocity: 22,
    gravity: GRAVITY,
    mass: 0.4,
    radius: 0.25,
    drag: 0.01,
    bounce: 0.4,
    cooldown: 600,
    baseDamage: 25,
    rotationSpeed: 8,
    color: 0x2d5a27,
};
