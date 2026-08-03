/**
 * Pure collision math utilities — no DOM, no WebGL, no Three.js.
 * Returns plain numeric data structures.
 */

const EPSILON = 1e-6;

/**
 * Segment-vs-AABB intersection using slab intersection.
 *
 * @param {object} start - {x, y, z}
 * @param {object} end   - {x, y, z}
 * @param {number} minX
 * @param {number} minY
 * @param {number} minZ
 * @param {number} maxX
 * @param {number} maxY
 * @param {number} maxZ
 * @returns {{hit: boolean, t?: number, localPoint?: {x:number,y:number,z:number}, localNormal?: {x:number,y:number,z:number}}}
 */
export function segmentAabbIntersect(
    start,
    end,
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

    // X axis
    if (Math.abs(dx) < EPSILON) {
        if (start.x < minX || start.x > maxX) return { hit: false };
    } else {
        let t0 = (minX - start.x) / dx;
        let t1 = (maxX - start.x) / dx;
        if (t0 > t1) {
            const tmp = t0; t0 = t1; t1 = tmp;
        }
        if (t0 > tMin) {
            tMin = t0;
            hitAxis = 0;
            hitSign = t0 === (minX - start.x) / dx ? -1 : 1;
        }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    // Y axis
    if (Math.abs(dy) < EPSILON) {
        if (start.y < minY || start.y > maxY) return { hit: false };
    } else {
        let t0 = (minY - start.y) / dy;
        let t1 = (maxY - start.y) / dy;
        if (t0 > t1) {
            const tmp = t0; t0 = t1; t1 = tmp;
        }
        if (t0 > tMin) {
            tMin = t0;
            hitAxis = 1;
            hitSign = t0 === (minY - start.y) / dy ? -1 : 1;
        }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    // Z axis
    if (Math.abs(dz) < EPSILON) {
        if (start.z < minZ || start.z > maxZ) return { hit: false };
    } else {
        let t0 = (minZ - start.z) / dz;
        let t1 = (maxZ - start.z) / dz;
        if (t0 > t1) {
            const tmp = t0; t0 = t1; t1 = tmp;
        }
        if (t0 > tMin) {
            tMin = t0;
            hitAxis = 2;
            hitSign = t0 === (minZ - start.z) / dz ? -1 : 1;
        }
        if (t1 < tMax) tMax = t1;
        if (tMin > tMax) return { hit: false };
    }

    if (tMin < 0 || tMin > 1) return { hit: false };

    // Starting inside the box
    if (tMin === 0 && hitAxis === -1) {
        hitAxis = Math.abs(dx) > Math.abs(dz) ? 0 : 2;
        hitSign = hitAxis === 0 ? (Math.sign(dx) || 1) : (Math.sign(dz) || 1);
    }

    const localNormal = { x: 0, y: 0, z: 0 };
    if (hitAxis === 0) { localNormal.x = hitSign; }
    else if (hitAxis === 1) { localNormal.y = hitSign; }
    else { localNormal.z = hitSign; }

    const hitPoint = {
        x: start.x + dx * tMin,
        y: start.y + dy * tMin,
        z: start.z + dz * tMin,
    };

    return {
        hit: true,
        t: tMin,
        localPoint: hitPoint,
        localNormal,
    };
}
