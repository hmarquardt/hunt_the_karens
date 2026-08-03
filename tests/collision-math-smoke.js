// Milestone 7.1 Collision Math Smoke Tests
// Pure math tests — no DOM, no WebGL, no external dependencies.

class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vec3(this.x, this.y, this.z); }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
}

const EPSILON = 1e-6;

function segmentAabbIntersect(
    start, end,
    minX, minY, minZ,
    maxX, maxY, maxZ,
) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;

    let tMin = 0;
    let tMax = 1;
    let hitAxis = -1;
    let hitSign = 0;

    // X
    if (Math.abs(dx) < EPSILON) {
        if (start.x < minX || start.x > maxX) return { hit: false };
    } else {
        let t0 = (minX - start.x) / dx;
        let t1 = (maxX - start.x) / dx;
        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }
        if (t0 > tMin) { tMin = t0; hitAxis = 0; hitSign = t0 === (minX - start.x) / dx ? -1 : 1; }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    // Y
    if (Math.abs(dy) < EPSILON) {
        if (start.y < minY || start.y > maxY) return { hit: false };
    } else {
        let t0 = (minY - start.y) / dy;
        let t1 = (maxY - start.y) / dy;
        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }
        if (t0 > tMin) { tMin = t0; hitAxis = 1; hitSign = t0 === (minY - start.y) / dy ? -1 : 1; }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    // Z
    if (Math.abs(dz) < EPSILON) {
        if (start.z < minZ || start.z > maxZ) return { hit: false };
    } else {
        let t0 = (minZ - start.z) / dz;
        let t1 = (maxZ - start.z) / dz;
        if (t0 > t1) { const tmp = t0; t0 = t1; t1 = tmp; }
        if (t0 > tMin) { tMin = t0; hitAxis = 2; hitSign = t0 === (minZ - start.z) / dz ? -1 : 1; }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    if (tMin < 0 || tMin > 1) return { hit: false };

    if (tMin === 0) {
        if (hitAxis === -1) {
            hitAxis = Math.abs(dx) > Math.abs(dz) ? 0 : 2;
            hitSign = hitAxis === 0 ? Math.sign(dx) || 1 : Math.sign(dz) || 1;
        }
    }

    const localNormal = new Vec3(0, 0, 0);
    if (hitAxis === 0) localNormal.set(hitSign, 0, 0);
    else if (hitAxis === 1) localNormal.set(0, hitSign, 0);
    else localNormal.set(0, 0, hitSign);

    const dir = new Vec3(dx, dy, dz);
    const hitPoint = start.clone().addScaledVector(dir, tMin);

    return {
        hit: true,
        t: tMin,
        localPoint: hitPoint,
        localNormal,
    };
}

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
    const s = new Vec3(0, 1, 5);
    const e = new Vec3(0, 1, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.localNormal.z === 1, 'normal points +Z (front face)');
    assertNear(r.localPoint.z, maxZ, 0.01, 'hit point at front face');
}

// 2. Side hit
{
    console.log('\nTest 2: Side hit');
    const s = new Vec3(5, 1, 0);
    const e = new Vec3(-5, 1, 0);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.localNormal.x === 1, 'normal points +X (outward from maxX entry face)');
    assertNear(r.localPoint.x, maxX, 0.01, 'hit point at side face');
}

// 3. Above vehicle (miss)
{
    console.log('\nTest 3: Above vehicle (miss)');
    const s = new Vec3(0, 3, 5);
    const e = new Vec3(0, 3, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (too high)');
}

// 4. Near-side miss
{
    console.log('\nTest 4: Near-side miss');
    const ox = maxX + 0.1;
    const s = new Vec3(ox, 1, 5);
    const e = new Vec3(ox, 1, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (just outside)');
}

// 5. Rotated vehicle diagonal hit
{
    console.log('\nTest 5: Rotated vehicle diagonal hit');
    const rot = Math.PI / 4;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const ws = new Vec3(5, 1, 0);
    const we = new Vec3(-5, 1, 0);
    const ls = new Vec3(ws.x * cosR + ws.z * sinR, ws.y, -ws.x * sinR + ws.z * cosR);
    const le = new Vec3(we.x * cosR + we.z * sinR, we.y, -we.x * sinR + we.z * cosR);
    const r = segmentAabbIntersect(ls, le, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit rotated vehicle');
}

// 6. Fast projectile
{
    console.log('\nTest 6: Fast projectile');
    const s = new Vec3(0, 1, 20);
    const e = new Vec3(0, 1, -20);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(r.t > 0 && r.t < 1, 'hit t within segment');
    assertNear(r.t, (20 - maxZ) / 40, 0.01, 'hit t near front face');
}

// 7. Zero X direction
{
    console.log('\nTest 7: Zero X direction');
    const s = new Vec3(0, 1, 5);
    const e = new Vec3(0, 1, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit (no NaN/Infinity)');
    assert(!isNaN(r.t), 't is not NaN');
    assert(!isNaN(r.localPoint.x), 'hitPoint.x is not NaN');
}

// 8. Zero Y direction
{
    console.log('\nTest 8: Zero Y direction');
    const s = new Vec3(0, 1, 5);
    const e = new Vec3(0, 1, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(!isNaN(r.localNormal.y), 'normal.y is not NaN');
}

// 9. Zero Z direction
{
    console.log('\nTest 9: Zero Z direction');
    const s = new Vec3(5, 1, 0);
    const e = new Vec3(-5, 1, 0);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit');
    assert(!isNaN(r.localNormal.z), 'normal.z is not NaN');
}

// 10. Starting inside
{
    console.log('\nTest 10: Starting inside');
    const s = new Vec3(0, 1, 0);
    const e = new Vec3(0, 1, -10);
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
    const ws = new Vec3(10, 1, 10);
    const we = new Vec3(-10, 1, 10);
    const ls = new Vec3(ws.x * cosR + ws.z * sinR, ws.y, -ws.x * sinR + ws.z * cosR);
    const le = new Vec3(we.x * cosR + we.z * sinR, we.y, -we.x * sinR + we.z * cosR);
    const r = segmentAabbIntersect(ls, le, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss rotated vehicle');
}

// 12. Below vehicle (miss)
{
    console.log('\nTest 12: Below vehicle (miss)');
    const s = new Vec3(0, -1, 5);
    const e = new Vec3(0, -1, -5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (below ground)');
}

// 13. Edge grazing
{
    console.log('\nTest 13: Edge grazing');
    const sx = maxX + 0.0001;
    const ex = -maxX - 0.0001;
    const s = new Vec3(sx, 1, 0);
    const e = new Vec3(ex, 1, 0);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(r.hit, 'should hit grazing edge');
}

// 14. Segment entirely before box
{
    console.log('\nTest 14: Segment entirely before box');
    const s = new Vec3(0, 1, 10);
    const e = new Vec3(0, 1, 5);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (entirely in front)');
}

// 15. Segment entirely behind box
{
    console.log('\nTest 15: Segment entirely behind box');
    const s = new Vec3(0, 1, -5);
    const e = new Vec3(0, 1, -10);
    const r = segmentAabbIntersect(s, e, minX, minY, minZ, maxX, maxY, maxZ);
    assert(!r.hit, 'should miss (entirely behind)');
}

// 16. Rear hit
{
    console.log('\nTest 16: Rear hit');
    const s = new Vec3(0, 1, -5);
    const e = new Vec3(0, 1, 5);
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
