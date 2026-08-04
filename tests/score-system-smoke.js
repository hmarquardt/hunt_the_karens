// Pure ScoreSystem tests — no DOM, no WebGL, no Three.js.

import { ScoreSystem } from '../src/systems/ScoreSystem.js';

let passed = 0;
let failed = 0;

function assert(cond, label) {
    if (cond) { passed++; console.log(`  PASS: ${label}`); }
    else { failed++; console.error(`  FAIL: ${label}`); }
}

function assertEq(a, b, label) {
    assert(a === b, `${label}: expected "${b}", got "${a}"`);
}

console.log('\n=== Milestone 9 ScoreSystem Tests ===\n');

// 1. Initial state
{
    console.log('Test 1: Initial state');
    const ss = new ScoreSystem();
    assertEq(ss.score, 0, 'score starts at 0');
    assertEq(ss.combo, 0, 'combo starts at 0');
    assertEq(ss.totalHits, 0, 'totalHits starts at 0');
    assertEq(ss.totalMisses, 0, 'totalMisses starts at 0');
    assertEq(ss.totalDefeated, 0, 'totalDefeated starts at 0');
    assertEq(ss.getAccuracy(), 0, 'accuracy starts at 0');
}

// 2. Register hit increases score and combo
{
    console.log('\nTest 2: Register hit');
    const ss = new ScoreSystem();
    const result = ss.registerHit(100);
    assertEq(result.earned, 100, 'earned 100 points');
    assertEq(ss.combo, 1, 'combo is 1');
    assertEq(ss.totalHits, 1, 'totalHits is 1');
    assertEq(ss.getAccuracy(), 100, 'accuracy is 100%');
}

// 3. Combo multiplier
{
    console.log('\nTest 3: Combo multiplier');
    const ss = new ScoreSystem();
    ss.registerHit(100);
    ss.registerHit(100);
    ss.registerHit(100);
    assertEq(ss.combo, 3, 'combo is 3');
    // 4th hit: 100 * (1 + 3 * 0.25) = 100 * 1.75 = 175
    const result = ss.registerHit(100);
    assertEq(result.earned, 175, 'earned 175 with combo 4');
}

// 4. Register miss resets combo
{
    console.log('\nTest 4: Register miss resets combo');
    const ss = new ScoreSystem();
    ss.registerHit(100);
    ss.registerHit(100);
    assertEq(ss.combo, 2, 'combo is 2');
    ss.registerMiss();
    assertEq(ss.combo, 0, 'combo reset to 0');
    assertEq(ss.totalMisses, 1, 'totalMisses is 1');
    assertEq(ss.getAccuracy(), 67, 'accuracy is 67% (2/3)');
}

// 5. Multiple misses
{
    console.log('\nTest 5: Multiple misses');
    const ss = new ScoreSystem();
    ss.registerHit(100);
    ss.registerMiss();
    ss.registerMiss();
    ss.registerMiss();
    assertEq(ss.totalHits, 1, 'totalHits is 1');
    assertEq(ss.totalMisses, 3, 'totalMisses is 3');
    assertEq(ss.getAccuracy(), 25, 'accuracy is 25% (1/4)');
}

// 6. Register defeat
{
    console.log('\nTest 6: Register defeat');
    const ss = new ScoreSystem();
    const result = ss.registerDefeat(100);
    // combo is 0: multiplier = 1 + (-1) * 0.25 = 0.75
    assertEq(result.earned, 75, 'earned 75 points (combo 0 gives 0.75x)');
    assertEq(ss.totalDefeated, 1, 'totalDefeated is 1');
}

// 7. Accuracy with only misses
{
    console.log('\nTest 7: Accuracy with only misses');
    const ss = new ScoreSystem();
    ss.registerMiss();
    ss.registerMiss();
    assertEq(ss.getAccuracy(), 0, 'accuracy is 0% (0/2)');
}

// 8. Reset
{
    console.log('\nTest 8: Reset');
    const ss = new ScoreSystem();
    ss.registerHit(100);
    ss.registerMiss();
    ss.registerDefeat(100);
    ss.reset();
    assertEq(ss.score, 0, 'score reset');
    assertEq(ss.combo, 0, 'combo reset');
    assertEq(ss.totalHits, 0, 'totalHits reset');
    assertEq(ss.totalMisses, 0, 'totalMisses reset');
    assertEq(ss.totalDefeated, 0, 'totalDefeated reset');
}

// 9. Accuracy with no shots
{
    console.log('\nTest 9: Accuracy with no shots');
    const ss = new ScoreSystem();
    assertEq(ss.getAccuracy(), 0, 'accuracy is 0 with no shots');
}

// 10. Miss does not affect score
{
    console.log('\nTest 10: Miss does not affect score');
    const ss = new ScoreSystem();
    ss.registerHit(100);
    const scoreBefore = ss.score;
    ss.registerMiss();
    assertEq(ss.score, scoreBefore, 'score unchanged after miss');
}

console.log('\n==========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('SCORESYSTEM TESTS FAILED');
    process.exit(1);
} else {
    console.log('ALL SCORESYSTEM TESTS PASSED');
}
