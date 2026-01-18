// ============================================================
// Corona enumeration framework (TypeScript version)
// ============================================================

// -----------------------------
// Data structures
// -----------------------------

interface EdgeSeg {
    readonly size: number;
    readonly offset: number;  // must satisfy 0 <= offset <= center
}

interface ValidationResult {
    ok: boolean;
    reason?: string;
    where?: any;
}

class Corona {
    readonly center: number;
    readonly edges: ReadonlyArray<ReadonlyArray<EdgeSeg>>;  // exactly 4 edges, cyclic order

    constructor(center: number, edges: EdgeSeg[][]) {
        this.center = center;
        this.edges = edges;
    }

    // -------------------------
    // Validation
    // -------------------------
    validate(allowedSizes: number[] = [1, 2, 3, 4]): ValidationResult {
        /**
         * Validation rules (simplified, final version):
         *   - center > 0
         *   - exactly 4 edges
         *   - offsets satisfy 0 <= offset <= center
         *   - edge is a real walk: next.offset = prev.offset + prev.size
         *   - walk starts at offset 0
         *   - walk reaches at least center (overhang allowed)
         *   - unilateral:
         *       (a) no two consecutive segments on an edge have the same size
         *       (b) no segment with size == center at offset == 0
         */
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

            // offsets + sizes
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

            // unilateral: no equal sizes consecutively
            for (let i = 0; i < segs.length - 1; i++) {
                const a = segs[i];
                const b = segs[i + 1];
                if (a.size === b.size) {
                    return { ok: false, reason: "not unilateral (equal adjacent sizes)", where: { ei, a, b } };
                }
            }

            // must start at 0
            if (segs[0].offset !== 0) {
                return { ok: false, reason: "edge does not start at 0", where: ei };
            }

            // real walk + coverage
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

    // -------------------------
    // Compact notation printer
    // -------------------------
    toCompact(): string {
        const parts: string[] = [this.center.toString()];
        
        for (const edge of this.edges) {
            const edgeSorted = [...edge].sort((a, b) => 
                a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
            );
            parts.push(edgeSorted.map(seg => `${seg.size}^${seg.offset}`).join(","));
        }
        
        return parts.join("|");
    }

    // -------------------------
    // Compact notation parser
    // -------------------------
    static fromCompact(s: string): Corona {
        /**
         * Parse compact notation:
         *   <center>|a^b,c^d|a^b|a^b,c^d|a^b
         */
        const text = s.trim().replace(/\s/g, "");
        const parts = text.split("|");
        
        if (parts.length !== 5) {
            throw new Error("Expected center + 4 edges");
        }

        const center = parseInt(parts[0], 10);
        const segPat = /^(\d+)\^(-?\d+)$/;

        const edges: EdgeSeg[][] = [];
        
        for (let i = 1; i < parts.length; i++) {
            const edgeTxt = parts[i];
            const segs: EdgeSeg[] = [];
            
            for (const tok of edgeTxt.split(",")) {
                const m = tok.match(segPat);
                if (!m) {
                    throw new Error(`Bad segment token: ${tok}`);
                }
                segs.push({
                    size: parseInt(m[1], 10),
                    offset: parseInt(m[2], 10)
                });
            }
            
            edges.push(segs);
        }

        return new Corona(center, edges);
    }
}

// -----------------------------
// Canonical rotation (equitransitive dedup)
// -----------------------------

function canonicalRotationEdges(edges: ReadonlyArray<ReadonlyArray<EdgeSeg>>): string {
    /**
     * Canonical representative of the 4 edges up to cyclic rotation (no reflection).
     */
    function edgeKey(e: ReadonlyArray<EdgeSeg>): string {
        const sorted = [...e].sort((a, b) => 
            a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
        );
        return JSON.stringify(sorted.map(seg => [seg.size, seg.offset]));
    }

    const keys: string[] = [];
    
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

function enumerateUniqueCoronasCenter1(): Corona[] {
    /**
     * For center = 1:
     *   - valid edge walks are exactly one segment (s,0) with s in {2,3,4}
     *   - (1,0) is excluded by unilateral rule
     *   - deduplicate by cyclic rotation of the 4 edges
     */
    const c = 1;
    const allowedSizes = [1, 2, 3, 4];

    const edgeChoices: EdgeSeg[][] = [
        [{ size: 2, offset: 0 }],
        [{ size: 3, offset: 0 }],
        [{ size: 4, offset: 0 }]
    ];

    const seen = new Set<string>();
    const unique: Corona[] = [];

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

function loadCoronasFromFile(filename: string): Corona[] {
    const fs = require('fs');
    try {
        const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
        return data.coronas.map((compact: string) => Corona.fromCompact(compact));
    } catch (error) {
        console.error(`Error loading coronas from ${filename}:`, error);
        return [];
    }
}

// -----------------------------
// Run enumeration
// -----------------------------

function main(): void {
    const coronas = enumerateUniqueCoronasCenter1();
    console.log(`Unique coronas with center = 1: ${coronas.length}`);
    
    for (const c of coronas) {
        console.log(c.toCompact());
    }
}

// Run if this is the main module
if (require.main === module) {
    main();
}

// Export for use as a module
export { EdgeSeg, Corona, ValidationResult, canonicalRotationEdges, enumerateUniqueCoronasCenter1, loadCoronasFromFile };
