// Simple script to generate and save coronas to JSON
const fs = require('fs');

// Copy of the core logic
class Corona {
    constructor(center, edges) {
        this.center = center;
        this.edges = edges;
    }

    validate(allowedSizes = [1, 2, 3, 4]) {
        const c = this.center;
        if (!Number.isInteger(c) || c <= 0) {
            return { ok: false, reason: "center must be a positive integer" };
        }
        if (!Array.isArray(this.edges) || this.edges.length !== 4) {
            return { ok: false, reason: "edges must have length 4" };
        }
        for (let ei = 0; ei < this.edges.length; ei++) {
            const edge = this.edges[ei];
            if (!edge || edge.length === 0) {
                return { ok: false, reason: "edge empty", where: ei };
            }
            const segs = [...edge].sort((a, b) => 
                a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
            );
            for (const seg of segs) {
                if (!allowedSizes.includes(seg.size) || seg.size <= 0) {
                    return { ok: false, reason: "invalid segment size", where: { ei, seg } };
                }
                if (seg.offset < 0 || seg.offset > c) {
                    return { ok: false, reason: "offset out of range", where: { ei, seg } };
                }
                if (seg.size === c && seg.offset === 0) {
                    return { ok: false, reason: "not unilateral (center-sized aligned)", where: { ei, seg } };
                }
            }
            for (let i = 0; i < segs.length - 1; i++) {
                const a = segs[i];
                const b = segs[i + 1];
                if (a.size === b.size) {
                    return { ok: false, reason: "not unilateral (equal adjacent sizes)", where: { ei, a, b } };
                }
            }
            if (segs[0].offset !== 0) {
                return { ok: false, reason: "edge does not start at 0", where: ei };
            }
            for (let i = 0; i < segs.length - 1; i++) {
                const prev = segs[i];
                const nxt = segs[i + 1];
                if (nxt.offset !== prev.offset + prev.size) {
                    return { ok: false, reason: "invalid edge walk", where: { ei, prev, nxt } };
                }
            }
            const currentEnd = segs[segs.length - 1].offset + segs[segs.length - 1].size;
            if (currentEnd < c) {
                return { ok: false, reason: "edge does not reach center length", where: ei };
            }
        }
        return { ok: true };
    }

    toCompact() {
        const parts = [this.center.toString()];
        for (const edge of this.edges) {
            const edgeSorted = [...edge].sort((a, b) => 
                a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
            );
            parts.push(edgeSorted.map(seg => `${seg.size}^${seg.offset}`).join(","));
        }
        return parts.join("|");
    }
}

function canonicalRotationEdges(edges) {
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

function enumerateUniqueCoronasCenter1() {
    const c = 1;
    const allowedSizes = [1, 2, 3, 4];
    const edgeChoices = [
        [{ size: 2, offset: 0 }],
        [{ size: 3, offset: 0 }],
        [{ size: 4, offset: 0 }]
    ];
    const seen = new Set();
    const unique = [];
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

// Main execution
console.log('Generating coronas for center = 1...');
const coronas = enumerateUniqueCoronasCenter1();
console.log(`Found ${coronas.length} unique coronas`);

// Save to JSON
const outputData = {
    center: 1,
    count: coronas.length,
    generated: new Date().toISOString(),
    coronas: coronas.map(c => c.toCompact())
};

fs.writeFileSync('coronas-center-1.json', JSON.stringify(outputData, null, 2));
console.log('✓ Saved to coronas-center-1.json');

// Display first few
console.log('\nFirst 5 coronas:');
coronas.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.toCompact()}`);
});
