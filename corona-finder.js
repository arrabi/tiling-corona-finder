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
// Generate edge walks for any center size
// -----------------------------

function generateEdgeWalks(centerSize, allowedSizes = [1, 2, 3, 4]) {
    /**
     * Generate all valid edge walks that cover a given center size.
     * 
     * Rules:
     * - Walk must start at offset 0
     * - Each segment has {size, offset}
     * - Next segment offset = prev offset + prev size (real walk)
     * - Walk must reach at least centerSize
     * - No segment with size == centerSize at offset == 0 (unilateral)
     * - No consecutive segments with equal sizes (unilateral)
     * 
     * Returns: array of edge walks, where each walk is an array of segments
     */
    const walks = [];
    
    function search(currentWalk, currentOffset) {
        // If we've reached or exceeded the center length, this is a valid walk
        if (currentOffset >= centerSize) {
            walks.push([...currentWalk]);
            return;
        }
        
        // Try adding each allowed size
        for (const size of allowedSizes) {
            // Check unilateral constraint: no size == center at offset == 0
            if (currentOffset === 0 && size === centerSize) {
                continue;
            }
            
            // Check unilateral constraint: no consecutive equal sizes
            if (currentWalk.length > 0) {
                const lastSeg = currentWalk[currentWalk.length - 1];
                if (lastSeg.size === size) {
                    continue;
                }
            }
            
            // Add segment and continue search
            currentWalk.push({ size, offset: currentOffset });
            search(currentWalk, currentOffset + size);
            currentWalk.pop();
        }
    }
    
    search([], 0);
    return walks;
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
    return enumerateUniqueCoronas(1);
}

// -----------------------------
// Enumeration for center = 2
// -----------------------------

function enumerateUniqueCoronasCenter2() {
    /**
     * For center = 2:
     *   - valid edge walks cover length 2
     *   - (2,0) is excluded by unilateral rule
     *   - deduplicate by cyclic rotation of the 4 edges
     */
    return enumerateUniqueCoronas(2);
}

// -----------------------------
// Generic enumeration for any center size
// -----------------------------

function enumerateUniqueCoronas(centerSize, allowedSizes = [1, 2, 3, 4]) {
    /**
     * Enumerate all unique coronas for a given center size.
     * Deduplicates by cyclic rotation of the 4 edges.
     */
    const edgeChoices = generateEdgeWalks(centerSize, allowedSizes);
    
    const seen = new Set();
    const unique = [];

    // Generate all combinations of 4 edges
    for (const e0 of edgeChoices) {
        for (const e1 of edgeChoices) {
            for (const e2 of edgeChoices) {
                for (const e3 of edgeChoices) {
                    const cor = new Corona(centerSize, [e0, e1, e2, e3]);
                    
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
    console.log('Enumerating coronas for center = 1...');
    const coronas1 = enumerateUniqueCoronasCenter1();
    console.log(`Unique coronas with center = 1: ${coronas1.length}`);
    
    console.log('\nEnumerating coronas for center = 2...');
    const coronas2 = enumerateUniqueCoronasCenter2();
    console.log(`Unique coronas with center = 2: ${coronas2.length}`);
    
    console.log('\nSample 2-coronas:');
    for (let i = 0; i < Math.min(5, coronas2.length); i++) {
        console.log(coronas2[i].toCompact());
    }
}

// Run if this is the main module (only in Node.js)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export for use as a module
export { 
    Corona, 
    canonicalRotationEdges, 
    generateEdgeWalks,
    enumerateUniqueCoronas,
    enumerateUniqueCoronasCenter1, 
    enumerateUniqueCoronasCenter2,
    loadCoronasFromFile 
};
