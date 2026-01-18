// ============================================================
// Shared Corona data structures and class
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

        // Corner gap check: if overhang=1 AND firstSeg=1 at any corner,
        // it's only valid if ALL edges have the same last segment size (symmetric).
        // Asymmetric last segment sizes with 1×1 corners create forced invalid placements.
        let hasCornerGap = false;
        const lastSegSizes: number[] = [];
        
        for (let ei = 0; ei < 4; ei++) {
            const edge = this.edges[ei];
            const nextEdge = this.edges[(ei + 1) % 4];
            
            const segs = [...edge].sort((a, b) => a.offset - b.offset);
            const nextSegs = [...nextEdge].sort((a, b) => a.offset - b.offset);
            
            const lastSeg = segs[segs.length - 1];
            const overhang = lastSeg.offset + lastSeg.size - c;
            const firstSegSize = nextSegs[0].size;
            
            lastSegSizes.push(lastSeg.size);
            
            if (overhang === 1 && firstSegSize === 1) {
                hasCornerGap = true;
            }
        }
        
        // If there's a 1×1 corner gap, check if all last segment sizes are equal
        if (hasCornerGap) {
            const allSameLastSeg = lastSegSizes.every(s => s === lastSegSizes[0]);
            if (!allSameLastSeg) {
                return { ok: false, reason: "1x1 corner gap with asymmetric edges", where: { lastSegSizes } };
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

export { EdgeSeg, Corona, ValidationResult };
