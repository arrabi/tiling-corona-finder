// ============================================================
// Corona enumeration framework (JavaScript version)
// ============================================================

import { Corona } from './corona.js';

// -----------------------------
// Canonical rotation (equitransitive dedup)
// -----------------------------

function canonicalRotationEdges(edges) {
    /**
     * Canonical representative of the 4 edges up to cyclic rotation (no reflection).
     */
    function edgeKey(e) {
        const sorted = [...e].sort((a, b) => 
            a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
        );
        return JSON.stringify(sorted.map(seg => [seg.size, seg.offset]));
    }

    const keys = [];
    
    for (let k = 0; k < 4; k++) {
        const rot = [...edges.slice(k), ...edges.slice(0, k)];
        const rotKey = rot.map(e => edgeKey(e)).join(";");
        keys.push(rotKey);
    }
    
    keys.sort();
    return keys[0];
}

// -----------------------------
// Enumeration for center = 1
// -----------------------------

function enumerateUniqueCoronasCenter1() {
    /**
     * For center = 1:
     *   - valid edge walks are exactly one segment (s,0) with s in {2,3,4}
     *   - (1,0) is excluded by unilateral rule
     *   - deduplicate by cyclic rotation of the 4 edges
     */
    const c = 1;
    const allowedSizes = [1, 2, 3, 4];

    const edgeChoices = [
        [{ size: 2, offset: 0 }],
        [{ size: 3, offset: 0 }],
        [{ size: 4, offset: 0 }]
    ];

    const seen = new Set();
    const unique = [];

    // Generate all combinations of 4 edges
    for (const e0 of edgeChoices) {
        for (const e1 of edgeChoices) {
            for (const e2 of edgeChoices) {
                for (const e3 of edgeChoices) {
                    const cor = new Corona(c, [e0, e1, e2, e3]);
                    
                    if (!cor.validate(allowedSizes).ok) {
                        continue;
                    }

                    const key = canonicalRotationEdges(cor.edges);
                    if (seen.has(key)) {
                        continue;
                    }

                    seen.add(key);
                    unique.push(cor);
                }
            }
        }
    }

    return unique;
}

// -----------------------------
// Load coronas from JSON file
// -----------------------------

function loadCoronasFromFile(filename) {
    const fs = require('fs');
    try {
        const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
        return data.coronas.map((compact) => Corona.fromCompact(compact));
    } catch (error) {
        console.error(`Error loading coronas from ${filename}:`, error);
        return [];
    }
}

// -----------------------------
// Run enumeration
// -----------------------------

function main() {
    const coronas = enumerateUniqueCoronasCenter1();
    console.log(`Unique coronas with center = 1: ${coronas.length}`);
    
    for (const c of coronas) {
        console.log(c.toCompact());
    }
}

// Run if this is the main module (only in Node.js)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export for use as a module
export { Corona, canonicalRotationEdges, enumerateUniqueCoronasCenter1, loadCoronasFromFile };
