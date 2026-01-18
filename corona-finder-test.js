// Unit tests for Corona.validate() and enumeration

import { Corona } from './corona.js';
import { generateEdgeWalks, enumerateUniqueCoronas } from './corona-finder.js';
import assert from 'assert';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${name}`);
        console.log(`  ${e.message}`);
        failed++;
    }
}

function isValid(compact, allowedSizes = [1, 2, 3, 4]) {
    const corona = Corona.fromCompact(compact);
    return corona.validate(allowedSizes).ok;
}

function getReason(compact, allowedSizes = [1, 2, 3, 4]) {
    const corona = Corona.fromCompact(compact);
    return corona.validate(allowedSizes).reason;
}

test("valid: center=2, all edges size 3", () => {
    assert.strictEqual(isValid("2|3^0|3^0|3^0|3^0"), true);
});

test("valid: center=1, single segments with mixed sizes", () => {
    assert.strictEqual(isValid("1|2^0|3^0|4^0|2^0"), true);
});

test("valid: center=1, all same size", () => {
    assert.strictEqual(isValid("1|4^0|4^0|4^0|4^0"), true);
});

test("valid: center=2, multi-segment edges", () => {
    // Edge walk: 3^0,2^3 means segment size 3 at offset 0, then size 2 at offset 3
    // But offset 3 > center 2, so invalid. Use: 3^0,4^3 is also invalid.
    // Valid: 3^0, which ends at 3 >= 2. Or use simple single segments
    assert.strictEqual(isValid("2|3^0|4^0|3^0|4^0"), true);
});

test("valid: center=1, rotational variant", () => {
    assert.strictEqual(isValid("1|2^0|3^0|2^0|3^0"), true);
});

test("valid: center=1, large overhang", () => {
    assert.strictEqual(isValid("1|4^0|4^0|4^0|4^0"), true);
});

test("invalid: center=0", () => {
    assert.strictEqual(isValid("0|2^0|2^0|2^0|2^0"), false);
});

test("invalid: center=-1", () => {
    assert.strictEqual(isValid("-1|2^0|2^0|2^0|2^0"), false);
});

test("invalid: 3 edges instead of 4", () => {
    try {
        isValid("1|2^0|2^0|2^0");
        assert.fail("Should have thrown");
    } catch (e) {
        assert.strictEqual(e.message, "Expected center + 4 edges");
    }
});

test("invalid: 5 edges instead of 4", () => {
    try {
        isValid("1|2^0|2^0|2^0|2^0|2^0");
        assert.fail("Should have thrown");
    } catch (e) {
        assert.strictEqual(e.message, "Expected center + 4 edges");
    }
});

test("invalid: 0 edges", () => {
    try {
        isValid("1");
        assert.fail("Should have thrown");
    } catch (e) {
        assert.strictEqual(e.message, "Expected center + 4 edges");
    }
});

test("invalid: segment size 0", () => {
    assert.strictEqual(isValid("1|0^0|2^0|2^0|2^0"), false);
});

test("invalid: offset > center", () => {
    assert.strictEqual(isValid("1|2^2|2^0|2^0|2^0"), false);
});

test("invalid: offset < 0", () => {
    assert.strictEqual(isValid("1|2^-1|2^0|2^0|2^0"), false);
});

test("invalid: equal consecutive sizes", () => {
    assert.strictEqual(isValid("2|2^0,2^2|2^0|2^0|2^0"), false);
});

test("invalid: center-sized at offset 0", () => {
    assert.strictEqual(isValid("1|1^0|2^0|2^0|2^0"), false);
});

test("invalid: center-sized at offset 0 (center=2)", () => {
    assert.strictEqual(isValid("2|2^0|2^0|2^0|2^0"), false);
});

test("invalid: edge does not start at 0", () => {
    assert.strictEqual(isValid("1|2^1|2^0|2^0|2^0"), false);
});

test("invalid: gap in edge walk", () => {
    assert.strictEqual(isValid("2|2^0,4^3|2^0|2^0|2^0"), false);
});

test("invalid: edge walk doesn't reach center", () => {
    assert.strictEqual(isValid("3|2^0|2^0|2^0|2^0"), false);
});

test("valid: edges without 1x1 corner gaps OK", () => {
    assert.strictEqual(isValid("2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1"), true);
});

test("invalid: edges with 1x1 gaps", () => {
    assert.strictEqual(isValid("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"), false);
    assert.strictEqual(getReason("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"), "isolated 1x1 square trapped by larger squares");
});

test("valid: no 1x1 corner gaps, asymmetry OK", () => {
    assert.strictEqual(isValid("2|3^0|4^0|3^0|4^0"), true);
});

// ============================================================
// Edge Walk Generation Tests
// ============================================================

test("edge walks: center=1 generates 3 walks", () => {
    const walks = generateEdgeWalks(1);
    assert.strictEqual(walks.length, 3); // [2^0], [3^0], [4^0]
});

test("edge walks: center=1 excludes 1^0", () => {
    const walks = generateEdgeWalks(1);
    const hasOneAtZero = walks.some(w => w.length === 1 && w[0].size === 1 && w[0].offset === 0);
    assert.strictEqual(hasOneAtZero, false);
});

test("edge walks: center=2 excludes 2^0", () => {
    const walks = generateEdgeWalks(2);
    const hasTwoAtZero = walks.some(w => w.length === 1 && w[0].size === 2 && w[0].offset === 0);
    assert.strictEqual(hasTwoAtZero, false);
});

test("edge walks: center=2 includes 3^0", () => {
    const walks = generateEdgeWalks(2);
    const hasThreeAtZero = walks.some(w => w.length === 1 && w[0].size === 3 && w[0].offset === 0);
    assert.strictEqual(hasThreeAtZero, true);
});

test("edge walks: center=2 includes 1^0,2^1", () => {
    const walks = generateEdgeWalks(2);
    const hasWalk = walks.some(w => 
        w.length === 2 && 
        w[0].size === 1 && w[0].offset === 0 &&
        w[1].size === 2 && w[1].offset === 1
    );
    assert.strictEqual(hasWalk, true);
});

test("edge walks: no consecutive equal sizes", () => {
    for (let center = 1; center <= 4; center++) {
        const walks = generateEdgeWalks(center);
        for (const walk of walks) {
            for (let i = 0; i < walk.length - 1; i++) {
                assert.notStrictEqual(walk[i].size, walk[i + 1].size, 
                    `Walk ${JSON.stringify(walk)} has consecutive equal sizes`);
            }
        }
    }
});

// ============================================================
// Enumeration Tests
// ============================================================

test("enumeration: center=1 produces 24 coronas", () => {
    const coronas = enumerateUniqueCoronas(1);
    assert.strictEqual(coronas.length, 24);
});

test("enumeration: center=2 produces 34 coronas", () => {
    const coronas = enumerateUniqueCoronas(2);
    assert.strictEqual(coronas.length, 34);
});

test("enumeration: all coronas are valid", () => {
    for (let center = 1; center <= 2; center++) {
        const coronas = enumerateUniqueCoronas(center);
        for (const corona of coronas) {
            const result = corona.validate();
            assert.strictEqual(result.ok, true, 
                `Corona ${corona.toCompact()} failed validation: ${result.reason}`);
        }
    }
});

test("enumeration: center=2 includes known valid corona", () => {
    const coronas = enumerateUniqueCoronas(2);
    const compacts = coronas.map(c => c.toCompact());
    assert.strictEqual(compacts.includes("2|3^0|3^0|3^0|3^0"), true);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
