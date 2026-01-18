# ============================================================
# Corona enumeration framework (as developed so far)
# ============================================================

from dataclasses import dataclass
from typing import List, Tuple, Dict, Any
import itertools
import re

# -----------------------------
# Data structures
# -----------------------------

@dataclass(frozen=True)
class EdgeSeg:
    size: int
    offset: int   # must satisfy 0 <= offset <= center


@dataclass
class Corona:
    center: int
    edges: List[List[EdgeSeg]]  # exactly 4 edges, cyclic order

    # -------------------------
    # Validation
    # -------------------------
    def validate(self, allowed_sizes: Tuple[int, ...] = (1, 2, 3, 4)) -> Dict[str, Any]:
        """
        Validation rules (simplified, final version):
          - center > 0
          - exactly 4 edges
          - offsets satisfy 0 <= offset <= center
          - edge is a real walk: next.offset = prev.offset + prev.size
          - walk starts at offset 0
          - walk reaches at least center (overhang allowed)
          - unilateral:
              (a) no two consecutive segments on an edge have the same size
              (b) no segment with size == center at offset == 0
        """
        c = self.center

        if not isinstance(c, int) or c <= 0:
            return {"ok": False, "reason": "center must be a positive integer"}

        if not isinstance(self.edges, list) or len(self.edges) != 4:
            return {"ok": False, "reason": "edges must have length 4"}

        for ei, edge in enumerate(self.edges):
            if not edge:
                return {"ok": False, "reason": "edge empty", "where": ei}

            segs = sorted(edge, key=lambda s: (s.offset, s.size))

            # offsets + sizes
            for seg in segs:
                if seg.size not in allowed_sizes or seg.size <= 0:
                    return {"ok": False, "reason": "invalid segment size", "where": (ei, seg)}
                if seg.offset < 0 or seg.offset > c:
                    return {"ok": False, "reason": "offset out of range", "where": (ei, seg)}
                if seg.size == c and seg.offset == 0:
                    return {"ok": False, "reason": "not unilateral (center-sized aligned)", "where": (ei, seg)}

            # unilateral: no equal sizes consecutively
            for a, b in zip(segs, segs[1:]):
                if a.size == b.size:
                    return {"ok": False, "reason": "not unilateral (equal adjacent sizes)", "where": (ei, a, b)}

            # must start at 0
            if segs[0].offset != 0:
                return {"ok": False, "reason": "edge does not start at 0", "where": ei}

            # real walk + coverage
            current_end = 0
            for prev, nxt in zip(segs, segs[1:]):
                if nxt.offset != prev.offset + prev.size:
                    return {"ok": False, "reason": "invalid edge walk", "where": (ei, prev, nxt)}
                current_end = prev.offset + prev.size

            current_end = segs[-1].offset + segs[-1].size
            if current_end < c:
                return {"ok": False, "reason": "edge does not reach center length", "where": ei}

        return {"ok": True}

    # -------------------------
    # Compact notation printer
    # -------------------------
    def to_compact(self) -> str:
        parts = [str(self.center)]
        for edge in self.edges:
            edge_sorted = sorted(edge, key=lambda s: (s.offset, s.size))
            parts.append(",".join(f"{seg.size}^{seg.offset}" for seg in edge_sorted))
        return "|".join(parts)

    # -------------------------
    # Compact notation parser
    # -------------------------
    @staticmethod
    def from_compact(s: str) -> "Corona":
        """
        Parse compact notation:
          <center>|a^b,c^d|a^b|a^b,c^d|a^b
        """
        text = s.strip().replace(" ", "")
        parts = text.split("|")
        if len(parts) != 5:
            raise ValueError("Expected center + 4 edges")

        center = int(parts[0])
        seg_pat = re.compile(r"^(\d+)\^(-?\d+)$")

        edges: List[List[EdgeSeg]] = []
        for edge_txt in parts[1:]:
            segs: List[EdgeSeg] = []
            for tok in edge_txt.split(","):
                m = seg_pat.match(tok)
                if not m:
                    raise ValueError(f"Bad segment token: {tok}")
                segs.append(EdgeSeg(size=int(m.group(1)), offset=int(m.group(2))))
            edges.append(segs)

        return Corona(center=center, edges=edges)


# -----------------------------
# Canonical rotation (equitransitive dedup)
# -----------------------------

def canonical_rotation_edges(edges: List[List[EdgeSeg]]) -> Tuple:
    """
    Canonical representative of the 4 edges up to cyclic rotation (no reflection).
    """
    def edge_key(e):
        return tuple((seg.size, seg.offset) for seg in sorted(e, key=lambda s: (s.offset, s.size)))

    keys = []
    for k in range(4):
        rot = edges[k:] + edges[:k]
        keys.append(tuple(edge_key(e) for e in rot))
    return min(keys)


# -----------------------------
# Enumeration for center = 1
# -----------------------------

def enumerate_unique_coronas_center_1():
    """
    For center = 1:
      - valid edge walks are exactly one segment (s,0) with s in {2,3,4}
      - (1,0) is excluded by unilateral rule
      - deduplicate by cyclic rotation of the 4 edges
    """
    c = 1
    allowed_sizes = (1, 2, 3, 4)

    edge_choices = [[EdgeSeg(s, 0)] for s in (2, 3, 4)]

    seen = set()
    unique: List[Corona] = []

    for e0, e1, e2, e3 in itertools.product(edge_choices, repeat=4):
        cor = Corona(center=c, edges=[e0, e1, e2, e3])
        if not cor.validate(allowed_sizes)["ok"]:
            continue

        key = canonical_rotation_edges(cor.edges)
        if key in seen:
            continue

        seen.add(key)
        unique.append(cor)

    return unique


# -----------------------------
# Run enumeration
# -----------------------------
if __name__ == "__main__":
    coronas = enumerate_unique_coronas_center_1()
    print("Unique coronas with center = 1:", len(coronas))
    for c in coronas:
        print(c.to_compact())
