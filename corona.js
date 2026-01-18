// ============================================================
// Shared Corona data structures and class
// ============================================================

/**
 * EdgeSeg: {size: number, offset: number}
 * ValidationResult: {ok: boolean, reason?: string, where?: any}
 */

class Corona {
    constructor(center, edges) {
        this.center = center;
        this.edges = edges;
    }

    // -------------------------
    // Validation
    // -------------------------
    validate(allowedSizes = [1, 2, 3, 4]) {
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

        
        // Corner gap check: detect isolated 1×1 squares
        // A 1×1 square is invalid if surrounded by larger structures:
        // - Previous edge's overhang > 1 (or last segment > 1)
        // - AND next square on same edge > 1 (or next edge's first square > 1)
        
        // Step 1: Compute overhang for each edge
        const overhangs = [];
        const sortedEdges = this.edges.map(edge => [...edge].sort((a, b) => a.offset - b.offset));
        
        for (const segs of sortedEdges) {
            const lastSeg = segs[segs.length - 1];
            const overhang = lastSeg.offset + lastSeg.size - c;
            overhangs.push(overhang);
        }
        
        // Step 2: Check each edge's squares against previous edge's overhang
        for (let ei = 0; ei < 4; ei++) {
            const prevEdgeIdx = (ei + 3) % 4; // Previous edge (cyclically)
            const nextEdgeIdx = (ei + 1) % 4; // Next edge
            
            const segs = sortedEdges[ei];
            const prevOverhang = overhangs[prevEdgeIdx];
            const nextSegs = sortedEdges[nextEdgeIdx];
            
            // Check each square on this edge
            for (let i = 0; i < segs.length; i++) {
                const seg = segs[i];
                
                if (seg.size === 1) {
                    // Check what's before this 1×1 square
                    let beforeSize;
                    if (i === 0) {
                        // First square on edge - check previous edge's overhang
                        beforeSize = prevOverhang;
                    } else {
                        // Not first - check previous square on same edge
                        beforeSize = segs[i - 1].size;
                    }
                    
                    // Check what's after this 1×1 square
                    let afterSize;
                    if (i === segs.length - 1) {
                        // Last square on edge - check next edge's first square
                        afterSize = nextSegs[0].size;
                    } else {
                        // Not last - check next square on same edge
                        afterSize = segs[i + 1].size;
                    }
                    
                    // If surrounded by bigger structures (both > 1), it's invalid
                    if (beforeSize > 1 && afterSize > 1) {
                        return { 
                            ok: false, 
                            reason: "isolated 1x1 square trapped by larger squares", 
                            where: { edge: ei, segment: i, beforeSize, afterSize } 
                        };
                    }
                }
            }
        }

        return { ok: true };
    }

    // -------------------------
    // Compact notation printer
    // -------------------------
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

    // -------------------------
    // Compact notation parser
    // -------------------------
    static fromCompact(s) {
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

        const edges = [];
        
        for (let i = 1; i < parts.length; i++) {
            const edgeTxt = parts[i];
            const segs = [];
            
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

// Export for ES modules
export { Corona };
