// Milestone 7.1 Collision Math Smoke Tests
// Imports the production CollisionMath module directly.
// Pure math tests — no DOM, no WebGL.

import { segmentAabbIntersect } from '../src/math/CollisionMath.js';

let passed = 0;
let failed = 0;

function assert(cond, label) {
    if (cond) { passed++; console.log(`  PASS: ${label}`); }
    else { failed++; console.error(`  FAIL: ${label}`); }
}

function assertNear(a, b, eps, label) {
    assert(Math.abs(a - b) < eps, label);
}

const hw = 1;
const hl = 2;
const h = 1.5;
const r = 0.25;
const minX = -hw - r;
const maxX = hw + r;
const minY = -r;
const maxY = h + r;
const minZ = -hl - r;
const maxZ = hl + r;

console.log('\n=== Milestone 7.1 Collision Math Smoke Tests ===\n');

// 1. Direct front hit
{
    console.log('Test 1: Direct front hit');
    const s = { x: 0, y: 1, z: 5 };
    const e = { x: 0, y: 1, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.localNormal.z === 1, 'normal points +Z (front face)');
    assertNear(r.localPoint.z, maxZ, 0.01, 'hit point at front face');
}

// 2. Side hit
{
    console.log('\nTest 2: Side hit');
    const s = { x: 5, y: 1, z: 0 };
    const e = { x: -5, y: 1, z: 0 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.localNormal.x === 1, 'normal points +X (outward from maxX entry face)');
    assertNear(r.localPoint.x, maxX, 0.01, 'hit point at side face');
}

// 3. Above vehicle (miss)
{
    console.log('\nTest 3: Above vehicle (miss)');
    const s = { x: 0, y: 3, z: 5 };
    const e = { x: 0, y: 3, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (too high)');
}

// 4. Near-side miss
{
    console.log('\nTest 4: Near-side miss');
    const ox = maxX + 0.1;
    const s = { x: ox, y: 1, z: 5 };
    const e = { x: ox, y: 1, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (just outside)');
}

// 5. Rotated vehicle diagonal hit
{
    console.log('\nTest 5: Rotated vehicle diagonal hit');
    const rot = Math.PI / 4;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const ws = { x: 5, y: 1, z: 0 };
    const we = { x: -5, y: 1, z: 0 };
    const ls = {
        x: ws.x * cosR + ws.z * sinR,
        y: ws.y,
        z: -ws.x * sinR + ws.z * cosR,
    };
    const le = {
        x: we.x * cosR + we.z * sinR,
        y: we.y,
        z: -we.x * sinR + we.z * cosR,
    };
    const r = segmentAabbIntersect(ls, le, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit rotated vehicle');
}

// 6. Fast projectile
{
    console.log('\nTest 6: Fast projectile');
    const s = { x: 0, y: 1, z: 20 };
    const e = { x: 0, y: 1, z: -20 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.t > 0 && r.t < 1, 'hit t within segment');
    assertNear(r.t, (20 - maxZ) / 40, 0.01, 'hit t near front face');
}

// 7. Zero X direction
{
    console.log('\nTest 7: Zero X direction');
    const s = { x: 0, y: 1, z: 5 };
    const e = { x: 0, y: 1, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit (no NaN/Infinity)');
    assert(!isNaN(r.t), 't is not NaN');
    assert(!isNaN(r.localPoint.x), 'hitPoint.x is not NaN');
}

// 8. Zero Y direction
{
    console.log('\nTest 8: Zero Y direction');
    const s = { x: 0, y: 1, z: 5 };
    const e = { x: 0, y: 1, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(!isNaN(r.localNormal.y), 'normal.y is not NaN');
}

// 9. Zero Z direction
{
    console.log('\nTest 9: Zero Z direction');
    const s = { x: 5, y: 1, z: 0 };
    const e = { x: -5, y: 1, z: 0 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(!isNaN(r.localNormal.z), 'normal.z is not NaN');
}

// 10. Starting inside
{
    console.log('\nTest 10: Starting inside');
    const s = { x: 0, y: 1, z: 0 };
    const e = { x: 0, y: 1, z: -10 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should report hit (starts inside)');
    assert(r.t === 0, 't=0 (immediate hit)');
}

// 11. Rotated vehicle diagonal miss
{
    console.log('\nTest 11: Rotated vehicle diagonal miss');
    const rot = Math.PI / 4;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const ws = { x: 10, y: 1, z: 10 };
    const we = { x: -10, y: 1, z: 10 };
    const ls = {
        x: ws.x * cosR + ws.z * sinR,
        y: ws.y,
        z: -ws.x * sinR + ws.z * cosR,
    };
    const le = {
        x: we.x * cosR + we.z * sinR,
        y: we.y,
        z: -we.x * sinR + we.z * cosR,
    };
    const r = segmentAabbIntersect(ls, le, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss rotated vehicle');
}

// 12. Below vehicle (miss)
{
    console.log('\nTest 12: Below vehicle (miss)');
    const s = { x: 0, y: -1, z: 5 };
    const e = { x: 0, y: -1, z: -5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (below ground)');
}

// 13. Edge grazing
{
    console.log('\nTest 13: Edge grazing');
    const sx = maxX + 0.0001;
    const ex = -maxX - 0.0001;
    const s = { x: sx, y: 1, z: 0 };
    const e = { x: ex, y: 1, z: 0 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit grazing edge');
}

// 14. Segment entirely before box
{
    console.log('\nTest 14: Segment entirely before box');
    const s = { x: 0, y: 1, z: 10 };
    const e = { x: 0, y: 1, z: 5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (entirely in front)');
}

// 15. Segment entirely behind box
{
    console.log('\nTest 15: Segment entirely behind box');
    const s = { x: 0, y: 1, z: -5 };
    const e = { x: 0, y: 1, z: -10 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (entirely behind)');
}

// 16. Rear hit
{
    console.log('\nTest 16: Rear hit');
    const s = { x: 0, y: 1, z: -5 };
    const e = { x: 0, y: 1, z: 5 };
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit rear');
    assert(r.localNormal.z === -1, 'normal points -Z (rear face)');
}

console.log('\n==========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('SMOKE TEST FAILED');
    process.exit(1);
} else {
    console.log('ALL SMOKE TESTS PASSED');
    process.exit(0);
}
