// Unit tests for Corona.validate()

import { Corona } from './corona.js';
import assert from 'assert';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e: any) {
        console.log(`✗ ${name}`);
        console.log(`  ${e.message}`);
        failed++;
    }
}

// Helper to create Corona from compact notation and validate
function isValid(compact: string, allowedSizes = [1, 2, 3, 4]): boolean {
    const corona = Corona.fromCompact(compact);
    return corona.validate(allowedSizes).ok;
}

function getReason(compact: string, allowedSizes = [1, 2, 3, 4]): string | undefined {
    const corona = Corona.fromCompact(compact);
    return corona.validate(allowedSizes).reason;
}

// =====================
// Valid coronas
// =====================

test("valid: center=2, all edges size 3", () => {
    // No 1x1 corner gaps: overhang=1 but next edge starts with size 3
    assert.strictEqual(isValid("2|3^0|3^0|3^0|3^0"), true);
});

test("valid: center=2, mixed sizes 3 and 4", () => {
    assert.strictEqual(isValid("2|3^0|3^0|3^0|4^0"), true);
});

test("valid: center=1, single segment size 2", () => {
    assert.strictEqual(isValid("1|2^0|2^0|2^0|2^0"), true);
});

test("valid: center=1, mixed sizes 2,3,4", () => {
    assert.strictEqual(isValid("1|2^0|3^0|4^0|2^0"), true);
});

test("valid: center=3, edge with overhang", () => {
    // 4^0 covers 0-4 > 3, overhang allowed. No 1x1 gaps.
    assert.strictEqual(isValid("3|4^0|4^0|4^0|4^0"), true);
});

// =====================
// Invalid: center issues
// =====================

test("invalid: center=0", () => {
    const c = new Corona(0, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    assert.strictEqual(c.validate().ok, false);
    assert.strictEqual(c.validate().reason, "center must be a positive integer");
});

test("invalid: center=-1", () => {
    const c = new Corona(-1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    assert.strictEqual(c.validate().ok, false);
    assert.strictEqual(c.validate().reason, "center must be a positive integer");
});

// =====================
// Invalid: edge count
// =====================

test("invalid: only 3 edges", () => {
    const c = new Corona(1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    assert.strictEqual(c.validate().ok, false);
    assert.strictEqual(c.validate().reason, "edges must have length 4");
});

test("invalid: 5 edges", () => {
    const c = new Corona(1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    assert.strictEqual(c.validate().ok, false);
    assert.strictEqual(c.validate().reason, "edges must have length 4");
});

// =====================
// Invalid: empty edge
// =====================

test("invalid: empty edge", () => {
    const c = new Corona(1, [[{size:2,offset:0}],[],[{size:2,offset:0}],[{size:2,offset:0}]]);
    assert.strictEqual(c.validate().ok, false);
    assert.strictEqual(c.validate().reason, "edge empty");
});

// =====================
// Invalid: segment size not in allowed list
// =====================

test("invalid: segment size 5 not allowed", () => {
    assert.strictEqual(isValid("1|5^0|2^0|2^0|2^0"), false);
    assert.strictEqual(getReason("1|5^0|2^0|2^0|2^0"), "invalid segment size");
});

// =====================
// Invalid: offset out of range
// =====================

test("invalid: negative offset", () => {
    const c = new Corona(2, [[{size:2,offset:-1}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "offset out of range");
});

test("invalid: offset > center", () => {
    const c = new Corona(2, [[{size:2,offset:3}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "offset out of range");
});

// =====================
// Invalid: unilateral - center-sized at offset 0
// =====================

test("invalid: unilateral - center-sized segment at offset 0", () => {
    // center=2, segment size=2 at offset=0 violates unilateral rule
    assert.strictEqual(isValid("2|2^0|2^0|2^0|2^0"), false);
    assert.strictEqual(getReason("2|2^0|2^0|2^0|2^0"), "not unilateral (center-sized aligned)");
});

test("invalid: unilateral - center=1, size=1 at offset=0", () => {
    assert.strictEqual(isValid("1|1^0|2^0|2^0|2^0"), false);
    assert.strictEqual(getReason("1|1^0|2^0|2^0|2^0"), "not unilateral (center-sized aligned)");
});

// =====================
// Invalid: unilateral - consecutive equal sizes
// =====================

test("invalid: unilateral - two consecutive segments same size", () => {
    // center=3, edge with 1^0,1^1 - two size-1 segments consecutive
    const c = new Corona(3, [
        [{size:1,offset:0},{size:1,offset:1},{size:2,offset:2}],
        [{size:4,offset:0}],
        [{size:4,offset:0}],
        [{size:4,offset:0}]
    ]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "not unilateral (equal adjacent sizes)");
});

// =====================
// Invalid: edge does not start at 0
// =====================

test("invalid: edge does not start at offset 0", () => {
    const c = new Corona(2, [
        [{size:2,offset:1}],  // starts at 1, not 0
        [{size:3,offset:0}],
        [{size:3,offset:0}],
        [{size:3,offset:0}]
    ]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "edge does not start at 0");
});

// =====================
// Invalid: edge walk has gaps
// =====================

test("invalid: edge walk has gap", () => {
    // 1^0 ends at 1, but next segment starts at 3 (gap)
    const c = new Corona(4, [
        [{size:1,offset:0},{size:2,offset:3}],
        [{size:4,offset:0}],
        [{size:4,offset:0}],
        [{size:4,offset:0}]
    ]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "invalid edge walk");
});

// =====================
// Invalid: edge does not reach center
// =====================

test("invalid: edge too short", () => {
    // center=4, but edge only covers 1 (size 1 at offset 0)
    const c = new Corona(4, [
        [{size:1,offset:0}],
        [{size:4,offset:0}],
        [{size:4,offset:0}],
        [{size:4,offset:0}]
    ]);
    const result = c.validate();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, "edge does not reach center length");
});

// =====================
// Edge case: overhang is OK
// =====================

test("valid: overhang allowed (edge extends past center)", () => {
    // center=2, all edges size 4 cover 0-4 > 2 (overhang OK), no 1x1 gaps
    assert.strictEqual(isValid("2|4^0|4^0|4^0|4^0"), true);
});

// =====================
// Corner gap with asymmetric edges
// =====================

test("valid: symmetric edges with 1x1 corner gaps OK", () => {
    // All edges have same pattern (1^0,2^1), all last segs are size 2
    // Symmetric → valid even with overhang=1 and firstSeg=1
    assert.strictEqual(isValid("2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1"), true);
});

test("invalid: asymmetric edges with 1x1 corner gaps", () => {
    // Edges 0,1 end with size 2; edges 2,3 end with size 4
    // Asymmetric last segment sizes create invalid corner placements
    // The 1×1 square at start of edge is trapped between larger structures
    assert.strictEqual(isValid("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"), false);
    assert.strictEqual(getReason("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"), "isolated 1x1 square trapped by larger squares");
});

test("valid: no 1x1 corner gaps, asymmetry OK", () => {
    // Edge 0: 3^0 → overhang = 1, but next edge starts with size 4 (not 1)
    // No 1x1 gaps, so asymmetry doesn't matter
    assert.strictEqual(isValid("2|3^0|4^0|3^0|4^0"), true);
});

// =====================
// Summary
// =====================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
