// Pure level-flow tests — no DOM, no WebGL, no Three.js.
// Tests the LevelFlowController FSM logic.

import { LevelFlowController } from '../src/gameplay/LevelFlowController.js';
import { PHASES, LEVEL_CONFIG } from '../src/gameplay/Level1Config.js';

let passed = 0;
let failed = 0;

function assert(cond, label) {
    if (cond) { passed++; console.log(`  PASS: ${label}`); }
    else { failed++; console.error(`  FAIL: ${label}`); }
}

function assertEq(a, b, label) {
    assert(a === b, `${label}: expected "${b}", got "${a}"`);
}

console.log('\n=== Milestone 8 Level Flow Tests ===\n');

// 1. Initial state is INTRO
{
    console.log('Test 1: Initial state is INTRO');
    const ctrl = new LevelFlowController();
    assertEq(ctrl.getPhase(), PHASES.INTRO, 'starts in INTRO');
    assertEq(ctrl.getObjective(), 'MAKE IT TO THE ENTRANCE', 'intro objective');
}

// 2. INTRO transitions to WAVE_1 after introDuration
{
    console.log('\nTest 2: INTRO → WAVE_1 transition');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.WAVE_1, 'transitions to WAVE_1');
}

// 3. WAVE_1 has correct pending spawns
{
    console.log('\nTest 3: WAVE_1 has correct enemies');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    const spawns = ctrl.consumePendingSpawns();
    assert(spawns.length === 1, `1 pending spawn, got ${spawns.length}`);
    assert(spawns[0].type === 'manager', 'spawn type is manager');
}

// 4. Wave completion triggers BREATHER_1
{
    console.log('\nTest 4: WAVE_1 complete → BREATHER_1');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    ctrl.consumePendingSpawns();
    ctrl._activeEnemies = [];
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.BREATHER_1, 'transitions to BREATHER_1');
}

// 5. Breather transitions to WAVE_2
{
    console.log('\nTest 5: BREATHER_1 → WAVE_2');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    ctrl.consumePendingSpawns();
    ctrl._activeEnemies = [];
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.BREATHER_1, 'in BREATHER_1');
    ctrl.update(LEVEL_CONFIG.breatherDuration + 0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.WAVE_2, 'transitions to WAVE_2');
}

// 6. Wave 2 has HOA + Manager
{
    console.log('\nTest 6: WAVE_2 has correct enemies');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    ctrl.consumePendingSpawns();
    ctrl._activeEnemies = [];
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    ctrl.update(LEVEL_CONFIG.breatherDuration + 0.1, { x: 0, z: 12 }, 100);
    const spawns = ctrl.consumePendingSpawns();
    assert(spawns.length >= 1, `at least 1 immediate spawn, got ${spawns.length}`);
    assert(ctrl._pendingSpawns.length >= 1, 'at least 1 delayed spawn');
}

// 7. BREATHER_2 → WAVE_3 (direct phase set)
{
    console.log('\nTest 7: BREATHER_2 → WAVE_3 (direct phase set)');
    const ctrl = new LevelFlowController();
    ctrl.phase = PHASES.BREATHER_2;
    ctrl.phaseTime = LEVEL_CONFIG.breatherDuration + 0.1;
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.WAVE_3, 'transitions to WAVE_3');
}

// 8. WAVE_3 → FINAL_ESCALATION (direct phase set)
{
    console.log('\nTest 8: WAVE_3 → FINAL_ESCALATION (direct phase set)');
    const ctrl = new LevelFlowController();
    ctrl.phase = PHASES.WAVE_3;
    ctrl._activeEnemies = [];
    ctrl._pendingSpawns = [];
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.FINAL_ESCALATION, 'transitions to FINAL_ESCALATION');
}

// 9. FINAL_ESCALATION → VICTORY (direct phase set)
{
    console.log('\nTest 9: FINAL_ESCALATION → VICTORY (direct phase set)');
    const ctrl = new LevelFlowController();
    ctrl.phase = PHASES.FINAL_ESCALATION;
    ctrl._activeEnemies = [];
    ctrl._pendingSpawns = [];
    ctrl.update(0.1, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.VICTORY, 'transitions to VICTORY');
}

// 10. triggerDefeat → DEFEAT
{
    console.log('\nTest 10: triggerDefeat → DEFEAT');
    const ctrl = new LevelFlowController();
    ctrl.triggerDefeat();
    assertEq(ctrl.getPhase(), PHASES.DEFEAT, 'transitions to DEFEAT');
}

// 11. No transitions after VICTORY
{
    console.log('\nTest 11: No transitions after VICTORY');
    const ctrl = new LevelFlowController();
    ctrl.phase = PHASES.VICTORY;
    ctrl.update(100, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.VICTORY, 'stays in VICTORY');
}

// 12. No transitions after DEFEAT
{
    console.log('\nTest 12: No transitions after DEFEAT');
    const ctrl = new LevelFlowController();
    ctrl.phase = PHASES.DEFEAT;
    ctrl.update(100, { x: 0, z: 12 }, 100);
    assertEq(ctrl.getPhase(), PHASES.DEFEAT, 'stays in DEFEAT');
}

// 13. reset returns to INTRO
{
    console.log('\nTest 13: reset returns to INTRO');
    const ctrl = new LevelFlowController();
    ctrl.triggerDefeat();
    ctrl.reset();
    assertEq(ctrl.getPhase(), PHASES.INTRO, 'back to INTRO');
    assertEq(ctrl.phaseTime, 0, 'phaseTime reset');
    assertEq(ctrl.runTime, 0, 'runTime reset');
}

// 14. isWaveActive correct
{
    console.log('\nTest 14: isWaveActive');
    const ctrl = new LevelFlowController();
    assert(!ctrl.isWaveActive(), 'INTRO not wave active');
    ctrl.phase = PHASES.WAVE_1;
    assert(ctrl.isWaveActive(), 'WAVE_1 is wave active');
    ctrl.phase = PHASES.BREATHER_1;
    assert(!ctrl.isWaveActive(), 'BREATHER_1 not wave active');
    ctrl.phase = PHASES.FINAL_ESCALATION;
    assert(ctrl.isWaveActive(), 'FINAL_ESCALATION is wave active');
    ctrl.phase = PHASES.VICTORY;
    assert(!ctrl.isWaveActive(), 'VICTORY not wave active');
}

// 15. isTerminal correct
{
    console.log('\nTest 15: isTerminal');
    const ctrl = new LevelFlowController();
    assert(!ctrl.isTerminal(), 'INTRO not terminal');
    ctrl.phase = PHASES.WAVE_1;
    assert(!ctrl.isTerminal(), 'WAVE_1 not terminal');
    ctrl.phase = PHASES.VICTORY;
    assert(ctrl.isTerminal(), 'VICTORY is terminal');
    ctrl.phase = PHASES.DEFEAT;
    assert(ctrl.isTerminal(), 'DEFEAT is terminal');
    ctrl.phase = PHASES.RESULT;
    assert(ctrl.isTerminal(), 'RESULT is terminal');
}

// 16. Weapon unlocks after waves
{
    console.log('\nTest 16: Weapon unlocks');
    const ctrl = new LevelFlowController();
    let unlocks = ctrl.getWeaponUnlocks();
    assert(unlocks.croc === true, 'croc unlocked initially');
    assert(unlocks.waterBalloon === false, 'waterBalloon locked initially');
    assert(unlocks.gardenGnome === false, 'gardenGnome locked initially');

    // Simulate WAVE_1 completion
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1);
    ctrl.consumePendingSpawns();
    ctrl._activeEnemies = [];
    ctrl.update(0.1);
    // Weapon unlock is processed on next update
    ctrl.update(0.1);
    const unlocksAfter = ctrl.getWeaponUnlocks();
    assert(unlocksAfter.waterBalloon === true, 'waterBalloon unlocked after WAVE_1');

    // Verify transition has weaponType property
    const ts = ctrl.popTransitions();
    const unlock = ts.find(t => t.type === 'weapon_unlock');
    assert(unlock !== undefined, 'weapon_unlock transition exists');
    assert(unlock?.weaponType === 'waterBalloon', 'weaponType is waterBalloon');
}

// 17. Composure recovery during breather
{
    console.log('\nTest 17: Composure recovery during breather');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1, { x: 0, z: 12 }, 100);
    ctrl.consumePendingSpawns();
    ctrl._activeEnemies = [];
    ctrl.update(0.1);
    assertEq(ctrl.getPhase(), PHASES.BREATHER_1, 'in BREATHER_1');

    // Pass low composure to trigger recovery
    ctrl.update(1, { x: 0, z: 12 }, 60);
    const ts = ctrl.popTransitions();
    const recovery = ts.find(t => t.type === 'composure_recovery');
    assert(recovery !== undefined, 'composure recovery transition');
    assert(recovery?.amount === LEVEL_CONFIG.breatherComposureRecovery, 'correct recovery amount');

    // Second update should not trigger again
    ctrl.update(1, { x: 0, z: 12 }, 60);
    const ts2 = ctrl.popTransitions();
    const recovery2 = ts2.find(t => t.type === 'composure_recovery');
    assert(recovery2 === undefined, 'no duplicate recovery');
}

// 18. Debug info
{
    console.log('\nTest 18: Debug info');
    const ctrl = new LevelFlowController();
    const info = ctrl.getDebugInfo();
    assert(info.phase === PHASES.INTRO, 'phase in debug info');
    assert(typeof info.phaseTime === 'string', 'phaseTime in debug info');
    assert(typeof info.runTime === 'string', 'runTime in debug info');
    assert(typeof info.enemiesAlive === 'number', 'enemiesAlive in debug info');
}

// 19. Pop transitions are consumed
{
    console.log('\nTest 19: Pop transitions are consumed');
    const ctrl = new LevelFlowController();
    ctrl.update(LEVEL_CONFIG.introDuration + 0.1);
    const t1 = ctrl.popTransitions();
    assert(t1.length > 0, 'first pop has transitions');
    const t2 = ctrl.popTransitions();
    assert(t2.length === 0, 'second pop is empty');
}

// 20. getObjective for all phases
{
    console.log('\nTest 20: getObjective for all phases');
    const ctrl = new LevelFlowController();
    assert(ctrl.getObjective() === 'MAKE IT TO THE ENTRANCE', 'INTRO objective');
    ctrl.phase = PHASES.WAVE_1;
    assert(ctrl.getObjective() === LEVEL_CONFIG.wave1.objective, 'WAVE_1 objective');
    ctrl.phase = PHASES.BREATHER_1;
    assert(ctrl.getObjective() === 'CATCH YOUR BREATH', 'BREATHER_1 objective');
    ctrl.phase = PHASES.WAVE_2;
    assert(ctrl.getObjective() === LEVEL_CONFIG.wave2.objective, 'WAVE_2 objective');
    ctrl.phase = PHASES.FINAL_ESCALATION;
    assert(ctrl.getObjective() === LEVEL_CONFIG.final.objective, 'FINAL objective');
    ctrl.phase = PHASES.VICTORY;
    assert(ctrl.getObjective() === LEVEL_CONFIG.victoryText, 'VICTORY objective');
    ctrl.phase = PHASES.DEFEAT;
    assert(ctrl.getObjective() === LEVEL_CONFIG.defeatText, 'DEFEAT objective');
}

console.log('\n==========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('LEVEL FLOW TESTS FAILED');
    process.exit(1);
} else {
    console.log('ALL LEVEL FLOW TESTS PASSED');
    process.exit(0);
}
