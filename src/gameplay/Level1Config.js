/**
 * Level 1 configuration — pacing, waves, triggers.
 */

export const PHASES = {
    INTRO: 'INTRO',
    WAVE_1: 'WAVE_1',
    BREATHER_1: 'BREATHER_1',
    WAVE_2: 'WAVE_2',
    BREATHER_2: 'BREATHER_2',
    WAVE_3: 'WAVE_3',
    FINAL_ESCALATION: 'FINAL_ESCALATION',
    VICTORY: 'VICTORY',
    DEFEAT: 'DEFEAT',
    RESULT: 'RESULT',
};

export const LEVEL_CONFIG = {
    introDuration: 3,
    breatherDuration: 14,
    breatherComposureRecovery: 20,

    wave1: {
        incident: 'INCIDENT 1',
        incidentSubtitle: 'MANAGEMENT CONCERN',
        objective: 'HANDLE THE COMPLAINT',
        enemies: [
            { type: 'manager', delay: 0, position: { x: -2, z: -5 }, patrolRadius: 3 },
        ],
        unlockWeapon: 'waterBalloon',
        unlockText: 'NEW CONFLICT RESOLUTION TOOL',
        unlockWeaponName: 'WATER BALLOON',
        unlockKey: '2',
        completeBonus: 500,
    },

    wave2: {
        incident: 'INCIDENT 2',
        incidentSubtitle: 'HOA JURISDICTION',
        objective: 'CROSS THE PARKING LOT',
        enemies: [
            { type: 'hoa', delay: 0, position: { x: 12, z: 0 }, patrolRadius: 3 },
            { type: 'manager', delay: 4, position: { x: 3, z: -3 }, patrolRadius: 2.5 },
        ],
        unlockWeapon: 'gardenGnome',
        unlockText: 'HEAVY MEDIATION AVAILABLE',
        unlockWeaponName: 'GARDEN GNOME',
        unlockKey: '3',
        completeBonus: 500,
    },

    wave3: {
        incident: 'INCIDENT 3',
        incidentSubtitle: 'RETURN POLICY',
        objective: 'RESOLVE THE RETURN',
        enemies: [
            { type: 'retail_return', delay: 0, position: { x: -8, z: -3 }, patrolRadius: 2.5 },
            { type: 'manager', delay: 3, position: { x: -2, z: -5 }, patrolRadius: 3 },
            { type: 'hoa', delay: 7, position: { x: 12, z: 0 }, patrolRadius: 3 },
        ],
        completeBonus: 500,
    },

    final: {
        incident: 'FINAL ESCALATION',
        incidentSubtitle: 'ALL AVAILABLE MANAGEMENT',
        objective: 'ENTER MEGA MART',
        enemies: [
            { type: 'manager', delay: 0, position: { x: -2, z: -5 }, patrolRadius: 3 },
            { type: 'hoa', delay: 4, position: { x: 12, z: 0 }, patrolRadius: 3 },
            { type: 'retail_return', delay: 8, position: { x: -8, z: -3 }, patrolRadius: 2.5 },
            { type: 'manager', delay: 12, position: { x: 3, z: -3 }, patrolRadius: 2.5 },
        ],
        abilityCooldownMultiplier: 0.85,
        movementSpeedMultiplier: 1.1,
        completeBonus: 1000,
    },

    defeatText: 'YOU BECAME THE INCIDENT',
    defeatSubtext: 'Management has been notified.',
    victoryText: 'INCIDENT RESOLVED',
    victorySubtext: 'YOU MAY NOW ENTER MEGA MART',
};

export const TRIGGER_ZONES = {
    entrance: { x: 0, z: -7, radius: 5 },
    landscape: { x: 0, z: 8, radius: 6 },
    cartReturn: { x: -8, z: -6, radius: 5 },
    finalZone: { x: 0, z: -9, radius: 4 },
};

export const RANKS = [
    { minScore: 5000, label: 'S', title: 'PARKING LOT DIPLOMAT' },
    { minScore: 3500, label: 'A', title: 'REGIONAL CONFLICT SPECIALIST' },
    { minScore: 2000, label: 'B', title: 'ASSISTANT TO THE ASSISTANT MANAGER' },
    { minScore: 1000, label: 'C', title: 'CUSTOMER OF CONCERN' },
    { minScore: 0, label: 'D', title: 'PENDING CORPORATE REVIEW' },
];

/**
 * Ability configuration — cooldowns and composure drain per archetype.
 * Values are in milliseconds for cooldowns, raw points for composure damage.
 * These are wired through to ability constructors at spawn time.
 */
export const ABILITY_CONFIG = {
    callManager: {
        cooldown: 25000,
        composureDamage: 15,
    },
    violationNotice: {
        cooldown: 20000,
        composureDamage: 12,
    },
    returnWithoutReceipt: {
        cooldown: 30000,
        composureDamage: 18,
    },
};
